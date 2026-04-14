'use client'

import { Component, useMemo, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { NavermapsProvider, Container, NaverMap, CustomOverlay, Polyline } from 'react-naver-maps'
import type { Day } from '@/types'

class MapErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '8px', color: 'var(--text-2)', fontSize: '13px',
        }}>
          <span style={{ fontSize: '24px' }}>🗺️</span>
          <span>지도를 불러올 수 없습니다</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            NCP 콘솔에서 localhost 도메인을 등록해 주세요
          </span>
        </div>
      )
    }
    return this.props.children
  }
}

type Point = { lat: number; lng: number }

type Props = {
  day: Day | null
  originCoords?: Point
  originLabel: string
  highlightedActivityId: string | null
  onMarkerClick: (activityId: string) => void
}

const KOREA_CENTER: Point = { lat: 36.5, lng: 127.8 }


export default function RouteMap({ day, originCoords, originLabel, highlightedActivityId, onMarkerClick }: Props) {
  const allActivities = day?.activities ?? []
  // coords가 있는 활동만 경유지로 사용 (null 제외)
  const activities = allActivities.filter((a) => a.coords)
  const activityWaypoints = activities.map((a) => a.coords!)

  // 출발지(origin) 근처 활동은 폴리라인·지도 뷰에서 제외 (예: "안양 출발" 같은 이동 활동)
  const ORIGIN_THRESHOLD = 0.3 // ~30km
  const destWaypoints = originCoords
    ? activityWaypoints.filter(
        (p) => Math.hypot(p.lat - originCoords.lat, p.lng - originCoords.lng) > ORIGIN_THRESHOLD
      )
    : activityWaypoints
  const viewPts = destWaypoints.length >= 1 ? destWaypoints : activityWaypoints

  // 도로 경로 (Naver Directions API). viewPts 변경 시 재조회. null이면 직선 폴백
  const [roadPath, setRoadPath] = useState<Point[] | null>(null)
  const viewPtsKey = JSON.stringify(viewPts)
  useEffect(() => {
    if (viewPts.length < 2) { setRoadPath(null); return }
    fetch('/api/directions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waypoints: viewPts }),
    })
      .then((r) => r.json())
      .then((data: { path?: Point[] }) => setRoadPath(data.path ?? null))
      .catch(() => setRoadPath(null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewPtsKey])

  // 실제 표시 경로: 도로 경로 우선, 없으면 직선
  const displayPath = roadPath ?? viewPts

  // 하이라이트 세그먼트: 이전 활동 → 선택 활동 직선 구간 (viewPts 기준)
  // 도로 경로가 있어도 하이라이트 구간은 직선으로 표시 (도로 경로 분할은 복잡도 높음)
  const highlightSegment = useMemo(() => {
    if (!highlightedActivityId || viewPts.length < 2) return null
    const idx = viewPts.findIndex((p) =>
      activities.find((a) => a.id === highlightedActivityId)?.coords === p
    )
    if (idx < 0) return null

    return {
      segment: viewPts.slice(idx > 0 ? idx - 1 : 0, idx + 1),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedActivityId, viewPtsKey])

  const center = viewPts[Math.floor(viewPts.length / 2)] ?? originCoords ?? KOREA_CENTER
  // Naver zoom: 1(최소)~21(최대). 한국 전체≈7, 도시≈12, 동네≈14
  const zoom = viewPts.length === 0 ? 7 : viewPts.length === 1 ? 14 : 11

  // geocoding 완료 시 지도를 올바른 위치로 remount시키는 key
  const mapKey = JSON.stringify(activityWaypoints)

  return (
    <MapErrorBoundary>
    <NavermapsProvider ncpKeyId={process.env.NEXT_PUBLIC_NCP_KEY_ID!}>
      <Container style={{ width: '100%', height: '100%' }}>
        <NaverMap key={mapKey} defaultCenter={center} defaultZoom={zoom}>

          {/* 경로 폴리라인 — 하이라이트 없을 때 (도로 경로 우선, 없으면 직선) */}
          {displayPath.length >= 2 && !highlightSegment && (
            <>
              <Polyline path={displayPath} strokeColor="#000000" strokeWeight={10} strokeOpacity={0.25} />
              <Polyline path={displayPath} strokeColor="#F59E0B" strokeWeight={6} strokeOpacity={1} />
            </>
          )}

          {/* 하이라이트 모드: 전체 도로 경로 흐리게 + 선택 구간 직선 강조 */}
          {highlightSegment && (
            <>
              {displayPath.length >= 2 && (
                <Polyline path={displayPath} strokeColor="#6B7280" strokeWeight={5} strokeOpacity={0.35} />
              )}
              <Polyline path={highlightSegment.segment} strokeColor="#000000" strokeWeight={12} strokeOpacity={0.3} />
              <Polyline path={highlightSegment.segment} strokeColor="#F59E0B" strokeWeight={8} strokeOpacity={1} />
            </>
          )}

          {/* 출발지 마커 (파란 pill, 1일차에만) */}
          {originCoords && (
            <CustomOverlay position={originCoords} zIndex={5}>
              <div style={{ transform: 'translate(-50%, -100%)', pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  padding: '4px 10px',
                  borderRadius: '100px',
                  background: '#3B82F6',
                  border: '2px solid #fff',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(59,130,246,0.5)',
                  whiteSpace: 'nowrap',
                  fontFamily: 'sans-serif',
                }}>
                  🏠 {originLabel}
                </div>
                <div style={{
                  width: 0, height: 0,
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: '6px solid #3B82F6',
                }} />
              </div>
            </CustomOverlay>
          )}

          {/* 활동 번호 마커 */}
          {allActivities.map((activity, idx) => {
            if (!activity.coords) return null
            const isHighlighted = highlightedActivityId === activity.id
            return (
              <CustomOverlay
                key={activity.id}
                position={activity.coords}
                zIndex={isHighlighted ? 10 : 1}
              >
                <div
                  onClick={() => onMarkerClick(activity.id)}
                  style={{
                    transform: isHighlighted ? 'translate(-50%, -50%) translateY(-4px)' : 'translate(-50%, -50%)',
                    width: isHighlighted ? '34px' : '26px',
                    height: isHighlighted ? '34px' : '26px',
                    borderRadius: '50%',
                    background: isHighlighted ? '#F59E0B' : '#111827',
                    border: isHighlighted ? '3px solid #fff' : '2px solid #4A5875',
                    color: isHighlighted ? '#000' : '#E8ECF4',
                    fontSize: isHighlighted ? '13px' : '11px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: isHighlighted
                      ? '0 0 0 4px rgba(245,158,11,0.3), 0 4px 12px rgba(0,0,0,0.4)'
                      : '0 2px 6px rgba(0,0,0,0.4)',
                    fontFamily: 'sans-serif',
                    userSelect: 'none',
                  }}
                  title={activity.title}
                >
                  {idx + 1}
                </div>
              </CustomOverlay>
            )
          })}

        </NaverMap>
      </Container>
    </NavermapsProvider>
    </MapErrorBoundary>
  )
}
