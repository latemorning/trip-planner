'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TripForm from '@/components/TripForm'
import type { TripInput, Itinerary, Day } from '@/types'
import { saveItinerary } from '@/lib/storage'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(input: TripInput) {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!res.ok || !res.body) throw new Error('생성 실패')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      const days: Day[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          try {
            days.push(JSON.parse(trimmed) as Day)
          } catch {
            // 불완전한 줄 무시
          }
        }
      }

      // 남은 버퍼 처리
      if (buffer.trim()) {
        try {
          days.push(JSON.parse(buffer.trim()) as Day)
        } catch {
          // 무시
        }
      }

      const itinerary: Itinerary = {
        destination: input.destination,
        startDate: input.startDate,
        endDate: input.endDate,
        totalBudget: input.budget,
        days,
      }

      saveItinerary(itinerary)
      router.push('/itinerary')
    } catch {
      setError('일정 생성에 실패했습니다. 다시 시도해주세요.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-2 text-gray-900">여행 플래너</h1>
      <p className="text-gray-500 mb-8 text-sm">
        AI가 나만의 국내 여행 일정을 만들어드립니다
      </p>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm max-w-md w-full flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline ml-2">
            닫기
          </button>
        </div>
      )}
      <TripForm onSubmit={handleSubmit} loading={loading} />
    </main>
  )
}
