# Trip Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 국내 여행 목적지·기간·스타일·예산을 입력하면 Claude Advisor가 일정을 생성하고, Kakao Maps로 동선을 보여주며 인라인 편집이 가능한 개인용 웹 앱을 만든다.

**Architecture:** Next.js 15 App Router 풀스택. 홈 페이지에서 입력 → `/api/generate` 로 NDJSON 스트리밍 → 저장 후 `/itinerary` 로 이동 → 지도 geocoding 서버사이드 처리. localStorage로 일정 유지, DB 없음.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, `@anthropic-ai/sdk` (Advisor beta), `react-kakao-maps-sdk`, Jest + React Testing Library

---

## 구현 현황 (2026-04-14 기준)

### Task 완료 현황

| Task | 내용 | 상태 |
|------|------|------|
| Task 1 | 프로젝트 스캐폴딩 + Jest 설정 | ✅ 완료 |
| Task 2 | TypeScript 타입 정의 | ✅ 완료 |
| Task 3 | lib/storage.ts | ✅ 완료 |
| Task 4 | geocode API | ✅ 완료 (Kakao → Nominatim으로 변경) |
| Task 5 | app/api/generate/route.ts | ✅ 완료 |
| Task 6 | components/TripForm.tsx | ✅ 완료 |
| Task 7 | components/DayCard.tsx | ✅ 완료 |
| Task 8 | components/RouteMap.tsx | ✅ 완료 (Kakao Maps → Naver Maps로 변경) |
| Task 9 | components/ItineraryView.tsx | ✅ 완료 |
| Task 10 | 페이지 연결 + 레이아웃 | ✅ 완료 |

### 원본 계획 대비 변경 사항

#### 지도: Kakao Maps → Naver Maps (react-naver-maps)
- **이유:** Kakao Maps SDK 클라이언트 키 등록 제약 → NCP(Naver Cloud Platform) Maps로 전환
- `react-naver-maps` 패키지 사용, `NavermapsProvider` + `NaverMap` + `CustomOverlay` + `Polyline`
- NCP 콘솔에서 허용 도메인 등록 필요 (`http://localhost:3000`)
- `MapErrorBoundary` 추가: 도메인 미등록 시 graceful fallback

#### Geocoding: Kakao Local API → Nominatim (OpenStreetMap)
- **이유:** Kakao REST API 키 불필요, 서버사이드 무료 사용 가능
- `lib/geocode-server.ts`: Nominatim 호출 + 인메모리 캐시 (1.1초 rate limit)
- `lib/geocode-cache.ts`: 요청 간 캐시 공유

#### 경로 표시: 직선 → 도로 경로 (Naver Directions 15)
- 초기: Naver Directions 15 API로 도로 경로 구현 (`app/api/directions/route.ts`)
- 중간: 사용자 요청으로 직선 연결로 변경
- 최종: 다시 도로 경로로 전환 (null coords 처리 포함)
- `destWaypoints`: coords null 활동 제외 + 출발지 30km 이내 활동 제외 → Directions API 경유지
- `roadPath`: `/api/directions` 호출로 실제 도로 경로 폴리라인 표시, API 실패 시 직선 폴백
- `mapKey = JSON.stringify(activityWaypoints)`: geocoding 완료 후 NaverMap remount
- 하이라이트: 전체 도로 경로 흐리게 + 선택 구간은 직선으로 앰버 강조

#### 추가 구현 (계획에 없던 항목)

| 항목 | 파일 | 내용 |
|------|------|------|
| 오피넷 연료비 | `app/api/generate/route.ts` | 실시간 휘발유 가격 조회해 이동 비용 산정 |
| 출발지·인원 입력 | `types/index.ts`, `TripForm.tsx` | origin, adults, children, savedDestinations 필드 추가 |
| 개발 mock 모드 | `lib/mock-itinerary.ts` | `USE_MOCK_API=true` 시 Claude API 미호출, coords 포함 mock 데이터 즉시 반환 |
| Mock 재생성 스크립트 | `scripts/gen-mock.mjs` | 실제 Claude API + Nominatim으로 mock 데이터 갱신 |
| 서버사이드 일괄 geocoding | `app/api/generate/route.ts` | generate 시 모든 location을 서버에서 geocoding해 coords 포함 응답 |
| 로딩 화면 | `app/page.tsx` (`LoadingView`) | 일정 생성 중 폼을 로딩 카드로 교체. 파동 애니메이션 + 4단계 메시지 순차 전환 (7초 간격) |

### 현재 파일 구조 (실제)

