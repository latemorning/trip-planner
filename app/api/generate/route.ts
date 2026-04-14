import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import type { TripInput, Day } from '@/types'
import { buildMockNDJSON } from '@/lib/mock-itinerary'
import { geocodeLocations } from '@/lib/geocode-server'

function getClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultHeaders: {
      'anthropic-beta': 'advisor-tool-2026-03-01',
    },
  })
}

// 오피넷 실시간 휘발유 평균가 조회
async function getGasolinePrice(): Promise<{ price: number; source: string }> {
  const apiKey = process.env.OPINET_API_KEY
  if (apiKey) {
    try {
      const res = await fetch(
        `https://www.opinet.co.kr/api/avgAllPrice.do?code=${apiKey}&out=json`,
        { next: { revalidate: 3600 } }
      )
      const data = await res.json()
      const oilList: { PRODCD: string; PRICE: number }[] = data?.RESULT?.OIL ?? []
      const gasoline = oilList.find((o) => o.PRODCD === 'B027')
      if (gasoline?.PRICE) {
        return { price: Math.round(gasoline.PRICE), source: '오피넷 실시간' }
      }
    } catch { /* fallback */ }
  }
  return { price: 1680, source: '전국 평균 추정값' }
}

const SYSTEM_PROMPT = `당신은 한국 국내 여행 전문가입니다. 자차 이동을 기본으로, 출발지와 목적지를 고려하여 이동 경로가 최적화된 여행 일정을 생성하세요.

이동 원칙 (자차 기준):
- 이동 수단은 자차(자가용)를 기본으로 한다
- 첫날 첫 activity: 출발지 → 목적지 자차 이동 (고속도로 경로, 예상 소요 시간 포함)
- 마지막 날 마지막 activity: 귀가 자차 이동
- 하루 적정 이동 거리: 총 이동 300km 이내 권장
- 하루 내 활동 순서: 지리적으로 인접한 장소 순서로 배치해 이동 거리 최소화
- 주요 관광지 간 이동 시 소요 시간을 time에 반영

연료비 계산 (반드시 적용):
- 연비: 12km/L (일반 승용차 기준)
- 유가 및 거리는 프롬프트에서 제공됨
- 연료비 = 구간거리(km) ÷ 12 × 리터당유가(원), 소수점 반올림
- 이동 activity의 estimatedCost에 연료비 반영
- 고속도로 통행료도 구간에 따라 추정하여 포함

인원별 경비 계산 (반드시 적용):
- 인원 구성은 프롬프트에서 제공됨 (어른/아이 구분)
- 입장료: 어른 요금 × 어른 수 + 아이 요금(보통 50%) × 아이 수
- 식비: 1인 식사 비용 × 총 인원 (아이는 0.6배 적용)
- 숙소: 기본 2인 요금 + 추가 인원 요금 (보통 1인당 20,000~30,000원)
- estimatedCost는 반드시 전체 인원 합산 금액으로 계산

location 필드 규칙 (OpenStreetMap 검색 정확도):
- 장소 이름이 전국적으로 유일한 경우: "불국사", "석굴암", "경복궁" 처럼 고유 명칭 그대로
- 동명이인 가능성이 있는 관광지·명소: 반드시 "경주 첨성대", "경주 동궁과 월지" 처럼 지역명 + 장소명
- 상권/골목: "경주 황리단길", "부산 감천문화마을" 처럼 지역명 + 장소명
- 박물관/시설: "국립경주박물관", "국립중앙박물관" 등 전체 공식명
- 숙소: 실제 숙소명 또는 "경주시 황남동" 처럼 구체적인 동네명
- 자차 이동 activity: 출발지 또는 도착지의 구체적인 지명 (예: "경주 IC", "안양시 만안구")
- 절대 사용 금지: 모호한 표현 ("근처 식당", "주변 카페"), 존재하지 않는 장소명

규칙:
1. 하루 일정 하나를 JSON 한 줄로 출력합니다
2. 날짜마다 줄바꿈(\\n)으로 구분합니다
3. 설명 텍스트 없이 JSON만 출력합니다

각 줄 형식 (정확히 준수):
{"date":"YYYY-MM-DD","activities":[{"id":"고유문자열","time":"HH:MM","title":"장소명","description":"설명","estimatedCost":원화정수,"location":"카카오맵검색용장소명"}]}`

