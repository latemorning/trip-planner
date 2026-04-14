'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { Itinerary, Day } from '@/types'
import DayCard from './DayCard'
import { saveDestination, removeDestination, isDestinationSaved } from '@/lib/storage'

const RouteMap = dynamic(() => import('./RouteMap'), { ssr: false })

type Props = {
  itinerary: Itinerary
  onUpdate: (itinerary: Itinerary) => void
}

export default function ItineraryView({ itinerary, onUpdate }: Props) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [highlightedActivityId, setHighlightedActivityId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSaved(isDestinationSaved(itinerary.destination))
  }, [itinerary.destination])

  function toggleSave() {
    if (saved) {
      removeDestination(itinerary.destination)
      setSaved(false)
    } else {
      saveDestination(itinerary.destination)
      setSaved(true)
    }
  }

  const selectedDay = itinerary.days[selectedDayIndex] ?? null
  const totalSpend = itinerary.days
    .flatMap((d) => d.activities)
    .reduce((sum, a) => sum + a.estimatedCost, 0)
  const overBudget = totalSpend > itinerary.totalBudget

  function handleDayChange(day: Day) {
    const updatedDays = itinerary.days.map((d, i) => i === selectedDayIndex ? day : d)
    onUpdate({ ...itinerary, days: updatedDays })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            {itinerary.destination}
          </h2>
          {/* 즐겨찾기 버튼 */}
          <button
            onClick={toggleSave}
            title={saved ? '즐겨찾기 해제' : '즐겨찾기 저장'}
            style={{
              background: saved ? 'var(--accent-dim)' : 'transparent',
              border: `1px solid ${saved ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: '6px',
              padding: '3px 10px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              color: saved ? 'var(--accent)' : 'var(--text-muted)',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {saved ? '★ 저장됨' : '☆ 저장'}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>
            예산 ₩{itinerary.totalBudget.toLocaleString()}
          </span>
          <span style={{ color: 'var(--border)' }}>·</span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: overBudget ? 'var(--danger)' : 'var(--success)' }}>
            예상 ₩{totalSpend.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 날짜 탭 */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
        {itinerary.days.map((_, i) => (
          <button
            key={i}
            onClick={() => { setSelectedDayIndex(i); setHighlightedActivityId(null) }}
            style={{
              padding: '6px 16px', borderRadius: '100px',
              border: `1px solid ${selectedDayIndex === i ? 'var(--accent)' : 'var(--border)'}`,
              background: selectedDayIndex === i ? 'var(--accent-dim)' : 'transparent',
              color: selectedDayIndex === i ? 'var(--accent)' : 'var(--text-2)',
              fontSize: '13px', fontWeight: selectedDayIndex === i ? 600 : 400,
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}
          >
            {i + 1}일차
          </button>
        ))}
      </div>

      {/* 2단 레이아웃 */}
      <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>
        <div style={{ width: '50%', overflowY: 'auto' }}>
          {selectedDay && (
            <DayCard
              day={selectedDay}
              onChange={handleDayChange}
              highlightedActivityId={highlightedActivityId}
              onHighlight={setHighlightedActivityId}
            />
          )}
        </div>
        <div style={{ width: '50%', borderRadius: 'var(--radius)', overflow: 'hidden', minHeight: '256px', border: '1px solid var(--border)' }}>
          <RouteMap
            day={selectedDay}
            originCoords={selectedDayIndex === 0 ? itinerary.originCoords : undefined}
            originLabel={itinerary.origin}
            highlightedActivityId={highlightedActivityId}
            onMarkerClick={(id) => setHighlightedActivityId((prev) => (prev === id ? null : id))}
          />
        </div>
      </div>
    </div>
  )
}
