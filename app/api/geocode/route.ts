import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const { location } = await req.json()

  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(location)}`,
    {
      headers: {
        Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
      },
    }
  )

  if (!res.ok) return Response.json(null, { status: 200 })

  const data = await res.json()
  const first = data.documents?.[0]
  if (!first) return Response.json(null, { status: 200 })

  return Response.json({
    lat: parseFloat(first.y),
    lng: parseFloat(first.x),
  })
}
