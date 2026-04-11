import { saveItinerary, loadItinerary, clearItinerary } from '@/lib/storage'
import type { Itinerary } from '@/types'

const mockItinerary: Itinerary = {
  destination: '제주도',
  startDate: '2026-05-01',
  endDate: '2026-05-03',
  totalBudget: 500000,
  days: [],
}

describe('storage', () => {
  beforeEach(() => localStorage.clear())

  it('saves and loads itinerary', () => {
    saveItinerary(mockItinerary)
    expect(loadItinerary()).toEqual(mockItinerary)
  })

  it('returns null when nothing is saved', () => {
    expect(loadItinerary()).toBeNull()
  })

  it('clears saved itinerary', () => {
    saveItinerary(mockItinerary)
    clearItinerary()
    expect(loadItinerary()).toBeNull()
  })

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('trip-planner-itinerary', 'not-valid-json')
    expect(loadItinerary()).toBeNull()
  })

  it('returns null when schema version does not match', () => {
    localStorage.setItem(
      'trip-planner-itinerary',
      JSON.stringify({ v: 99, itinerary: mockItinerary })
    )
    expect(loadItinerary()).toBeNull()
  })
})
