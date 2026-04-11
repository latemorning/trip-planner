import type { Activity } from '@/types'

type Coords = { lat: number; lng: number }

export async function geocodeActivity(activity: Activity): Promise<Coords | null> {
  if (!activity.location) return null

  const res = await fetch('/api/geocode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location: activity.location }),
  })

  if (!res.ok) return null
  return res.json()
}

export async function geocodeDay(activities: Activity[]): Promise<Activity[]> {
  return Promise.all(
    activities.map(async (activity) => {
      if (activity.coords || !activity.location) return activity
      const coords = await geocodeActivity(activity)
      return coords ? { ...activity, coords } : activity
    })
  )
}
