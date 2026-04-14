# 여행 플래너

Claude AI가 자차 기준 여행 일정을 자동 생성하고, 지도 위에 직선 경로로 시각화하는 Next.js 앱.

## 기능

- **일정 자동 생성**: Claude Sonnet + Advisor Tool로 출발지/목적지/기간/예산/인원 기반 일정 생성
- **실시간 연료비 계산**: 오피넷 API로 당일 휘발유 가격 조회해 자차 이동 비용 산정
- **지도 시각화**: Naver Maps(react-naver-maps)에 활동 마커 + 직선 경로 폴리라인
- **인라인 편집**: 일정 항목 제목·시간·장소·비용 직접 수정
- **Geocoding**: Nominatim(OpenStreetMap) 서버사이드 일괄 geocoding + 인메모리 캐시
- **개발 mock 모드**: `USE_MOCK_API=true` 시 Claude API 없이 미리 생성된 mock 데이터 즉시 반환

---

## 환경 설정

`.env.local` 파일:

```env
# 필수
ANTHROPIC_API_KEY=sk-ant-...
NCP_CLIENT_ID=...                   # Naver Cloud Platform Maps 클라이언트 ID
NCP_CLIENT_SECRET=...               # Naver Cloud Platform Maps 시크릿
NEXT_PUBLIC_NCP_KEY_ID=...          # 브라우저용 NCP 키 (NCP_CLIENT_ID와 동일값)

# 선택
OPINET_API_KEY=...                  # 오피넷 실시간 유가 (없으면 1,680원/L 기본값)
USE_MOCK_API=true                   # true 설정 시 Claude API 미호출, mock 데이터 사용
```

### NCP 콘솔 설정

Naver Maps를 localhost에서 사용하려면 [NCP 콘솔](https://console.ncloud.com) → Application Services → Maps → Web Dynamic Map → 서비스 URL에 아래 도메인 등록 필요:
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
    generate/route.ts       # Claude API 호출 + 오피넷 유가 + geocoding 일괄 처리
    geocode/route.ts        # 단건 Nominatim geocoding (클라이언트 요청용)
    directions/route.ts     # Naver Directions 15 API (구현됨, 현재 미사용)

components/
  TripForm.tsx              # 여행 조건 입력 폼
  ItineraryView.tsx         # 날짜 탭 + 지도 레이아웃
  DayCard.tsx               # 하루 일정 카드 (인라인 편집)
  RouteMap.tsx              # Naver Maps 지도 + 마커 + 직선 경로 폴리라인

lib/
  geocode.ts                # 클라이언트 geocoding 헬퍼 (API 라우트 경유)
  geocode-server.ts         # 서버 Nominatim 호출 + 인메모리 캐시
  geocode-cache.ts          # geocoding 인메모리 캐시
  mock-itinerary.ts         # 개발용 mock 데이터 (coords 포함, 4일 27개 활동)
  storage.ts                # localStorage 기반 일정/즐겨찾기 저장

scripts/
  gen-mock.mjs              # mock 데이터 재생성 스크립트

types/index.ts              # TripInput, Day, Activity, Itinerary 타입
```

### 일정 생성 플로우

1. `TripForm` → `/api/generate` POST
2. 서버: 오피넷 유가 조회 → Claude API(Sonnet + Advisor) → NDJSON 파싱
3. 서버: 모든 `location` 필드를 Nominatim으로 일괄 geocoding (캐시 활용)
4. 응답: `{ days: Day[], originCoords }` (coords 포함)
5. 클라이언트: `localStorage`에 저장 → `/itinerary` 리다이렉트

### 지도 렌더링 동작

- **마커**: 좌표가 있는 모든 활동에 번호 마커 표시, 클릭 시 해당 항목 하이라이트
- **폴리라인**: `destWaypoints` (출발지 30km 이내 활동 제외) 기준 직선 연결
- **지도 초기 위치**: `mapKey = JSON.stringify(activityWaypoints)`로 geocoding 완료 후 NaverMap remount → 목적지 중심 뷰
- **하이라이트**: 활동 선택 시 해당 구간 강조, 나머지 흐리게 처리
- **MapErrorBoundary**: NCP 도메인 미등록 등 초기화 실패 시 graceful fallback

---

## Mock 데이터

`USE_MOCK_API=true` 시 `lib/mock-itinerary.ts`의 데이터를 즉시 반환 (Nominatim geocoding 스킵).

**현재 mock 데이터:** 안양 → 경주 3박4일, 어른 2명 + 아이 1명, 4일 27개 활동 (2026-04-14 생성)

### Mock 데이터 재생성

실제 Claude API + Nominatim을 호출해 최신 데이터로 갱신:

```bash
ANTHROPIC_API_KEY=sk-ant-... node scripts/gen-mock.mjs
```

`scripts/gen-mock.mjs` 상단의 `INPUT` 객체에서 여행 조건 수정 가능.

---

## 주요 의존성

| 패키지 | 용도 |
|--------|------|
| `@anthropic-ai/sdk` | Claude API 일정 생성 (Advisor Tool 포함) |
| `react-naver-maps` | Naver Maps 지도 렌더링 |
| `next` 15 | App Router, API Routes |

---

## API 명세

### `POST /api/generate`

```ts
// Request (TripInput)
{
  origin: string           // 출발지 (예: "안양시 만안구")
  destination: string      // 목적지 (예: "경주")
  startDate: string        // "YYYY-MM-DD"
  endDate: string          // "YYYY-MM-DD"
  styles: ('맛집'|'관광'|'자연'|'쇼핑')[]
  budget: number           // 총 예산 (원)
  adults: number
  children: number
  savedDestinations: string[]
}

// Response
{
  days: Day[]              // geocoded coords 포함
  originCoords: { lat: number; lng: number } | null
}
```

### `POST /api/geocode`

```ts
// Request: { location: string }
// Response: { lat: number, lng: number } | null
```

---

## 주요 설계 결정

| 결정 | 이유 |
|------|------|
| Naver Maps (react-naver-maps) | Kakao Maps SDK 도메인 등록 제약으로 전환 |
| Nominatim geocoding | 서버사이드 무료 사용, REST key 불필요 |
| 직선 경로 | 도로 경로(Naver Directions) 대비 단순하고 빠름, 사용자 요청 |
| generate 시 일괄 geocoding | 클라이언트 geocoding 대비 rate limit 제어 용이, 캐시 효율 높음 |
| mock 모드 즉시 반환 | coords 포함 mock 데이터로 geocoding 시간(~23초) 제거 |
