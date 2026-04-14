import { NextRequest, NextResponse } from 'next/server'

type Point = { lat: number; lng: number }

export async function POST(req: NextRequest) {
  const { waypoints }: { waypoints: Point[] } = await req.json()

  if (waypoints.length < 2) {
    return NextResponse.json({ path: waypoints })
  }

  const origin = waypoints[0]
  const destination = waypoints[waypoints.length - 1]
  const midpoints = waypoints.slice(1, -1)

  // Naver Directions: 경유지 최대 5개
  const sampled = midpoints.length > 5
    ? midpoints.filter((_, i) => i % Math.ceil(midpoints.length / 5) === 0).slice(0, 5)
    : midpoints

  const params = new URLSearchParams({
    start: `${origin.lng},${origin.lat}`,
    goal: `${destination.lng},${destination.lat}`,
  })
  if (sampled.length > 0) {
    params.set('waypoints', sampled.map((p) => `${p.lng},${p.lat}`).join(':'))
  }

  try {
    const res = await fetch(
      `https://maps.apigw.ntruss.com/map-direction-15/v1/driving?${params}`,
      {
        headers: {
          'X-NCP-APIGW-API-KEY-ID': process.env.NCP_CLIENT_ID!,
          'X-NCP-APIGW-API-KEY': process.env.NCP_CLIENT_SECRET!,
        },
      }
    )

    if (!res.ok) return NextResponse.json({ path: waypoints })

    const data = await res.json()
    const route = data?.route?.traoptimal?.[0]

    if (!route) return NextResponse.json({ path: waypoints })

    // Naver path: [[lng, lat], [lng, lat], ...]
    const path: Point[] = (route.path as [number, number][]).map(([lng, lat]) => ({ lat, lng }))

    return NextResponse.json({ path: path.length > 0 ? path : waypoints })
  } catch {
    return NextResponse.json({ path: waypoints })
  }
}
