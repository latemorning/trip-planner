import { getCached, setCached } from './geocode-cache'

type Coords = { lat: number; lng: number }

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
 * 정확한 쿼리 실패 시 시도할 단순화 변형 목록을 생성한다.
 *
 * 변형 규칙:
 * 1. 앞부분 지역명 제거 ("강릉 초당순두부마을" → "초당순두부마을")
 * 2. ~마을/~거리/~골목/IC 등 접미사 제거 ("초당순두부마을" → "초당순두부")
 * 3. 1+2 동시 적용 ("강릉 초당순두부마을" → "초당순두부")
 * 4. 긴 복합 명칭 단축 ("참소리축음기에디슨과학박물관" → "참소리박물관")
 */
function getQueryVariants(location: string): string[] {
  const variants: string[] = []

  // 1. 앞 지역명 제거 (1~5자 + 공백)
  const withoutPrefix = location.replace(/^[가-힣]{1,5}\s+/, '')
  if (withoutPrefix !== location && withoutPrefix.length > 1) {
    variants.push(withoutPrefix)
  }

  // 2. 뒷부분 접미사 제거
  const SUFFIXES = /\s*(마을|거리|골목|단지|지구|나들목|IC)$/
  const withoutSuffix = location.replace(SUFFIXES, '')
  if (withoutSuffix !== location && withoutSuffix.length > 1) {
    variants.push(withoutSuffix)
  }

  // 3. prefix + suffix 동시 제거
  const withoutBoth = withoutPrefix.replace(SUFFIXES, '')
  if (
    withoutBoth !== withoutPrefix &&
    withoutBoth !== withoutSuffix &&
    withoutBoth.length > 1
  ) {
    variants.push(withoutBoth)
  }

  // 4. 긴 한 단어 복합명 → 첫 2~3자 + "박물관/미술관/공원" 키워드
  if (!location.includes(' ') && location.length > 10) {
    const museumMatch = location.match(/^(.{2,5})(박물관|미술관|공원|수족관|아쿠아리움|테마파크)/)
    if (museumMatch) variants.push(museumMatch[1] + museumMatch[2])
  }

  return [...new Set(variants)].filter((v) => v !== location)
}

/** 한 장소에 대해 Kakao(지역) → Kakao(전국) → 쿼리 변형 순서로 시도 */
async function geocodeOne(
  location: string,
  regionCoords: Coords | null
): Promise<{ coords: Coords | null; source: string }> {
  // 1단계: Kakao (지역 제한)
  if (regionCoords) {
    const coords = await callKakao(location, regionCoords)
    if (coords) return { coords, source: 'Kakao(지역)' }
  }

  // 2단계: Kakao (전국)
  const coords = await callKakao(location)
  if (coords) return { coords, source: 'Kakao(전국)' }

  // 3단계: 쿼리 단순화 변형 재시도
  for (const variant of getQueryVariants(location)) {
    const variantCoords =
      (regionCoords ? await callKakao(variant, regionCoords) : null) ??
      await callKakao(variant)
    if (variantCoords) return { coords: variantCoords, source: `Kakao(변형: "${variant}")` }
  }

  return { coords: null, source: '실패' }
}

/**
 * 여러 장소명을 서버에서 일괄 geocoding.
 * 모든 Kakao 호출을 병렬 실행 — Nominatim 순차 대기 제거로 대폭 빠름.
 * regionHint: 목적지 명칭 (예: "강릉"). Kakao 검색 범위를 해당 지역으로 제한.
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

  // 목적지 기준 좌표 획득 (Kakao rect 필터링용)
  let regionCoords: Coords | null = null
  if (regionHint) {
    regionCoords = await callKakao(regionHint)
    if (regionCoords) {
      console.log(`[geocode] region "${regionHint}" → (${regionCoords.lat}, ${regionCoords.lng})`)
    } else {
      console.log(`[geocode] region "${regionHint}" → 좌표 없음 (전국 검색으로 폴백)`)
    }
  }

  // 모든 장소를 병렬로 geocoding
  const settled = await Promise.all(
    uncached.map(async (location) => {
      const { coords, source } = await geocodeOne(location, regionCoords)
      return { location, coords, source }
    })
  )

  for (const { location, coords, source } of settled) {
    setCached(location, coords)
    result[location] = coords
    const icon = coords ? '✓' : '✗'
    console.log(`[geocode] ${icon} ${source.padEnd(20)} "${location}"`)
  }

  return result
}