| 파일 | 역할 |
|------|------|
| `types/index.ts` | 공유 타입 (TripInput, Day, Activity, Itinerary, SavedDestination) |
| `lib/storage.ts` | localStorage 일정·즐겨찾기 저장/불러오기 |
| `lib/geocode.ts` | 클라이언트 geocoding 헬퍼 (`/api/geocode` 경유) |
| `lib/geocode-server.ts` | 서버 Nominatim geocoding + 인메모리 캐시 |
| `lib/geocode-cache.ts` | geocoding 인메모리 캐시 |
| `lib/mock-itinerary.ts` | 개발용 mock 일정 데이터 (coords 포함, 4일 27개 활동) |
| `app/api/generate/route.ts` | Claude API 일정 생성 + 오피넷 유가 + geocoding 일괄 처리 |
| `app/api/geocode/route.ts` | 단건 Nominatim geocoding 프록시 |
| `app/api/directions/route.ts` | Naver Directions 15 API (도로 경로 조회, RouteMap에서 사용) |
| `components/TripForm.tsx` | 여행 조건 입력 폼 |
| `components/DayCard.tsx` | 하루 일정 카드 + 인라인 편집 |
| `components/RouteMap.tsx` | Naver Maps 지도 + 마커 + 도로 경로 폴리라인 (null coords 활동 경유지 제외) |
| `components/ItineraryView.tsx` | 날짜 탭 + DayCard + RouteMap 2단 레이아웃 |
| `app/page.tsx` | 홈 페이지 — TripForm + LoadingView (생성 중 단계별 진행 표시) |
| `app/itinerary/page.tsx` | 일정 페이지 — ItineraryView |
| `scripts/gen-mock.mjs` | mock 데이터 재생성 스크립트 |

### 환경 변수 (실제)

| 변수 | 필수 | 용도 |
|------|------|------|
| `ANTHROPIC_API_KEY` | ✅ | Claude API 일정 생성 |
| `NCP_CLIENT_ID` | ✅ | Naver Maps 서버 인증 |
| `NCP_CLIENT_SECRET` | ✅ | Naver Maps 서버 인증 |
| `NEXT_PUBLIC_NCP_KEY_ID` | ✅ | Naver Maps 브라우저 렌더링 |
| `KAKAO_REST_API_KEY` | 권장 | Nominatim null 시 geocoding fallback |
| `OPINET_API_KEY` | 선택 | 실시간 유가 조회 (없으면 1,680원/L 기본값) |
| `USE_MOCK_API` | 선택 | `true` 설정 시 Claude API 미호출 |

### Geocoding 전략 (실제 구현)

```
location 문자열
  → 인메모리 캐시 확인
  → Nominatim (OSM) — 1 req/sec
  → null이면 Kakao Local 키워드 검색 API (KAKAO_REST_API_KEY 필요)
  → 그래도 null → coords = undefined
```

**coords 없는 활동 UI 처리 (`DayCard.tsx`):**
- 번호 배지: 점선 테두리 + 흐린 색상
- 제목 옆 `지도 없음` 뱃지 (hover 시 툴팁)
- 지도 마커 없이 목록에만 표시

**coords 없는 활동 지도 경로 처리 (`RouteMap.tsx`):**
- coords null 활동은 Directions API 경유지에서 제외
- 경유지가 2개 미만이면 Directions API 미호출, 직선 폴리라인으로 폴백
- 경유지 기준으로 경로를 이어서 표시 (null 활동 주변 경로는 인접 좌표로 연결)

**null 방지 — Claude 프롬프트 규칙:**
- 구어체·비공식명 절대 금지 (예: "황남동 쌈밥거리" → "경주 황리단길")
- 식당은 특정 상호명 대신 상권명으로 대체
- 지역명 + 장소명 조합 강제 (동명이인 방지)

---

## File Map

| 파일 | 역할 |
|------|------|
| `types/index.ts` | 공유 TypeScript 타입 |
| `lib/storage.ts` | localStorage 저장/불러오기 |
| `lib/geocode.ts` | `/api/geocode` 호출 헬퍼 |
| `app/api/generate/route.ts` | Claude 스트리밍 엔드포인트 (Advisor 포함) |
| `app/api/geocode/route.ts` | Kakao Local API 프록시 (REST key 서버사이드 보호) |
| `components/TripForm.tsx` | 입력 폼 (목적지·기간·스타일·예산) |
| `components/DayCard.tsx` | 하루치 일정 카드 + 인라인 편집 |
| `components/RouteMap.tsx` | Kakao Maps 지도 + 핀 + 폴리라인 |
| `components/ItineraryView.tsx` | 날짜 탭 + DayCard + RouteMap 2단 레이아웃 |
| `app/page.tsx` | 홈 페이지 — TripForm + 스트리밍 처리 |
| `app/itinerary/page.tsx` | 일정 페이지 — 로드 + geocode + ItineraryView |
| `app/layout.tsx` | 루트 레이아웃 |
| `.env.local` | ANTHROPIC_API_KEY, KAKAO_REST_API_KEY, NEXT_PUBLIC_KAKAO_JS_KEY |

---

## Task 1: 프로젝트 스캐폴딩 + Jest 설정

**Files:**
- Create: `jest.config.ts`
- Create: `jest.setup.ts`
- Create: `.env.local`

- [ ] **Step 1: Next.js 앱 생성**

```bash
cd /Users/harry/projects/trip-planner
npx create-next-app@15 . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --no-git --eslint
```

프롬프트가 뜨면 모두 기본값(Enter) 선택.

