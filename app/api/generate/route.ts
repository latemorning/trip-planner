import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import type { TripInput } from '@/types'

function getClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultHeaders: {
      'anthropic-beta': 'advisor-tool-2026-03-01',
    },
  })
}

const SYSTEM_PROMPT = `당신은 한국 국내 여행 전문가입니다. 요청에 맞는 여행 일정을 생성하세요.

규칙:
1. 하루 일정 하나를 JSON 한 줄로 출력합니다
2. 날짜마다 줄바꿈(\n)으로 구분합니다
3. 설명 텍스트 없이 JSON만 출력합니다

각 줄 형식 (정확히 준수):
{"date":"YYYY-MM-DD","activities":[{"id":"고유문자열","time":"HH:MM","title":"장소명","description":"설명","estimatedCost":원화정수,"location":"카카오맵검색용장소명"}]}`

export async function POST(req: NextRequest) {
  const input: TripInput = await req.json()

  const userPrompt = `목적지: ${input.destination}
여행 기간: ${input.startDate} ~ ${input.endDate}
여행 스타일: ${input.styles.join(', ')}
총 예산: ${input.budget.toLocaleString()}원

각 날짜를 별도의 JSON 줄로 출력해주세요.`

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const messageStream = getClient().messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tools: [{ type: 'advisor_20260301' as any, name: 'advisor', model: 'claude-opus-4-6' }],
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }],
        })

        for await (const event of messageStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
