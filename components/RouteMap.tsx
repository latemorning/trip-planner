'use client'

import { Map, MapMarker, Polyline, useKakaoLoader } from 'react-kakao-maps-sdk'
import type { Day } from '@/types'

type Props = {
  day: Day | null
  highlightedActivityId: string | null
  onMarkerClick: (activityId: string) => void
}

const SEOUL_CENTER = { lat: 37.5665, lng: 126.978 }

export default function RouteMap({ day, highlightedActivityId, onMarkerClick }: Props) {
  const [loading, error] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_JS_KEY!,
  })

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl">
        <p className="text-gray-400 text-sm">지도 로딩 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl">
        <p className="text-red-400 text-sm">지도를 불러올 수 없습니다.</p>
      </div>
    )
  }

  const activities = day?.activities.filter((a) => a.coords) ?? []
  const path = activities.map((a) => ({ lat: a.coords!.lat, lng: a.coords!.lng }))
  const center = activities[0]?.coords ?? SEOUL_CENTER

  return (
    <Map
      center={center}
      style={{ width: '100%', height: '100%' }}
      level={7}
    >
      {activities.map((activity) => (
        <MapMarker
          key={activity.id}
          position={activity.coords!}
          onClick={() => onMarkerClick(activity.id)}
          title={activity.title}
        />
      ))}
      {path.length >= 2 && (
        <Polyline
          path={path}
          strokeWeight={3}
          strokeColor="#3B82F6"
          strokeOpacity={0.8}
          strokeStyle="solid"
        />
      )}
    </Map>
  )
}
