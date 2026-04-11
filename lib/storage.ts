import type { Itinerary } from '@/types'

const KEY = 'trip-planner-itinerary'
const SCHEMA_VERSION = 1

type StoredData = { v: number; itinerary: Itinerary }

export function saveItinerary(itinerary: Itinerary): void {
  try {
    const data: StoredData = { v: SCHEMA_VERSION, itinerary }
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    // localStorage 사용 불가 시 무시
  }
}

export function loadItinerary(): Itinerary | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as StoredData
    if (data.v !== SCHEMA_VERSION) return null
    return data.itinerary
  } catch {
    return null
  }
}

export function clearItinerary(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // localStorage 사용 불가 시 무시
  }
}