- [ ] **Step 2: 의존성 설치**

```bash
npm install @anthropic-ai/sdk react-kakao-maps-sdk
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event ts-jest
```

- [ ] **Step 3: jest.config.ts 작성**

```ts
// jest.config.ts
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
}

export default createJestConfig(config)
```

- [ ] **Step 4: jest.setup.ts 작성**

```ts
// jest.setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: package.json에 test 스크립트 추가**

`package.json`의 `"scripts"` 섹션에 추가:
```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 6: .env.local 작성**

```bash
# .env.local
ANTHROPIC_API_KEY=your_anthropic_api_key_here
KAKAO_REST_API_KEY=your_kakao_rest_api_key_here
NEXT_PUBLIC_KAKAO_JS_KEY=your_kakao_javascript_app_key_here
```

> Kakao 키 발급: https://developers.kakao.com → 내 애플리케이션 → 앱 키
> - JavaScript 키 → NEXT_PUBLIC_KAKAO_JS_KEY
> - REST API 키 → KAKAO_REST_API_KEY

- [ ] **Step 7: 테스트 동작 확인**

```bash
npm test -- --passWithNoTests
```

Expected: `No tests found` 또는 `Test Suites: 0 passed`

- [ ] **Step 8: 커밋**

```bash
git init
git add jest.config.ts jest.setup.ts package.json package-lock.json tsconfig.json tailwind.config.ts next.config.ts
git commit -m "feat: scaffold Next.js 15 project with Jest"
```

---

## Task 2: TypeScript 타입 정의

**Files:**
- Create: `types/index.ts`

- [ ] **Step 1: types/index.ts 작성**

```ts
// types/index.ts
export type TravelStyle = '맛집' | '관광' | '자연' | '쇼핑'

export type TripInput = {
  destination: string
  startDate: string   // ISO date: "YYYY-MM-DD"
  endDate: string     // ISO date: "YYYY-MM-DD"
  styles: TravelStyle[]
  budget: number      // KRW 정수
}

export type Activity = {
  id: string
  time: string             // "HH:MM"
  title: string
  description: string
  estimatedCost: number    // KRW 정수
  location?: string        // 카카오맵 검색용 장소명
  coords?: { lat: number; lng: number }
}

export type Day = {
  date: string             // ISO date: "YYYY-MM-DD"
  activities: Activity[]
}

export type Itinerary = {
  destination: string
  startDate: string
  endDate: string
  totalBudget: number
  days: Day[]
}
```

- [ ] **Step 2: 타입 체크 확인**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add types/index.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 3: lib/storage.ts (TDD)

**Files:**
- Create: `lib/storage.ts`
- Create: `__tests__/lib/storage.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// __tests__/lib/storage.test.ts
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
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- __tests__/lib/storage.test.ts
```

Expected: `Cannot find module '@/lib/storage'`

- [ ] **Step 3: lib/storage.ts 구현**

```ts
// lib/storage.ts
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
    // 스키마 버전이 다르면 무효 처리 (future-proof)
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
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- __tests__/lib/storage.test.ts
```

Expected: `Tests: 4 passed`

- [ ] **Step 5: 커밋**

```bash
git add lib/storage.ts __tests__/lib/storage.test.ts
git commit -m "feat: add localStorage storage helpers"
```

---

## Task 4: app/api/geocode/route.ts + lib/geocode.ts (TDD)

**Files:**
- Create: `app/api/geocode/route.ts`
- Create: `lib/geocode.ts`
- Create: `__tests__/lib/geocode.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// __tests__/lib/geocode.test.ts
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
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- __tests__/lib/geocode.test.ts
```

Expected: `Cannot find module '@/lib/geocode'`

- [ ] **Step 3: app/api/geocode/route.ts 구현**

```ts
// app/api/geocode/route.ts
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
```

- [ ] **Step 4: lib/geocode.ts 구현**

```ts
// lib/geocode.ts
import type { Activity } from '@/types'

type Coords = { lat: number; lng: number }

export async function geocodeActivity(activity: Activity): Promise<Coords | null> {
  if (!activity.location) return null

  const res = await fetch('/api/geocode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location: activity.location }),
  })

  if (!res.ok) return null
  return res.json()
}

export async function geocodeDay(activities: Activity[]): Promise<Activity[]> {
  return Promise.all(
    activities.map(async (activity) => {
      if (activity.coords || !activity.location) return activity
      const coords = await geocodeActivity(activity)
      return coords ? { ...activity, coords } : activity
    })
  )
}
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
npm test -- __tests__/lib/geocode.test.ts
```

Expected: `Tests: 6 passed`

- [ ] **Step 6: 커밋**

```bash
git add app/api/geocode/route.ts lib/geocode.ts __tests__/lib/geocode.test.ts
git commit -m "feat: add Kakao geocode API route and client helper"
```

---

## Task 5: app/api/generate/route.ts (TDD)

