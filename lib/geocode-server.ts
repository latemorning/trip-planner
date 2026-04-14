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
 * regionCoords가 있으면 해당 좌표 반경 ~50km 내로 검색 범위 제한 (엉뚱한 지역 매칭 방지)
 */
async function callKakao(location: string, regionCoords?: Coords): Promise<Coords | null> {
  const key = process.env.KAKAO_REST_API_KEY
  if (!key) return null
  try {
    const params = new URLSearchParams({ query: location, size: '1' })
    if (regionCoords) {
      // rect=minLng,minLat,maxLng,maxLat (약 ±0.45° ≈ 50km)
      const d = 0.45
      params.set(
        'rect',
        `${regionCoords.lng - d},${regionCoords.lat - d},${regionCoords.lng + d},${regionCoords.lat + d}`
      )
    }
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?${params}`
    const res = await fetch(url, { headers: { Authorization: `KakaoAK ${key}` } })
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
 * 순서: 캐시 확인 → Nominatim → (null이면) Kakao(지역 제한) → Kakao(전국)
 * regionHint: 목적지 명칭 (예: "강릉"). Kakao 검색 범위를 해당 지역으로 제한.
 */
export async function geocodeLocations(
  locations: string[],
  regionHint?: string
): Promise<Record<string, Coords | null>> {
  const unique = [...new Set(locations.filter(Boolean))]
  const result: Record<string, Coords | null> = {}
  let nominatimCallCount = 0

  // 목적지 기준 좌표 획득 → Kakao rect 필터링에 사용
  let regionCoords: Coords | null = null
  if (regionHint) {
    const hintCoords = await callNominatim(regionHint) ?? await callKakao(regionHint)
    nominatimCallCount++
    if (hintCoords) {
      regionCoords = hintCoords
      console.log(`[geocode] region "${regionHint}" → (${hintCoords.lat}, ${hintCoords.lng})`)
    } else {
      console.log(`[geocode] region "${regionHint}" → 좌표 없음 (전국 검색으로 폴백)`)
    }
  }

  for (const location of unique) {
    const cached = getCached(location)
    if (cached !== undefined) {
      result[location] = cached
      continue
    }

    // 1단계: Nominatim
    if (nominatimCallCount > 0) await delay(DELAY_MS)
    const nominatimCoords = await callNominatim(location)
    nominatimCallCount++

    if (nominatimCoords) {
      setCached(location, nominatimCoords)
      result[location] = nominatimCoords
      console.log(`[geocode] ✓ Nominatim  "${location}"`)
      continue
    }

    // 2단계: Kakao (지역 제한)
    const kakaoRegionCoords = regionCoords ? await callKakao(location, regionCoords) : null

    if (kakaoRegionCoords) {
      setCached(location, kakaoRegionCoords)
      result[location] = kakaoRegionCoords
      console.log(`[geocode] ✓ Kakao(지역) "${location}"`)
      continue
    }

    // 3단계: Kakao (전국 — 지역 제한 시 rect 밖이거나 regionCoords 없는 경우)
    const kakaoCoords = await callKakao(location)
    setCached(location, kakaoCoords)
    result[location] = kakaoCoords
    if (kakaoCoords) {
      console.log(`[geocode] ✓ Kakao(전국) "${location}"`)
    } else {
      console.log(`[geocode] ✗ 실패       "${location}"`)
    }
  }

  return result
}
