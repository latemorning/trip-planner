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
 * Kakao Local 키워드 검색 API — 한국 POI(식당·명소·상점)에 강함
 * KAKAO_REST_API_KEY 환경변수가 없으면 null 반환
 */
async function callKakao(location: string): Promise<Coords | null> {
  const key = process.env.KAKAO_REST_API_KEY
  if (!key) return null
  try {
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(location)}&size=1`
    const res = await fetch(url, {
      headers: { Authorization: `KakaoAK ${key}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    const doc = data?.documents?.[0]
    if (!doc) return null
    return { lat: parseFloat(doc.y), lng: parseFloat(doc.x) }
  } catch {
    return null
  }
}

/**
 * 여러 장소명을 서버에서 일괄 geocoding.
 * 순서: 캐시 확인 → Nominatim → (null이면) Kakao fallback
 * 중복 location은 한 번만 호출.
 */
export async function geocodeLocations(
  locations: string[]
): Promise<Record<string, Coords | null>> {
  const unique = [...new Set(locations.filter(Boolean))]
  const result: Record<string, Coords | null> = {}
  let nominatimCallCount = 0

  for (const location of unique) {
    const cached = getCached(location)
    if (cached !== undefined) {
      result[location] = cached
      continue
    }

    // Nominatim (rate limit: 1 req/sec)
    if (nominatimCallCount > 0) await delay(DELAY_MS)
    const coords = await callNominatim(location)
    nominatimCallCount++

    if (coords) {
      setCached(location, coords)
      result[location] = coords
      continue
    }

    // Kakao fallback (Nominatim이 null 반환한 경우)
    const kakaoCoords = await callKakao(location)
    setCached(location, kakaoCoords)
    result[location] = kakaoCoords
  }

  return result
}
