'use client'

import { useState, useEffect } from 'react'
import type { TripInput, TravelStyle } from '@/types'
import { loadSavedDestinations } from '@/lib/storage'

const STYLES: { value: TravelStyle; emoji: string }[] = [
  { value: '맛집', emoji: '🍜' },
  { value: '관광', emoji: '🏯' },
  { value: '자연', emoji: '🌿' },
  { value: '쇼핑', emoji: '🛍️' },
]

type Props = {
  onSubmit: (input: TripInput) => void
  loading: boolean
}

const isDev = process.env.NODE_ENV === 'development'

export default function TripForm({ onSubmit, loading }: Props) {
  const [origin, setOrigin] = useState(isDev ? '안양' : '')
  const [destination, setDestination] = useState(isDev ? '경주' : '')
  const [startDate, setStartDate] = useState(isDev ? '2026-04-20' : '')
  const [endDate, setEndDate] = useState(isDev ? '2026-04-21' : '')
  const [styles, setStyles] = useState<TravelStyle[]>(isDev ? ['관광', '맛집'] : [])
  const [budget, setBudget] = useState(isDev ? '633700' : '')
  const [adults, setAdults] = useState(isDev ? 2 : 2)
  const [children, setChildren] = useState(isDev ? 1 : 0)
  const [savedDestinations, setSavedDestinations] = useState<string[]>([])

  useEffect(() => {
    setSavedDestinations(loadSavedDestinations().map((d) => d.name))
  }, [])

  function toggleStyle(style: TravelStyle) {
    setStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      origin, destination, startDate, endDate, styles,
      budget: parseInt(budget, 10),
      adults, children,
      savedDestinations,
    })
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: 600,
    color: 'var(--text-2)', marginBottom: '6px',
    letterSpacing: '0.06em', textTransform: 'uppercase',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', fontSize: '14px',
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* 즐겨찾기 목적지 */}
      {savedDestinations.length > 0 && (
        <div>
          <label style={labelStyle}>즐겨찾기</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {savedDestinations.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setDestination(name)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '100px',
                  border: `1px solid ${destination === name ? 'var(--accent)' : 'rgba(245,158,11,0.3)'}`,
                  background: destination === name ? 'var(--accent-dim)' : 'transparent',
                  color: 'var(--accent)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                ★ {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 출발지 → 목적지 */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>출발지</label>
          <input type="text" placeholder="예: 서울, 대전" value={origin}
            onChange={(e) => setOrigin(e.target.value)} required style={inputStyle} />
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '18px', paddingBottom: '10px', flexShrink: 0 }}>→</div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>목적지</label>
          <input type="text" placeholder="예: 제주도, 부산" value={destination}
            onChange={(e) => setDestination(e.target.value)} required style={inputStyle} />
        </div>
      </div>

      {/* 날짜 */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>출발일</label>
          <input type="date" value={startDate}
            onChange={(e) => setStartDate(e.target.value)} required style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>도착일</label>
          <input type="date" value={endDate}
            onChange={(e) => setEndDate(e.target.value)} required style={inputStyle} />
        </div>
      </div>

      {/* 인원 */}
      <div>
        <label style={labelStyle}>인원</label>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', color: 'var(--text-2)', marginBottom: '5px' }}>어른</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button type="button" onClick={() => setAdults(Math.max(1, adults - 1))}
                style={counterBtnStyle}>−</button>
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', minWidth: '20px', textAlign: 'center' }}>
                {adults}
              </span>
              <button type="button" onClick={() => setAdults(adults + 1)}
                style={counterBtnStyle}>+</button>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', color: 'var(--text-2)', marginBottom: '5px' }}>아이</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button type="button" onClick={() => setChildren(Math.max(0, children - 1))}
                style={counterBtnStyle}>−</button>
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', minWidth: '20px', textAlign: 'center' }}>
                {children}
              </span>
              <button type="button" onClick={() => setChildren(children + 1)}
                style={counterBtnStyle}>+</button>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{
              padding: '8px 12px',
              background: 'var(--surface-2)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              fontSize: '12px',
              color: 'var(--text-2)',
              textAlign: 'center',
            }}>
              총 {adults + children}명
            </div>
          </div>
        </div>
      </div>

      {/* 여행 스타일 */}
      <div>
        <label style={labelStyle}>여행 스타일</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {STYLES.map(({ value, emoji }) => (
            <button key={value} type="button" onClick={() => toggleStyle(value)} style={{
              padding: '7px 14px', borderRadius: '100px',
              border: `1px solid ${styles.includes(value) ? 'var(--accent)' : 'var(--border)'}`,
              background: styles.includes(value) ? 'var(--accent-dim)' : 'var(--surface-2)',
              color: styles.includes(value) ? 'var(--accent)' : 'var(--text-2)',
              fontSize: '13px', fontWeight: styles.includes(value) ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {emoji} {value}
            </button>
          ))}
        </div>
      </div>

      {/* 예산 */}
      <div>
        <label style={labelStyle}>총 예산 (원)</label>
        <input type="number" placeholder="500000" value={budget}
          onChange={(e) => setBudget(e.target.value)} required min={0} style={inputStyle} />
      </div>

      <button type="submit" disabled={loading} style={{
        width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
        background: loading ? 'var(--surface-2)' : 'var(--accent)',
        color: loading ? 'var(--text-muted)' : '#000',
        fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s', letterSpacing: '-0.01em',
      }}>
        {loading ? '✦ 일정 생성 중...' : '✦ 일정 생성하기'}
      </button>
    </form>
  )
}

const counterBtnStyle: React.CSSProperties = {
  width: '28px', height: '28px', borderRadius: '6px',
  border: '1px solid var(--border)', background: 'var(--surface-2)',
  color: 'var(--text)', fontSize: '16px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.15s', lineHeight: 1,
}
