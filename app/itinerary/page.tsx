'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Itinerary } from '@/types'
import ItineraryView from '@/components/ItineraryView'
import { saveItinerary, loadItinerary, clearItinerary } from '@/lib/storage'
import { geocodeDay, geocodeSingle } from '@/lib/geocode'

export default function ItineraryPage() {
  const router = useRouter()
  const routerRef = useRef(router)
  routerRef.current = router
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)

  useEffect(() => {
    const saved = loadItinerary()
    if (!saved) { routerRef.current.push('/'); return }
    setItinerary(saved)

    async function geocodeAll(base: Itinerary) {
      const geocodedDays: typeof base.days = []
      for (const day of base.days) {
        geocodedDays.push({ ...day, activities: await geocodeDay(day.activities) })
      }
      await new Promise((r) => setTimeout(r, 400))
      const originCoords = base.originCoords ?? await geocodeSingle(base.origin)

      const updated = { ...base, days: geocodedDays, originCoords: originCoords ?? base.originCoords }
      setItinerary(updated)
      saveItinerary(updated)
    }
    geocodeAll(saved)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleUpdate(updated: Itinerary) {
    setItinerary(updated)
    saveItinerary(updated)
  }

  if (!itinerary) {
    return (
      <main style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
      }}>
        <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>일정을 불러오는 중...</p>
      </main>
    )
  }

  return (
    <main style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      background: 'var(--bg)',
    }}>
      <div style={{ marginBottom: '12px' }}>
        <button
          onClick={() => { clearItinerary(); router.push('/') }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-2)',
            cursor: 'pointer',
            fontSize: '13px',
            padding: '4px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-2)')}
        >
          ← 처음부터 다시
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ItineraryView itinerary={itinerary} onUpdate={handleUpdate} />
      </div>
    </main>
  )
}
