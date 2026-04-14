#!/usr/bin/env node
/**
 * 실제 Claude API + Nominatim geocoding을 호출해서
 * lib/mock-itinerary.ts 의 MOCK_DAYS를 갱신하는 스크립트
 *
 * 사용: node scripts/gen-mock.mjs
 */
import Anthropic from '@anthropic-ai/sdk'
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ── 환경변수 ──────────────────────────────────────────────
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
if (!ANTHROPIC_API_KEY) { console.error('ANTHROPIC_API_KEY 미설정'); process.exit(1) }

// ── 여행 입력 파라미터 (원하는 대로 수정) ──────────────────
const INPUT = {
  origin: '안양시 만안구',
  destination: '경주',
  startDate: '2026-05-01',
  endDate: '2026-05-04',
  styles: ['관광', '맛집'],
  budget: 800000,
  adults: 2,
  children: 1,
  gasolinePrice: 1680,
}

// ── 프롬프트 ──────────────────────────────────────────────
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

const USER_PROMPT = `출발지: ${INPUT.origin}
목적지: ${INPUT.destination}
여행 기간: ${INPUT.startDate} ~ ${INPUT.endDate}
여행 스타일: ${INPUT.styles.join(', ')}
총 예산: ${INPUT.budget.toLocaleString()}원
인원: 어른 ${INPUT.adults}명, 아이 ${INPUT.children}명 (총 ${INPUT.adults + INPUT.children}명)
현재 휘발유 가격: ${INPUT.gasolinePrice.toLocaleString()}원/L (전국 평균 추정값)
연비 기준: 12km/L (일반 승용차)

자차로 출발지(${INPUT.origin})에서 목적지(${INPUT.destination})까지 이동하는 일정을 생성해주세요.
- 연료비: 구간 거리 ÷ 12 × ${INPUT.gasolinePrice}원 + 고속도로 통행료 추정
- 모든 비용(입장료·식비·숙소)은 위 인원 합산 금액으로 계산
하루 내 동선이 효율적이도록 각 날짜를 별도의 JSON 줄로 출력해주세요.`

// ── Geocoding: Nominatim → Kakao fallback ──────────────────
const geocodeCache = new Map()
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY

async function callNominatim(location) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&countrycodes=kr`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TripPlannerMockGen/1.0', 'Accept-Language': 'ko' }
    })
    const data = await res.json()
    return data?.[0] ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null
  } catch { return null }
}

async function callKakao(location) {
  if (!KAKAO_REST_API_KEY) return null
  try {
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(location)}&size=1`
    const res = await fetch(url, { headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` } })
    const data = await res.json()
    const doc = data?.documents?.[0]
    return doc ? { lat: parseFloat(doc.y), lng: parseFloat(doc.x) } : null
  } catch { return null }
}

async function geocode(location) {
  if (geocodeCache.has(location)) return geocodeCache.get(location)
  await new Promise(r => setTimeout(r, 1200)) // Nominatim rate limit: 1 req/sec
  const nominatim = await callNominatim(location)
  const coords = nominatim ?? await callKakao(location)
  geocodeCache.set(location, coords)
  console.log(`  geocoded [${nominatim ? 'Nominatim' : coords ? 'Kakao' : 'null'}]: ${location} →`, coords ?? 'null')
  return coords
}

// ── 메인 ──────────────────────────────────────────────────
async function main() {
  console.log('1. Claude API 호출 중...')
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: USER_PROMPT }],
  })

  const rawText = message.content.filter(b => b.type === 'text').map(b => b.text).join('')
  console.log('\n── Claude 응답 ──')
  console.log(rawText.slice(0, 500) + (rawText.length > 500 ? '...' : ''))

  // NDJSON 파싱
  const days = []
  for (const line of rawText.split('\n')) {
    const t = line.trim()
    if (!t.startsWith('{')) continue
    try { days.push(JSON.parse(t)) } catch { /* skip */ }
  }
  console.log(`\n2. ${days.length}일 파싱 완료`)

  // geocoding
  console.log('\n3. Geocoding 시작...')
  // origin 먼저
  const originCoords = await geocode(INPUT.origin)

  for (const day of days) {
    for (const act of day.activities) {
      if (act.location) {
        act.coords = await geocode(act.location) ?? undefined
      }
    }
  }

  // ── mock-itinerary.ts 생성 ─────────────────────────────
  console.log('\n4. lib/mock-itinerary.ts 작성...')

  const daysJson = JSON.stringify(days, null, 2)
    // date를 REPLACE_DATE_N 플레이스홀더로 치환
    .replace(/"date": "2026-05-01"/g, '"date": "REPLACE_DATE_0"')
    .replace(/"date": "2026-05-02"/g, '"date": "REPLACE_DATE_1"')
    .replace(/"date": "2026-05-03"/g, '"date": "REPLACE_DATE_2"')
    .replace(/"date": "2026-05-04"/g, '"date": "REPLACE_DATE_3"')

  const originCoordsStr = originCoords
    ? `{ lat: ${originCoords.lat}, lng: ${originCoords.lng} }`
    : 'null'

  const output = `import type { Day } from '@/types'

/**
 * 실제 Claude API + Nominatim geocoding으로 생성된 mock 일정 데이터
 * ${INPUT.origin} → ${INPUT.destination} 3박 4일 (어른 ${INPUT.adults}명, 아이 ${INPUT.children}명)
 *
 * 생성일: ${new Date().toISOString().slice(0, 10)}
 * 개발/테스트 시 USE_MOCK_API=true 환경변수로 활성화
 */
export const MOCK_DAYS: Day[] = ${daysJson.replace(/"REPLACE_DATE_(\d)"/g, "'REPLACE_DATE_$1'")}

export const MOCK_ORIGIN_COORDS = ${originCoordsStr}

/**
 * 입력받은 날짜 기준으로 더미 일정의 날짜를 재설정하고 NDJSON 문자열 반환
 */
export function buildMockNDJSON(startDate: string): string {
  const start = new Date(startDate + 'T00:00:00')
  return MOCK_DAYS.map((day, i) => {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return JSON.stringify({ ...day, date: \`\${y}-\${m}-\${d}\` })
  }).join('\\n')
}
`

  const outPath = join(ROOT, 'lib', 'mock-itinerary.ts')
  writeFileSync(outPath, output, 'utf-8')
  console.log(`완료: ${outPath}`)
  console.log(`\n총 ${days.length}일, ${days.reduce((s, d) => s + d.activities.length, 0)}개 활동`)
}

main().catch(e => { console.error(e); process.exit(1) })