/** NDJSON 문자열을 Day 배열로 파싱 */
function parseNDJSON(text: string): Day[] {
  const days: Day[] = []
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try { days.push(JSON.parse(trimmed) as Day) } catch { /* 무시 */ }
  }
  return days
}

/** days의 모든 location을 서버 geocoding 후 coords 부착 */
async function attachCoords(days: Day[], originLocation: string): Promise<{
  days: Day[]
  originCoords: { lat: number; lng: number } | null
}> {
  const activityLocations = days.flatMap((d) =>
    d.activities.map((a) => a.location).filter(Boolean)
  ) as string[]
  const allLocations = [...new Set([originLocation, ...activityLocations])]

  const coordsMap = await geocodeLocations(allLocations)

  const geocodedDays = days.map((day) => ({
    ...day,
    activities: day.activities.map((activity) => ({
      ...activity,
      coords: activity.location ? coordsMap[activity.location] ?? undefined : undefined,
    })),
  }))

  return {
    days: geocodedDays,
    originCoords: coordsMap[originLocation] ?? null,
  }
}

export async function POST(req: NextRequest) {
  const input: TripInput = await req.json()

  // 개발/테스트 모드
  if (process.env.USE_MOCK_API === 'true') {
    const days = parseNDJSON(buildMockNDJSON(input.startDate))
    const { days: geocodedDays, originCoords } = await attachCoords(days, input.origin)
    return NextResponse.json({ days: geocodedDays, originCoords })
  }

  const { price: gasolinePrice, source: priceSource } = await getGasolinePrice()

  const nearbyFavorites = (input.savedDestinations ?? []).length > 0
    ? `\n즐겨찾기 목적지 (근처라면 반드시 포함): ${input.savedDestinations.join(', ')}`
    : ''

  const userPrompt = `출발지: ${input.origin}
목적지: ${input.destination}
여행 기간: ${input.startDate} ~ ${input.endDate}
여행 스타일: ${input.styles.join(', ')}
총 예산: ${input.budget.toLocaleString()}원
인원: 어른 ${input.adults}명, 아이 ${input.children}명 (총 ${input.adults + input.children}명)
현재 휘발유 가격: ${gasolinePrice.toLocaleString()}원/L (${priceSource})
연비 기준: 12km/L (일반 승용차)${nearbyFavorites}

자차로 출발지(${input.origin})에서 목적지(${input.destination})까지 이동하는 일정을 생성해주세요.
- 연료비: 구간 거리 ÷ 12 × ${gasolinePrice}원 + 고속도로 통행료 추정
- 모든 비용(입장료·식비·숙소)은 위 인원 합산 금액으로 계산
- 입장료는 어른/아이 요금 구분 적용, 식비는 아이 0.6배 적용
- 숙소는 기본 2인 기준 + 추가 인원 요금 반영
하루 내 동선이 효율적이도록 각 날짜를 별도의 JSON 줄로 출력해주세요.`

  try {
    const messageStream = getClient().messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ type: 'advisor_20260301', name: 'advisor', model: 'claude-opus-4-6' } as any],
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    // Claude 응답 전체 수집
    let fullText = ''
    for await (const event of messageStream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        fullText += event.delta.text
      }
    }

    const days = parseNDJSON(fullText)
    const { days: geocodedDays, originCoords } = await attachCoords(days, input.origin)
    return NextResponse.json({ days: geocodedDays, originCoords })
  } catch (err) {
    console.error('generate error:', err)
    return NextResponse.json({ error: '일정 생성 실패' }, { status: 500 })
  }
}
