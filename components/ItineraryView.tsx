'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { Itinerary, Day } from '@/types'
import DayCard from './DayCard'

// RouteMap은 Kakao Maps SDK(브라우저 전용, 무거운 번들)이므로 동적 import.
// ssr: false로 서버사이드 렌더링을 건너뛴다.
const RouteMap = dynamic(() => import('./RouteMap'), { ssr: false })

type Props = {
  itinerary: Itinerary
  onUpdate: (itinerary: Itinerary) => void
}

export default function ItineraryView({ itinerary, onUpdate }: Props) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [highlightedActivityId, setHighlightedActivityId] = useState<string | null>(null)

  const selectedDay = itinerary.days[selectedDayIndex] ?? null
  const totalSpend = itinerary.days
    .flatMap((d) => d.activities)
    .reduce((sum, a) => sum + a.estimatedCost, 0)

  function handleDayChange(day: Day) {
    const updatedDays = itinerary.days.map((d, i) =>
      i === selectedDayIndex ? day : d
    )
    onUpdate({ ...itinerary, days: updatedDays })
  }

  return (
    <div className="flex flex-col h-full gap-3">
      {/* 예산 요약 */}
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-xl">{itinerary.destination}</h2>
        <span className="text-sm text-gray-600">
          예산 ₩{itinerary.totalBudget.toLocaleString()} / 예상 ₩{totalSpend.toLocaleString()}
        </span>
      </div>

      {/* 날짜 탭 */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {itinerary.days.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setSelectedDayIndex(i)
              setHighlightedActivityId(null)
            }}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
              selectedDayIndex === i
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {i + 1}일차
          </button>
        ))}
      </div>

      {/* 2단 레이아웃 */}
      <div className="flex gap-4 flex-1 min-h-0">
        <div className="w-1/2 overflow-y-auto">
          {selectedDay && (
            <DayCard
              day={selectedDay}
              onChange={handleDayChange}
              highlightedActivityId={highlightedActivityId}
            />
          )}
        </div>
        <div className="w-1/2 rounded-xl overflow-hidden min-h-64">
          <RouteMap
            day={selectedDay}
            highlightedActivityId={highlightedActivityId}
            onMarkerClick={setHighlightedActivityId}
          />
        </div>
      </div>
    </div>
  )
}