**Files:**
- Create: `app/api/generate/route.ts`
- Create: `__tests__/api/generate.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// __tests__/api/generate.test.ts
import { POST } from '@/app/api/generate/route'
import { NextRequest } from 'next/server'

const mockDayLine = '{"date":"2026-05-01","activities":[{"id":"d1a1","time":"09:00","title":"한라산 등반","description":"백록담 코스","estimatedCost":0,"location":"한라산"}]}\n'

jest.mock('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: {
      stream: jest.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield {
            type: 'content_block_delta',
            delta: { type: 'text_delta', text: mockDayLine },
          }
        },
      }),
    },
  })),
}))

describe('POST /api/generate', () => {
  it('returns 200 with streaming text/plain response', async () => {
    const req = new NextRequest('http://localhost/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        destination: '제주도',
        startDate: '2026-05-01',
        endDate: '2026-05-03',
        styles: ['관광'],
        budget: 500000,
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/plain')
  })

  it('streams NDJSON day objects', async () => {
    const req = new NextRequest('http://localhost/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        destination: '제주도',
        startDate: '2026-05-01',
        endDate: '2026-05-03',
        styles: ['관광'],
        budget: 500000,
      }),
    })

    const res = await POST(req)
    const text = await res.text()
    const parsed = JSON.parse(text.trim())
    expect(parsed.date).toBe('2026-05-01')
    expect(parsed.activities[0].title).toBe('한라산 등반')
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- __tests__/api/generate.test.ts
```

Expected: `Cannot find module '@/app/api/generate/route'`

- [ ] **Step 3: app/api/generate/route.ts 구현**

```ts
// app/api/generate/route.ts
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import type { TripInput } from '@/types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'anthropic-beta': 'advisor-tool-2026-03-01',
  },
})

const SYSTEM_PROMPT = `당신은 한국 국내 여행 전문가입니다. 요청에 맞는 여행 일정을 생성하세요.

규칙:
1. 하루 일정 하나를 JSON 한 줄로 출력합니다
2. 날짜마다 줄바꿈(\n)으로 구분합니다
3. 설명 텍스트 없이 JSON만 출력합니다

각 줄 형식 (정확히 준수):
{"date":"YYYY-MM-DD","activities":[{"id":"고유문자열","time":"HH:MM","title":"장소명","description":"설명","estimatedCost":원화정수,"location":"카카오맵검색용장소명"}]}`

export async function POST(req: NextRequest) {
  const input: TripInput = await req.json()

  const userPrompt = `목적지: ${input.destination}
여행 기간: ${input.startDate} ~ ${input.endDate}
여행 스타일: ${input.styles.join(', ')}
총 예산: ${input.budget.toLocaleString()}원

각 날짜를 별도의 JSON 줄로 출력해주세요.`

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const messageStream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tools: [{ type: 'advisor_20260301' as any, name: 'advisor', model: 'claude-opus-4-6' }],
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }],
        })

        for await (const event of messageStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- __tests__/api/generate.test.ts
```

Expected: `Tests: 2 passed`

- [ ] **Step 5: 커밋**

```bash
git add app/api/generate/route.ts __tests__/api/generate.test.ts
git commit -m "feat: add Claude streaming API route with Advisor tool"
```

---

## Task 6: components/TripForm.tsx (TDD)

**Files:**
- Create: `components/TripForm.tsx`
- Create: `__tests__/components/TripForm.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
// __tests__/components/TripForm.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TripForm from '@/components/TripForm'

describe('TripForm', () => {
  it('renders all input fields', () => {
    render(<TripForm onSubmit={jest.fn()} loading={false} />)
    expect(screen.getByPlaceholderText('예: 제주도, 부산')).toBeInTheDocument()
    expect(screen.getByLabelText('출발일')).toBeInTheDocument()
    expect(screen.getByLabelText('도착일')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('예산 (원)')).toBeInTheDocument()
    expect(screen.getByText('맛집')).toBeInTheDocument()
    expect(screen.getByText('관광')).toBeInTheDocument()
    expect(screen.getByText('자연')).toBeInTheDocument()
    expect(screen.getByText('쇼핑')).toBeInTheDocument()
  })

  it('calls onSubmit with correct values', async () => {
    const user = userEvent.setup()
    const onSubmit = jest.fn()
    render(<TripForm onSubmit={onSubmit} loading={false} />)

    await user.type(screen.getByPlaceholderText('예: 제주도, 부산'), '제주도')
    await user.type(screen.getByLabelText('출발일'), '2026-05-01')
    await user.type(screen.getByLabelText('도착일'), '2026-05-03')
    await user.click(screen.getByText('맛집'))
    await user.type(screen.getByPlaceholderText('예산 (원)'), '500000')
    await user.click(screen.getByRole('button', { name: '일정 생성' }))

    expect(onSubmit).toHaveBeenCalledWith({
      destination: '제주도',
      startDate: '2026-05-01',
      endDate: '2026-05-03',
      styles: ['맛집'],
      budget: 500000,
    })
  })

  it('toggles style on repeated click', async () => {
    const user = userEvent.setup()
    const onSubmit = jest.fn()
    render(<TripForm onSubmit={onSubmit} loading={false} />)

    await user.click(screen.getByText('관광'))
    await user.click(screen.getByText('관광')) // deselect
    await user.type(screen.getByPlaceholderText('예: 제주도, 부산'), '서울')
    await user.type(screen.getByLabelText('출발일'), '2026-06-01')
    await user.type(screen.getByLabelText('도착일'), '2026-06-02')
    await user.type(screen.getByPlaceholderText('예산 (원)'), '300000')
    await user.click(screen.getByRole('button', { name: '일정 생성' }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ styles: [] })
    )
  })

  it('disables button and shows loading text when loading', () => {
    render(<TripForm onSubmit={jest.fn()} loading={true} />)
    const btn = screen.getByRole('button', { name: '생성 중...' })
    expect(btn).toBeDisabled()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- __tests__/components/TripForm.test.tsx
```

