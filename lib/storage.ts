import type { Itinerary, SavedDestination } from '@/types'

// ─── 일정 저장 ───────────────────────────────────────────────
const ITINERARY_KEY = 'trip-planner-itinerary'
const SCHEMA_VERSION = 1

type StoredData = { v: number; itinerary: Itinerary }

export function saveItinerary(itinerary: Itinerary): void {
  try {
    localStorage.setItem(ITINERARY_KEY, JSON.stringify({ v: SCHEMA_VERSION, itinerary } as StoredData))
  } catch { /* 무시 */ }
}

export function loadItinerary(): Itinerary | null {
  try {
    const raw = localStorage.getItem(ITINERARY_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as StoredData
    if (data.v !== SCHEMA_VERSION) return null
    return data.itinerary
  } catch { return null }
}

export function clearItinerary(): void {
  try { localStorage.removeItem(ITINERARY_KEY) } catch { /* 무시 */ }
}

// ─── 즐겨찾기 목적지 ──────────────────────────────────────────
const DESTINATIONS_KEY = 'trip-planner-saved-destinations'

export function loadSavedDestinations(): SavedDestination[] {
  try {
    const raw = localStorage.getItem(DESTINATIONS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SavedDestination[]
  } catch { return [] }
}

export function saveDestination(name: string): void {
  try {
    const current = loadSavedDestinations()
    if (current.some((d) => d.name === name)) return
    const updated: SavedDestination[] = [
      ...current,
      { name, savedAt: new Date().toISOString() },
    ]
    localStorage.setItem(DESTINATIONS_KEY, JSON.stringify(updated))
  } catch { /* 무시 */ }
}

export function removeDestination(name: string): void {
  try {
    const updated = loadSavedDestinations().filter((d) => d.name !== name)
    localStorage.setItem(DESTINATIONS_KEY, JSON.stringify(updated))
  } catch { /* 무시 */ }
}

export function isDestinationSaved(name: string): boolean {
  return loadSavedDestinations().some((d) => d.name === name)
}
