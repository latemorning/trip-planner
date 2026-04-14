import type { Activity } from '@/types'

type Coords = { lat: number; lng: number }

async function searchByServerApi(location: string): Promise<Coords | null> {
  const res = await fetch('/api/geocode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location }),
  })
  if (!res.ok) return null
  return res.json()
}

const GEOCODE_DELAY_MS = 400

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function geocodeSingle(location: string): Promise<Coords | null> {
  return searchByServerApi(location)
}

export async function geocodeDay(activities: Activity[]): Promise<Activity[]> {
  const result: Activity[] = []
  let callCount = 0
  for (const activity of activities) {
    if (activity.coords || !activity.location) {
      result.push(activity)
      continue
    }
    if (callCount > 0) await delay(GEOCODE_DELAY_MS)
    const coords = await searchByServerApi(activity.location)
    result.push(coords ? { ...activity, coords } : activity)
    callCount++
  }
  return result
}
