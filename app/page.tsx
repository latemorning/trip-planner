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

      if (!res.ok) throw new Error('생성 실패')

      const { days, originCoords } = await res.json() as {
        days: Day[]
        originCoords: { lat: number; lng: number } | null
      }

      const itinerary: Itinerary = {
        origin: input.origin,
        originCoords: originCoords ?? undefined,
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
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 배경 그라디언트 장식 */}
      <div style={{
        position: 'absolute',
        top: '-200px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* 타이틀 */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '14px',
          background: 'var(--accent-dim)',
          border: '1px solid rgba(245,158,11,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: '24px',
        }}>✈</div>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: 'var(--text)',
          margin: '0 0 8px',
          letterSpacing: '-0.03em',
        }}>여행 플래너</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-2)', margin: 0 }}>
          AI가 나만의 국내 여행 일정을 만들어드립니다
        </p>
      </div>

      {/* 에러 */}
      {error && (
        <div style={{
          width: '100%',
          maxWidth: '440px',
          marginBottom: '16px',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid rgba(239,68,68,0.3)',
          background: 'rgba(239,68,68,0.1)',
          color: '#FCA5A5',
          fontSize: '13px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '18px' }}
          >×</button>
        </div>
      )}

      {/* 폼 카드 */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '28px 24px',
      }}>
        <TripForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </main>
  )
}
