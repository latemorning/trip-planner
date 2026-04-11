'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Itinerary } from '@/types'
import ItineraryView from '@/components/ItineraryView'
import { saveItinerary, loadItinerary, clearItinerary } from '@/lib/storage'
import { geocodeDay } from '@/lib/geocode'

export default function ItineraryPage() {
  const router = useRouter()
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)

  useEffect(() => {
    const saved = loadItinerary()
    if (!saved) {
      router.push('/')
      return
    }
    setItinerary(saved)

    // 좌표가 없는 활동들을 geocode
    async function geocodeAll(base: Itinerary) {
      const geocodedDays = await Promise.all(
        base.days.map(async (day) => ({
          ...day,
          activities: await geocodeDay(day.activities),
        }))
      )
      const updated = { ...base, days: geocodedDays }
      setItinerary(updated)
      saveItinerary(updated)
    }

    geocodeAll(saved)
  }, [router])

  function handleUpdate(updated: Itinerary) {
    setItinerary(updated)
    saveItinerary(updated)
  }

  if (!itinerary) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">일정을 불러오는 중...</p>
      </main>
    )
  }

  return (
    <main className="h-screen flex flex-col p-4 bg-gray-50">
      <div className="mb-3">
        <button
          onClick={() => {
            clearItinerary()
            router.push('/')
          }}
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          ← 처음부터 다시
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <ItineraryView itinerary={itinerary} onUpdate={handleUpdate} />
      </div>
    </main>
  )
}