Expected: `Cannot find module '@/components/TripForm'`

- [ ] **Step 3: components/TripForm.tsx 구현**

```tsx
// components/TripForm.tsx
'use client'

import { useState } from 'react'
import type { TripInput, TravelStyle } from '@/types'

const STYLES: TravelStyle[] = ['맛집', '관광', '자연', '쇼핑']

type Props = {
  onSubmit: (input: TripInput) => void
  loading: boolean
}

export default function TripForm({ onSubmit, loading }: Props) {
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [styles, setStyles] = useState<TravelStyle[]>([])
  const [budget, setBudget] = useState('')

  function toggleStyle(style: TravelStyle) {
    setStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      destination,
      startDate,
      endDate,
      styles,
      budget: parseInt(budget, 10),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
      <div>
        <label className="block text-sm font-medium mb-1">목적지</label>
        <input
          type="text"
          placeholder="예: 제주도, 부산"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          required
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="startDate" className="block text-sm font-medium mb-1">
            출발일
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="endDate" className="block text-sm font-medium mb-1">
            도착일
          </label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">여행 스타일</label>
        <div className="flex gap-2 flex-wrap">
          {STYLES.map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => toggleStyle(style)}
              className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                styles.includes(style)
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">예산</label>
        <input
          type="number"
          placeholder="예산 (원)"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          required
          min={0}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? '생성 중...' : '일정 생성'}
      </button>
    </form>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- __tests__/components/TripForm.test.tsx
```

Expected: `Tests: 4 passed`

- [ ] **Step 5: 커밋**

```bash
git add components/TripForm.tsx __tests__/components/TripForm.test.tsx
git commit -m "feat: add TripForm component"
```

---

## Task 7: components/DayCard.tsx (TDD)

**Files:**
- Create: `components/DayCard.tsx`
- Create: `__tests__/components/DayCard.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
// __tests__/components/DayCard.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DayCard from '@/components/DayCard'
import type { Day } from '@/types'

const mockDay: Day = {
  date: '2026-05-01',
  activities: [
    {
      id: 'a1',
      time: '09:00',
      title: '경복궁 관람',
      description: '조선 시대 왕궁',
      estimatedCost: 3000,
      location: '경복궁',
    },
  ],
}

describe('DayCard', () => {
  it('renders date, activities, and total cost', () => {
    render(<DayCard day={mockDay} onChange={jest.fn()} highlightedActivityId={null} />)
    expect(screen.getByText('경복궁 관람')).toBeInTheDocument()
    expect(screen.getByText('09:00')).toBeInTheDocument()
    expect(screen.getByText('₩3,000')).toBeInTheDocument()
  })

  it('enters edit mode when activity is clicked', async () => {
    const user = userEvent.setup()
    render(<DayCard day={mockDay} onChange={jest.fn()} highlightedActivityId={null} />)
    await user.click(screen.getByText('경복궁 관람'))
    expect(screen.getByDisplayValue('경복궁 관람')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument()
  })

  it('calls onChange with updated activity on save', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    render(<DayCard day={mockDay} onChange={onChange} highlightedActivityId={null} />)

    await user.click(screen.getByText('경복궁 관람'))
    const titleInput = screen.getByDisplayValue('경복궁 관람')
    await user.clear(titleInput)
    await user.type(titleInput, '덕수궁 관람')
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        activities: [expect.objectContaining({ id: 'a1', title: '덕수궁 관람' })],
      })
    )
  })

  it('cancels edit without calling onChange', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    render(<DayCard day={mockDay} onChange={onChange} highlightedActivityId={null} />)

    await user.click(screen.getByText('경복궁 관람'))
    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText('경복궁 관람')).toBeInTheDocument()
  })

  it('calls onChange without deleted activity', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    render(<DayCard day={mockDay} onChange={onChange} highlightedActivityId={null} />)

    await user.click(screen.getByRole('button', { name: '삭제' }))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ activities: [] })
    )
  })

  it('applies ring highlight when highlightedActivityId matches', () => {
    render(<DayCard day={mockDay} onChange={jest.fn()} highlightedActivityId="a1" />)
    const item = screen.getByText('경복궁 관람').closest('li')
    expect(item).toHaveClass('ring-2')
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- __tests__/components/DayCard.test.tsx
```

