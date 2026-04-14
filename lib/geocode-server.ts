import { getCached, setCached } from './geocode-cache'

type Coords = { lat: number; lng: number }

// ── Nominatim ────────────────────────────────────────────
const NOMINATIM_DELAY = 1100 // max 1 req/sec
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

// ── Kakao ────────────────────────────────────────────────
async function callKakao(location: string, regionCoords?: Coords): Promise<Coords | null> {
  const key = process.env.KAKAO_REST_API_KEY
  if (!key) return null
  try {
    const params = new URLSearchParams({ query: location, size: '1' })
    if (regionCoords) {
      const d = 0.45 // ~50km bounding box
      params.set('rect', `${regionCoords.lng - d},${regionCoords.lat - d},${regionCoords.lng + d},${regionCoords.lat + d}`)
    }
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?${params}`
    const res = await fetch(url, {
      headers: { Authorization: `KakaoAK ${key}` },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) {
      if (!regionCoords) console.warn(`[geocode] Kakao HTTP ${res.status} for "${location}"`)
      return null
    }
    const data = await res.json()
    const doc = data?.documents?.[0]
    if (!doc) return null
    return { lat: parseFloat(doc.y), lng: parseFloat(doc.x) }
  } catch {
    return null
  }
}

// ── 쿼리 변형 ─────────────────────────────────────────────
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

/** Kakao만으로 한 장소 geocoding 시도 (지역 → 전국 → 변형). null이면 Kakao 불가 */
async function tryKakao(location: string, regionCoords: Coords | null): Promise<{ coords: Coords; source: string } | null> {
  if (regionCoords) {
    const c = await callKakao(location, regionCoords)
    if (c) return { coords: c, source: 'Kakao(지역)' }
  }
  const c = await callKakao(location)
  if (c) return { coords: c, source: 'Kakao(전국)' }

  for (const variant of getQueryVariants(location)) {
    const vc = (regionCoords ? await callKakao(variant, regionCoords) : null) ?? await callKakao(variant)
    if (vc) return { coords: vc, source: `Kakao(변형:"${variant}")` }
  }
  return null
}

/**
 * 여러 장소명을 서버에서 일괄 geocoding.
 *
 * Phase 1 (병렬): Kakao 전체 동시 호출 — 정상 시 ~2-3초
 * Phase 2 (순차): Kakao 실패 장소만 Nominatim 재시도 — Kakao 장애 대비
 *
 * regionHint: 목적지 명칭. Kakao 검색 범위를 해당 지역으로 제한.
 */
export async function geocodeLocations(
  locations: string[],
  regionHint?: string
): Promise<Record<string, Coords | null>> {
  const unique = [...new Set(locations.filter(Boolean))]
  const result: Record<string, Coords | null> = {}

  // 캐시 히트 먼저 처리
  const uncached = unique.filter((loc) => {
    const cached = getCached(loc)
    if (cached !== undefined) { result[loc] = cached; return false }
    return true
  })
  if (uncached.length === 0) return result

  // 목적지 기준 좌표 획득
  let regionCoords: Coords | null = null
  if (regionHint) {
    regionCoords = await callKakao(regionHint)
    console.log(regionCoords
      ? `[geocode] region "${regionHint}" → (${regionCoords.lat}, ${regionCoords.lng})`
      : `[geocode] region "${regionHint}" → null (Kakao 키 오류 가능성)`
    )
  }

  // Phase 1: 병렬 Kakao
  const kakaoResults = await Promise.all(
    uncached.map((location) => tryKakao(location, regionCoords))
  )

  const nominatimQueue: string[] = []
  for (let i = 0; i < uncached.length; i++) {
    const location = uncached[i]
    const hit = kakaoResults[i]
    if (hit) {
      setCached(location, hit.coords)
      result[location] = hit.coords
      console.log(`[geocode] ✓ ${hit.source.padEnd(22)} "${location}"`)
    } else {
      nominatimQueue.push(location)
    }
  }

  // Phase 2: 순차 Nominatim (Kakao 실패 장소만)
  if (nominatimQueue.length > 0) {
    const allKakaoFailed = nominatimQueue.length === uncached.length
    if (allKakaoFailed) console.warn('[geocode] Kakao 전체 실패 — KAKAO_REST_API_KEY 환경변수를 확인하세요')

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
