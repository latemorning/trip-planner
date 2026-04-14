import { getCached, setCached } from './geocode-cache'

type Coords = { lat: number; lng: number }

const DELAY_MS = 1100 // Nominatim: max 1 req/sec

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function callNominatim(location: string): Promise<Coords | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&countrycodes=kr`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'TripPlannerApp/1.0 (personal-use)',
        'Accept-Language': 'ko',
      },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.[0]) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

/**
 * 여러 장소명을 서버에서 일괄 geocoding.
 * 캐시 히트 → 즉시 반환, 미스 → Nominatim API 호출 후 캐시 저장.
 * 중복 location은 한 번만 호출.
 */
export async function geocodeLocations(
  locations: string[]
): Promise<Record<string, Coords | null>> {
  const unique = [...new Set(locations.filter(Boolean))]
  const result: Record<string, Coords | null> = {}
  let callCount = 0

  for (const location of unique) {
    const cached = getCached(location)
    if (cached !== undefined) {
      result[location] = cached
      continue
    }

    if (callCount > 0) await delay(DELAY_MS)
    const coords = await callNominatim(location)
    setCached(location, coords)
    result[location] = coords
    callCount++
  }

  return result
}