Expected: `Cannot find module '@/components/DayCard'`

- [ ] **Step 3: components/DayCard.tsx 구현**

```tsx
// components/DayCard.tsx
'use client'

import { useState } from 'react'
import type { Day, Activity } from '@/types'

type EditState = {
  activityId: string
  title: string
  description: string
  time: string
  estimatedCost: string
}

type Props = {
  day: Day
  onChange: (day: Day) => void
  highlightedActivityId: string | null
}

export default function DayCard({ day, onChange, highlightedActivityId }: Props) {
  const [editState, setEditState] = useState<EditState | null>(null)

  const dateLabel = new Date(day.date + 'T00:00:00').toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
  const totalCost = day.activities.reduce((sum, a) => sum + a.estimatedCost, 0)

  function startEdit(activity: Activity) {
    setEditState({
      activityId: activity.id,
      title: activity.title,
      description: activity.description,
      time: activity.time,
      estimatedCost: String(activity.estimatedCost),
    })
  }

  function saveEdit() {
    if (!editState) return
    onChange({
      ...day,
      activities: day.activities.map((a) =>
        a.id === editState.activityId
          ? {
              ...a,
              title: editState.title,
              description: editState.description,
              time: editState.time,
              estimatedCost: parseInt(editState.estimatedCost, 10) || 0,
            }
          : a
      ),
    })
    setEditState(null)
  }

  function deleteActivity(id: string) {
    onChange({ ...day, activities: day.activities.filter((a) => a.id !== id) })
  }

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-800">{dateLabel}</h3>
        <span className="text-sm text-gray-500">
          총 ₩{totalCost.toLocaleString()}
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {day.activities.map((activity) =>
          editState?.activityId === activity.id ? (
            <li key={activity.id} className="rounded-lg border p-3 bg-blue-50">
              <div className="flex flex-col gap-2">
                <input
                  value={editState.title}
                  onChange={(e) =>
                    setEditState({ ...editState, title: e.target.value })
                  }
                  className="border rounded px-2 py-1 text-sm w-full"
                />
                <input
                  value={editState.description}
                  onChange={(e) =>
                    setEditState({ ...editState, description: e.target.value })
                  }
                  className="border rounded px-2 py-1 text-sm w-full"
                />
                <div className="flex gap-2">
                  <input
                    value={editState.time}
                    onChange={(e) =>
                      setEditState({ ...editState, time: e.target.value })
                    }
                    className="border rounded px-2 py-1 text-sm w-24"
                    placeholder="HH:MM"
                  />
                  <input
                    type="number"
                    value={editState.estimatedCost}
                    onChange={(e) =>
                      setEditState({ ...editState, estimatedCost: e.target.value })
                    }
                    className="border rounded px-2 py-1 text-sm flex-1"
                    placeholder="비용 (원)"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setEditState(null)}
                    className="px-3 py-1 bg-gray-200 rounded text-sm"
                  >
                    취소
                  </button>
                </div>
              </div>
            </li>
          ) : (
            <li
              key={activity.id}
              onClick={() => startEdit(activity)}
              className={`rounded-lg border p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                highlightedActivityId === activity.id ? 'ring-2 ring-blue-400' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-gray-400 mr-2">{activity.time}</span>
                  <span className="font-medium text-sm">{activity.title}</span>
                  {activity.description && (
                    <p className="text-xs text-gray-500 mt-0.5 ml-8 truncate">
                      {activity.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  <span className="text-xs text-gray-500">
                    ₩{activity.estimatedCost.toLocaleString()}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteActivity(activity.id)
                    }}
                    aria-label="삭제"
                    className="text-gray-300 hover:text-red-400 text-base leading-none"
                  >
                    ×
                  </button>
                </div>
              </div>
            </li>
          )
        )}
      </ul>
    </div>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- __tests__/components/DayCard.test.tsx
```

Expected: `Tests: 6 passed`

- [ ] **Step 5: 커밋**

```bash
git add components/DayCard.tsx __tests__/components/DayCard.test.tsx
git commit -m "feat: add DayCard component with inline editing"
```

---

## Task 8: components/RouteMap.tsx

**Files:**
- Create: `components/RouteMap.tsx`

> Kakao Maps SDK는 브라우저 전용이라 Jest에서 단위 테스트하기 어렵다. ItineraryView 테스트에서 mock으로 처리하고, 실제 동작은 브라우저에서 확인한다.

- [ ] **Step 1: components/RouteMap.tsx 구현**

```tsx
// components/RouteMap.tsx
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
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add components/RouteMap.tsx
git commit -m "feat: add RouteMap component with Kakao Maps pins and polyline"
```

---

## Task 9: components/ItineraryView.tsx (TDD)

**Files:**
- Create: `components/ItineraryView.tsx`
- Create: `__tests__/components/ItineraryView.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
// __tests__/components/ItineraryView.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ItineraryView from '@/components/ItineraryView'
import type { Itinerary } from '@/types'

// RouteMap은 Kakao SDK 의존성이 있으므로 mock 처리
jest.mock('@/components/RouteMap', () => () => <div data-testid="route-map" />)

