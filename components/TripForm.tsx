'use client'

import { useState } from 'react'
import type { TripInput, TravelStyle } from '@/types'

const STYLES: TravelStyle[] = ['맛집', '관광', '자연', '쇼핑']

type Props = {
  onSubmit: (input: TripInput) => void
  loading: boolean
}

export default function TripForm({ onSubmit, loading }: Props) {
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [styles, setStyles] = useState<TravelStyle[]>([])
  const [budget, setBudget] = useState('')

  function toggleStyle(style: TravelStyle) {
    setStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      destination,
      startDate,
      endDate,
      styles,
      budget: parseInt(budget, 10),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
      <div>
        <label className="block text-sm font-medium mb-1">목적지</label>
        <input
          type="text"
          placeholder="예: 제주도, 부산"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          required
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="startDate" className="block text-sm font-medium mb-1">
            출발일
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="endDate" className="block text-sm font-medium mb-1">
            도착일
          </label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">여행 스타일</label>
        <div className="flex gap-2 flex-wrap">
          {STYLES.map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => toggleStyle(style)}
              className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                styles.includes(style)
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">예산</label>
        <input
          type="number"
          placeholder="예산 (원)"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          required
          min={0}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? '생성 중...' : '일정 생성'}
      </button>
    </form>
  )
}
