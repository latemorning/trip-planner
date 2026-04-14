# 여행 플래너

Claude AI가 자차 기준 여행 일정을 자동 생성하고, 지도 위에 직선 경로로 시각화하는 Next.js 앱.

## 기능

- **일정 자동 생성**: Claude Sonnet + Advisor Tool로 출발지/목적지/기간/예산/인원 기반 일정 생성
- **실시간 연료비 계산**: 오피넷 API로 당일 휘발유 가격 조회해 이동 비용 산정
- **지도 시각화**: Naver Maps(react-naver-maps)에 활동 마커 + 직선 경로 표시
- **인라인 편집**: 일정 항목 제목·시간·장소·비용 직접 수정
- **Geocoding**: Nominatim(OpenStreetMap) 서버사이드 geocoding + 인메모리 캐시
- **개발 모드**: `USE_MOCK_API=true` 설정 시 Claude API 호출 없이 미리 생성된 mock 데이터 사용

---

## 환경 설정

`.env.local` 파일:

```env
# 필수
ANTHROPIC_API_KEY=sk-ant-...
NCP_CLIENT_ID=...                   # Naver Cloud Platform Maps 클라이언트 ID
NCP_CLIENT_SECRET=...               # Naver Cloud Platform Maps 시크릿
NEXT_PUBLIC_NCP_KEY_ID=...          # 브라우저용 NCP 키 (NCP_CLIENT_ID와 동일)

# 선택
OPINET_API_KEY=...                  # 오피넷 실시간 유가 (없으면 1,680원/L 기본값)
USE_MOCK_API=true                   # true 설정 시 Claude API 미호출, mock 데이터 사용
```

### NCP 콘솔 설정

Naver Maps를 localhost에서 사용하려면 NCP 콘솔에서 아래 도메인 등록 필요:
- `http://localhost:3000`

---

## 실행

```bash
npm install
npm run dev       # http://localhost:3000
```

---

## 아키텍처

```
app/
  page.tsx                  # 홈 — TripForm으로 여행 입력
  itinerary/page.tsx        # 일정 화면 — ItineraryView
  api/
    generate/route.ts       # Claude API 호출 + geocoding 일괄 처리
    geocode/route.ts        # 단건 Nominatim geocoding (클라이언트 요청용)
    directions/route.ts     # Naver Directions API (현재 미사용)

components/
  TripForm.tsx              # 여행 조건 입력 폼
  ItineraryView.tsx         # 날짜 탭 + 지도 레이아웃
  DayCard.tsx               # 하루 일정 카드 (인라인 편집)
  RouteMap.tsx              # Naver Maps 지도 + 마커 + 경로 폴리라인

lib/
  geocode.ts                # 클라이언트 geocoding 헬퍼 (API 라우트 경유)
  geocode-server.ts         # 서버 Nominatim 호출 + 캐시
  geocode-cache.ts          # 인메모리 geocoding 캐시
  mock-itinerary.ts         # 개발용 mock 일정 데이터 (coords 포함)
  storage.ts                # localStorage 기반 일정/즐겨찾기 저장

types/index.ts              # TripInput, Day, Activity, Itinerary 타입
```

### 일정 생성 플로우

1. `TripForm` → `/api/generate` POST
2. 서버: 오피넷 유가 조회 → Claude API 스트리밍 → NDJSON 파싱
3. 서버: 모든 `location` 필드를 Nominatim으로 일괄 geocoding
4. 응답: `{ days: Day[], originCoords }` (coords 포함)
5. 클라이언트: `localStorage`에 저장 → `/itinerary` 리다이렉트

### 지도 뷰 동작

- `activityWaypoints`: 좌표가 있는 활동만 필터링
- `destWaypoints`: 출발지(origin) 30km 이내 활동 제외 → 목적지 중심 뷰
- `mapKey = JSON.stringify(activityWaypoints)`: geocoding 완료 시 NaverMap remount → 올바른 위치로 초기화
- 폴리라인은 `destWaypoints`로만 연결 (출발지~목적지 장거리 선 제거)

---

## Mock 데이터

`USE_MOCK_API=true` 시 `lib/mock-itinerary.ts`의 데이터를 사용.

### Mock 데이터 재생성

실제 Claude API + Nominatim을 호출해 최신 데이터로 갱신:

```bash
ANTHROPIC_API_KEY=sk-ant-... node scripts/gen-mock.mjs
```

`scripts/gen-mock.mjs` 상단의 `INPUT` 객체에서 여행 조건(출발지·목적지·기간·인원 등) 수정 가능.

현재 mock 데이터: **안양 → 경주 3박4일** (어른 2명, 아이 1명) — 27개 활동, 2026-04-14 생성

---

## 주요 의존성

| 패키지 | 용도 |
|--------|------|
| `@anthropic-ai/sdk` | Claude API 일정 생성 |
| `react-naver-maps` | Naver Maps 지도 렌더링 |
| `next` 15 | App Router, API Routes |

---

## API 명세

### `POST /api/generate`

```ts
// Request
TripInput {
  origin: string           // 출발지 (예: "안양시 만안구")
  destination: string      // 목적지 (예: "경주")
  startDate: string        // "YYYY-MM-DD"
  endDate: string
  styles: TravelStyle[]    // '맛집' | '관광' | '자연' | '쇼핑'
  budget: number           // 총 예산 (원)
  adults: number
  children: number
  savedDestinations: string[]
}

// Response
{
  days: Day[]              // geocoded coords 포함
  originCoords: { lat, lng } | null
}
```

### `POST /api/geocode`

```ts
// Request: { location: string }
// Response: { lat: number, lng: number } | null
```