const mockItinerary: Itinerary = {
  destination: '제주도',
  startDate: '2026-05-01',
  endDate: '2026-05-02',
  totalBudget: 500000,
  days: [
    {
      date: '2026-05-01',
      activities: [
        {
          id: 'a1',
          time: '09:00',
          title: '한라산 등반',
          description: '백록담 코스',
          estimatedCost: 0,
          location: '한라산',
        },
      ],
    },
    {
      date: '2026-05-02',
      activities: [
        {
          id: 'a2',
          time: '10:00',
          title: '성산일출봉',
          description: '유네스코 세계자연유산',
          estimatedCost: 5000,
          location: '성산일출봉',
        },
      ],
    },
  ],
}

describe('ItineraryView', () => {
  it('renders day tabs', () => {
    render(<ItineraryView itinerary={mockItinerary} onUpdate={jest.fn()} />)
    expect(screen.getByText('1일차')).toBeInTheDocument()
    expect(screen.getByText('2일차')).toBeInTheDocument()
  })

  it('shows first day activities by default', () => {
    render(<ItineraryView itinerary={mockItinerary} onUpdate={jest.fn()} />)
    expect(screen.getByText('한라산 등반')).toBeInTheDocument()
    expect(screen.queryByText('성산일출봉')).not.toBeInTheDocument()
  })

  it('switches to second day on tab click', async () => {
    const user = userEvent.setup()
    render(<ItineraryView itinerary={mockItinerary} onUpdate={jest.fn()} />)
    await user.click(screen.getByText('2일차'))
    expect(screen.getByText('성산일출봉')).toBeInTheDocument()
    expect(screen.queryByText('한라산 등반')).not.toBeInTheDocument()
  })

  it('shows budget summary', () => {
    render(<ItineraryView itinerary={mockItinerary} onUpdate={jest.fn()} />)
    expect(screen.getByText(/500,000/)).toBeInTheDocument()
  })

  it('renders route map', () => {
    render(<ItineraryView itinerary={mockItinerary} onUpdate={jest.fn()} />)
    expect(screen.getByTestId('route-map')).toBeInTheDocument()
  })

  it('calls onUpdate when DayCard changes', async () => {
    const user = userEvent.setup()
    const onUpdate = jest.fn()
    render(<ItineraryView itinerary={mockItinerary} onUpdate={onUpdate} />)

    await user.click(screen.getByText('한라산 등반'))
    const titleInput = screen.getByDisplayValue('한라산 등반')
    await user.clear(titleInput)
    await user.type(titleInput, '윗세오름 코스')
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        days: expect.arrayContaining([
          expect.objectContaining({
            activities: expect.arrayContaining([
              expect.objectContaining({ title: '윗세오름 코스' }),
            ]),
          }),
        ]),
      })
    )
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- __tests__/components/ItineraryView.test.tsx
```

Expected: `Cannot find module '@/components/ItineraryView'`

- [ ] **Step 3: components/ItineraryView.tsx 구현**

```tsx
// components/ItineraryView.tsx
'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { Itinerary, Day } from '@/types'
import DayCard from './DayCard'

// RouteMap은 Kakao Maps SDK(브라우저 전용, 무거운 번들)이므로 동적 import.
// ssr: false로 서버사이드 렌더링을 건너뛴다.
const RouteMap = dynamic(() => import('./RouteMap'), { ssr: false })

type Props = {
  itinerary: Itinerary
  onUpdate: (itinerary: Itinerary) => void
}

export default function ItineraryView({ itinerary, onUpdate }: Props) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [highlightedActivityId, setHighlightedActivityId] = useState<string | null>(null)

  const selectedDay = itinerary.days[selectedDayIndex] ?? null
  const totalSpend = itinerary.days
    .flatMap((d) => d.activities)
    .reduce((sum, a) => sum + a.estimatedCost, 0)

  function handleDayChange(day: Day) {
    const updatedDays = itinerary.days.map((d, i) =>
      i === selectedDayIndex ? day : d
    )
    onUpdate({ ...itinerary, days: updatedDays })
  }

  return (
    <div className="flex flex-col h-full gap-3">
      {/* 예산 요약 */}
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-xl">{itinerary.destination}</h2>
        <span className="text-sm text-gray-600">
          예산 ₩{itinerary.totalBudget.toLocaleString()} / 예상 ₩{totalSpend.toLocaleString()}
        </span>
      </div>

      {/* 날짜 탭 */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {itinerary.days.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setSelectedDayIndex(i)
              setHighlightedActivityId(null)
            }}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
              selectedDayIndex === i
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {i + 1}일차
          </button>
        ))}
      </div>

      {/* 2단 레이아웃 */}
      <div className="flex gap-4 flex-1 min-h-0">
        <div className="w-1/2 overflow-y-auto">
          {selectedDay && (
            <DayCard
              day={selectedDay}
              onChange={handleDayChange}
              highlightedActivityId={highlightedActivityId}
            />
          )}
        </div>
        <div className="w-1/2 rounded-xl overflow-hidden min-h-64">
          <RouteMap
            day={selectedDay}
            highlightedActivityId={highlightedActivityId}
            onMarkerClick={setHighlightedActivityId}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- __tests__/components/ItineraryView.test.tsx
