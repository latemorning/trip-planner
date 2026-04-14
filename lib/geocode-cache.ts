import fs from 'fs'
import path from 'path'

type Coords = { lat: number; lng: number }
type Cache = Record<string, Coords | null>

// Vercel 배포 시 /tmp 사용, 로컬은 data/ 폴더
const CACHE_PATH = process.env.VERCEL
  ? '/tmp/geocode-cache.json'
  : path.join(process.cwd(), 'data/geocode-cache.json')

let memCache: Cache | null = null

function loadCache(): Cache {
  if (memCache) return memCache
  try {
    memCache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'))
  } catch {
    memCache = {}
  }
  return memCache!
}

function saveCache(cache: Cache) {
  try {
    const dir = path.dirname(CACHE_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2))
  } catch { /* 쓰기 실패 시 무시 (메모리 캐시는 유지) */ }
}

/** 캐시 히트: Coords | null / 미스: undefined */
export function getCached(location: string): Coords | null | undefined {
  const cache = loadCache()
  return location in cache ? cache[location] : undefined
}

export function setCached(location: string, coords: Coords | null) {
  const cache = loadCache()
  cache[location] = coords
  saveCache(cache)
}
