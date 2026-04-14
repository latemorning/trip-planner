import { NextRequest } from 'next/server'
import { geocodeLocations } from '@/lib/geocode-server'

export async function POST(req: NextRequest) {
  const { location } = await req.json()
  if (!location) return Response.json(null)
  const result = await geocodeLocations([location])
  return Response.json(result[location] ?? null)
}