```

Expected: `Tests: 6 passed`

- [ ] **Step 5: 커밋**

```bash
git add components/ItineraryView.tsx __tests__/components/ItineraryView.test.tsx
git commit -m "feat: add ItineraryView with day tabs and map layout"
```

---

## Task 10: 페이지 연결 + 레이아웃

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Create: `app/itinerary/page.tsx`

- [ ] **Step 1: app/layout.tsx 업데이트**

기존 파일에서 `<body>` 클래스를 심플하게 변경:

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '여행 플래너',
  description: 'AI가 만드는 나만의 국내 여행 일정',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={geist.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: app/page.tsx 구현 — 폼 + 스트리밍 처리**

```tsx
// app/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TripForm from '@/components/TripForm'
import type { TripInput, Itinerary, Day } from '@/types'
import { saveItinerary } from '@/lib/storage'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(input: TripInput) {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!res.ok || !res.body) throw new Error('생성 실패')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      const days: Day[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          try {
            days.push(JSON.parse(trimmed) as Day)
          } catch {
            // 불완전한 줄 무시
          }
        }
      }

      // 남은 버퍼 처리
      if (buffer.trim()) {
        try {
          days.push(JSON.parse(buffer.trim()) as Day)
        } catch {
          // 무시
        }
      }

      const itinerary: Itinerary = {
        destination: input.destination,
        startDate: input.startDate,
        endDate: input.endDate,
        totalBudget: input.budget,
        days,
      }

      saveItinerary(itinerary)
      router.push('/itinerary')
    } catch {
      setError('일정 생성에 실패했습니다. 다시 시도해주세요.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-2 text-gray-900">여행 플래너</h1>
      <p className="text-gray-500 mb-8 text-sm">
        AI가 나만의 국내 여행 일정을 만들어드립니다
      </p>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm max-w-md w-full flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline ml-2">
            닫기
          </button>
        </div>
      )}
      <TripForm onSubmit={handleSubmit} loading={loading} />
    </main>
  )
}
```

- [ ] **Step 3: app/itinerary/page.tsx 구현**

```tsx
// app/itinerary/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Itinerary } from '@/types'
import ItineraryView from '@/components/ItineraryView'
import { saveItinerary, loadItinerary, clearItinerary } from '@/lib/storage'
import { geocodeDay } from '@/lib/geocode'

export default function ItineraryPage() {
  const router = useRouter()
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)

  useEffect(() => {
    const saved = loadItinerary()
    if (!saved) {
      router.push('/')
      return
    }
    setItinerary(saved)

    // 좌표가 없는 활동들을 geocode
    async function geocodeAll(base: Itinerary) {
      const geocodedDays = await Promise.all(
        base.days.map(async (day) => ({
          ...day,
          activities: await geocodeDay(day.activities),
        }))
      )
      const updated = { ...base, days: geocodedDays }
      setItinerary(updated)
      saveItinerary(updated)
    }

    geocodeAll(saved)
  }, [router])

  function handleUpdate(updated: Itinerary) {
    setItinerary(updated)
    saveItinerary(updated)
  }

  if (!itinerary) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">일정을 불러오는 중...</p>
      </main>
    )
  }

  return (
    <main className="h-screen flex flex-col p-4 bg-gray-50">
      <div className="mb-3">
        <button
          onClick={() => {
            clearItinerary()
            router.push('/')
          }}
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          ← 처음부터 다시
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <ItineraryView itinerary={itinerary} onUpdate={handleUpdate} />
      </div>
    </main>
  )
}
```

- [ ] **Step 4: 전체 테스트 통과 확인**

```bash
npm test
```

Expected: 모든 테스트 통과

- [ ] **Step 5: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 6: 개발 서버 실행 후 브라우저 확인**

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속:
- 홈 화면에 입력 폼 표시 확인
- 폼 작성 후 "일정 생성" 클릭 → `/itinerary` 이동 확인
- 날짜 탭 전환 확인
- 지도 렌더링 확인 (NEXT_PUBLIC_KAKAO_JS_KEY 필요)
- 활동 카드 클릭 → 인라인 편집 확인

- [ ] **Step 7: 최종 커밋**

```bash
git add app/layout.tsx app/page.tsx app/itinerary/page.tsx
git commit -m "feat: add home and itinerary pages, wire up full flow"
```

---

## 환경 변수 체크리스트

| 변수 | 용도 | 발급 위치 |
|------|------|-----------|
| `ANTHROPIC_API_KEY` | Claude API | console.anthropic.com |
| `KAKAO_REST_API_KEY` | Kakao Local API (geocoding, 서버사이드) | developers.kakao.com → REST API 키 |
| `NEXT_PUBLIC_KAKAO_JS_KEY` | Kakao Maps SDK (클라이언트) | developers.kakao.com → JavaScript 키 |
