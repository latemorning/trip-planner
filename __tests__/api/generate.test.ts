/**
 * @jest-environment node
 */
import { POST } from '@/app/api/generate/route'
import { NextRequest } from 'next/server'

const mockDayLine = '{"date":"2026-05-01","activities":[{"id":"d1a1","time":"09:00","title":"한라산 등반","description":"백록담 코스","estimatedCost":0,"location":"한라산"}]}\n'

jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: {
      stream: jest.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield {
            type: 'content_block_delta',
            delta: { type: 'text_delta', text: mockDayLine },
          }
        },
      }),
    },
  })),
}))

describe('POST /api/generate', () => {
  it('returns 200 with streaming text/plain response', async () => {
    const req = new NextRequest('http://localhost/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        destination: '제주도',
        startDate: '2026-05-01',
        endDate: '2026-05-03',
        styles: ['관광'],
        budget: 500000,
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/plain')
  })

  it('streams NDJSON day objects', async () => {
    const req = new NextRequest('http://localhost/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        destination: '제주도',
        startDate: '2026-05-01',
        endDate: '2026-05-03',
        styles: ['관광'],
        budget: 500000,
      }),
    })

    const res = await POST(req)
    const text = await res.text()
    const parsed = JSON.parse(text.trim())
    expect(parsed.date).toBe('2026-05-01')
    expect(parsed.activities[0].title).toBe('한라산 등반')
  })
})
