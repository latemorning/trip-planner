'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TripForm from '@/components/TripForm'
import type { TripInput, Itinerary, Day } from '@/types'
import { saveItinerary } from '@/lib/storage'

const LOADING_STEPS = [
  { icon: '⛽', text: '유가 정보를 확인하고 있어요' },
  { icon: '🤖', text: 'AI가 최적 일정을 만들고 있어요' },
  { icon: '🗺️', text: '장소별 지도 위치를 찾고 있어요' },
  { icon: '✨', text: '일정을 완성하고 있어요' },
]

function LoadingView({ destination }: { destination: string }) {
  const [stepIdx, setStepIdx] = useState(0)
  const [dotCount, setDotCount] = useState(1)

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, LOADING_STEPS.length - 1))
    }, 7000)
    const dotTimer = setInterval(() => {
      setDotCount((d) => (d % 3) + 1)
    }, 500)
    return () => { clearInterval(stepTimer); clearInterval(dotTimer) }
  }, [])

  const step = LOADING_STEPS[stepIdx]

  return (
    <div style={{
      width: '100%',
      maxWidth: '440px',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '48px 28px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '28px',
    }}>
      {/* 애니메이션 아이콘 */}
      <div style={{ position: 'relative', width: '72px', height: '72px' }}>
        {/* 바깥 파동 */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          border: '2px solid rgba(245,158,11,0.3)',
          animation: 'ping 1.8s cubic-bezier(0,0,0.2,1) infinite',
        }} />
        <div style={{
          position: 'absolute', inset: '8px',
          borderRadius: '50%',
          border: '2px solid rgba(245,158,11,0.2)',
          animation: 'ping 1.8s cubic-bezier(0,0,0.2,1) infinite',
          animationDelay: '0.4s',
        }} />
        {/* 아이콘 */}
        <div style={{
          position: 'absolute', inset: '14px',
          borderRadius: '50%',
          background: 'var(--accent-dim)',
          border: '1px solid rgba(245,158,11,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
        }}>{step.icon}</div>
      </div>

      {/* 텍스트 */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
          {destination} 여행 일정 생성 중{'.'.repeat(dotCount)}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>{step.text}</div>
      </div>

      {/* 스텝 인디케이터 */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {LOADING_STEPS.map((s, i) => (
          <div key={i} style={{
            width: i === stepIdx ? '20px' : '6px',
            height: '6px',
            borderRadius: '100px',
            background: i <= stepIdx ? 'var(--accent)' : 'var(--border)',
            transition: 'all 0.4s ease',
          }} />
        ))}
      </div>

      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
        보통 30~60초 정도 걸려요
      </div>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingDest, setLoadingDest] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(input: TripInput) {
    setLoading(true)
    setLoadingDest(input.destination)
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

      {/* 폼 카드 또는 로딩 화면 */}
      {loading ? (
        <LoadingView destination={loadingDest} />
      ) : (
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
      )}
    </main>
  )
}
