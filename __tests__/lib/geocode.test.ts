import { geocodeActivity, geocodeDay } from '@/lib/geocode'
import type { Activity } from '@/types'

const mockActivity: Activity = {
  id: 'a1',
  time: '09:00',
  title: '경복궁 관람',
  description: '조선 시대 왕궁',
  estimatedCost: 3000,
  location: '경복궁',
}

describe('geocodeActivity', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  it('returns coords on success', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ lat: 37.579, lng: 126.977 }),
    })

    const result = await geocodeActivity(mockActivity)
    expect(result).toEqual({ lat: 37.579, lng: 126.977 })
    expect(global.fetch).toHaveBeenCalledWith('/api/geocode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location: '경복궁' }),
    })
  })

  it('returns null when activity has no location', async () => {
    const result = await geocodeActivity({ ...mockActivity, location: undefined })
    expect(result).toBeNull()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns null when fetch fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false })
    const result = await geocodeActivity(mockActivity)
    expect(result).toBeNull()
  })
})

describe('geocodeDay', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  it('attaches coords to activities with locations', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ lat: 37.579, lng: 126.977 }),
    })

    const result = await geocodeDay([mockActivity])
    expect(result[0].coords).toEqual({ lat: 37.579, lng: 126.977 })
  })

  it('skips activity that already has coords', async () => {
    const withCoords: Activity = {
      ...mockActivity,
      coords: { lat: 1, lng: 2 },
    }
    const result = await geocodeDay([withCoords])
    expect(global.fetch).not.toHaveBeenCalled()
    expect(result[0].coords).toEqual({ lat: 1, lng: 2 })
  })

  it('keeps activity without coords when geocoding fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false })
    const result = await geocodeDay([mockActivity])
    expect(result[0].coords).toBeUndefined()
  })
})
