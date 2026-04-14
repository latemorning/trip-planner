import { getCached, setCached } from './geocode-cache'

type Coords = { lat: number; lng: number }

// ── Naver Maps Geocoding (NCP) ────────────────────────────
// 기존 NCP_CLIENT_ID / NCP_CLIENT_SECRET 그대로 사용 — 별도 키 불필요
// NCP 콘솔에서 "Geocoding" 서비스 활성화 필요
async function callNaver(location: string, regionCoords?: Coords): Promise<Coords | null> {
  const clientId = process.env.NCP_CLIENT_ID
  const clientSecret = process.env.NCP_CLIENT_SECRET
  if (!clientId || !clientSecret) return null
  try {
    const params = new URLSearchParams({ query: location })
    if (regionCoords) {
      // coordinate=lng,lat: 해당 좌표 근처 결과를 우선 정렬 (지역 정확도 향상)
      params.set('coordinate', `${regionCoords.lng},${regionCoords.lat}`)
    }
    const url = `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?${params}`
    const res = await fetch(url, {
      headers: {
        'x-ncp-apigw-api-key-id': clientId,
        'x-ncp-apigw-api-key': clientSecret,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) {
      if (!regionCoords) console.warn(`[geocode] Naver HTTP ${res.status} for "${location}"`)
      return null
    }
    const data = await res.json()
    const addr = data?.addresses?.[0]
    if (!addr) return null
    return { lat: parseFloat(addr.y), lng: parseFloat(addr.x) }
  } catch {
    return null
  }
}

// ── Nominatim fallback ────────────────────────────────────
const NOMINATIM_DELAY = 1100
let lastNominatimMs = 0

async function callNominatim(location: string): Promise<Coords | null> {
  try {
    const wait = NOMINATIM_DELAY - (Date.now() - lastNominatimMs)
    if (wait > 0) await new Promise((r) => setTimeout(r, wait))
    lastNominatimMs = Date.now()

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&countrycodes=kr`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TripPlannerApp/1.0 (personal-use)', 'Accept-Language': 'ko' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.[0]) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

// ── 쿼리 단순화 변형 ──────────────────────────────────────
function getQueryVariants(location: string): string[] {
  const variants: string[] = []
  const withoutPrefix = location.replace(/^[가-힣]{1,5}\s+/, '')
  if (withoutPrefix !== location && withoutPrefix.length > 1) variants.push(withoutPrefix)

  const SUFFIXES = /\s*(마을|거리|골목|단지|지구|나들목|IC)$/
  const withoutSuffix = location.replace(SUFFIXES, '')
  if (withoutSuffix !== location && withoutSuffix.length > 1) variants.push(withoutSuffix)

  const withoutBoth = withoutPrefix.replace(SUFFIXES, '')
  if (withoutBoth !== withoutPrefix && withoutBoth !== withoutSuffix && withoutBoth.length > 1)
    variants.push(withoutBoth)

  if (!location.includes(' ') && location.length > 10) {
    const m = location.match(/^(.{2,5})(박물관|미술관|공원|수족관|아쿠아리움|테마파크)/)
    if (m) variants.push(m[1] + m[2])
  }
  return [...new Set(variants)].filter((v) => v !== location)
}

/** Naver Geocoding으로 한 장소 시도: 지역 기준 → 전국 → 쿼리 변형 */
async function tryNaver(
  location: string,
  regionCoords: Coords | null,
): Promise<{ coords: Coords; source: string } | null> {
  // 지역 기준 (coordinate 파라미터로 근처 우선 정렬)
  if (regionCoords) {
    const c = await callNaver(location, regionCoords)
    if (c) return { coords: c, source: 'Naver(지역)' }
  }
  // 전국
  const c = await callNaver(location)
  if (c) return { coords: c, source: 'Naver(전국)' }

  // 쿼리 변형
  for (const variant of getQueryVariants(location)) {
    const vc =
      (regionCoords ? await callNaver(variant, regionCoords) : null) ??
      await callNaver(variant)
    if (vc) return { coords: vc, source: `Naver(변형:"${variant}")` }
  }
  return null
}

/**
 * 여러 장소명을 서버에서 일괄 geocoding.
 *
 * Phase 1 (병렬): Naver Geocoding API 동시 호출 — NCP 기존 키 사용
 * Phase 2 (순차): Naver 실패 장소만 Nominatim 재시도 — Naver 장애 대비
 *
 * regionHint: 목적지 명칭 (예: "강릉"). 검색 결과를 해당 지역 근처로 우선 정렬.
 */
export async function geocodeLocations(
  locations: string[],
  regionHint?: string
): Promise<Record<string, Coords | null>> {
  const unique = [...new Set(locations.filter(Boolean))]
  const result: Record<string, Coords | null> = {}

  const uncached = unique.filter((loc) => {
    const cached = getCached(loc)
    if (cached !== undefined) { result[loc] = cached; return false }
    return true
  })
  if (uncached.length === 0) return result

  // 목적지 기준 좌표 획득
  let regionCoords: Coords | null = null
  if (regionHint) {
    regionCoords = await callNaver(regionHint)
    console.log(regionCoords
      ? `[geocode] region "${regionHint}" → (${regionCoords.lat}, ${regionCoords.lng})`
      : `[geocode] region "${regionHint}" → null (NCP Geocoding 서비스 활성화 확인 필요)`
    )
  }

  // Phase 1: 병렬 Naver Geocoding
  const naverResults = await Promise.all(
    uncached.map((location) => tryNaver(location, regionCoords))
  )

  const nominatimQueue: string[] = []
  for (let i = 0; i < uncached.length; i++) {
    const location = uncached[i]
    const hit = naverResults[i]
    if (hit) {
      setCached(location, hit.coords)
      result[location] = hit.coords
      console.log(`[geocode] ✓ ${hit.source.padEnd(22)} "${location}"`)
    } else {
      nominatimQueue.push(location)
    }
  }

  // Phase 2: 순차 Nominatim (Naver 실패 장소만)
  if (nominatimQueue.length > 0) {
    if (nominatimQueue.length === uncached.length) {
      console.warn('[geocode] Naver 전체 실패 — NCP 콘솔에서 Geocoding 서비스 활성화 여부를 확인하세요')
    }
    for (const location of nominatimQueue) {
      const coords = await callNominatim(location)
      setCached(location, coords)
      result[location] = coords
      const icon = coords ? '✓' : '✗'
      console.log(`[geocode] ${icon} ${'Nominatim'.padEnd(22)} "${location}"`)
    }
  }

  return result
}
