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
    directions/route.ts     # Naver Directions 15 API (도로 경로 조회)

components/
  TripForm.tsx              # 여행 조건 입력 폼
  ItineraryView.tsx         # 날짜 탭 + 지도 레이아웃
  DayCard.tsx               # 하루 일정 카드 (인라인 편집)
  RouteMap.tsx              # Naver Maps 지도 + 마커 + 도로 경로 폴리라인

lib/
  geocode.ts                # 클라이언트 geocoding 헬퍼 (API 라우트 경유)
  geocode-server.ts         # 서버 Nominatim → Kakao fallback geocoding + 캐시
  geocode-cache.ts          # geocoding 인메모리 캐시
  mock-itinerary.ts         # 개발용 mock 데이터 (coords 포함, 4일 29개 활동)
  storage.ts                # localStorage 기반 일정/즐겨찾기 저장

scripts/
  gen-mock.mjs              # mock 데이터 재생성 스크립트

types/index.ts              # TripInput, Day, Activity, Itinerary 타입
```

### 일정 생성 플로우

1. `TripForm` → `/api/generate` POST
2. 클라이언트: 폼이 `LoadingView`로 교체되어 단계별 진행 상태 표시 (보통 30~60초)
3. 서버: 오피넷 유가 조회 → Claude API(Sonnet + Advisor) → NDJSON 파싱
4. 서버: 모든 `location` 필드를 일괄 geocoding (캐시 활용)
5. 응답: `{ days: Day[], originCoords }` (coords 포함)
6. 클라이언트: `localStorage`에 저장 → `/itinerary` 리다이렉트

### 로딩 화면 (`LoadingView`)

생성 요청 후 폼 카드가 로딩 카드로 교체되며, 실제 서버 처리 단계에 맞춰 메시지가 순차적으로 전환됩니다 (7초 간격).

| 단계 | 아이콘 | 메시지 |
|------|--------|--------|
| 1 | ⛽ | 유가 정보를 확인하고 있어요 |
| 2 | 🤖 | AI가 최적 일정을 만들고 있어요 |
| 3 | 🗺️ | 장소별 지도 위치를 찾고 있어요 |
| 4 | ✨ | 일정을 완성하고 있어요 |

- 파동 링 애니메이션으로 진행 중임을 시각적으로 표현
- 하단 점 인디케이터(pill)로 현재 단계 위치 표시
- 목적지명 포함 ("경주 여행 일정 생성 중...")
- "보통 30~60초 정도 걸려요" 안내 문구

### Geocoding 전략

```
location 문자열
  → 인메모리 캐시 확인 (히트 시 즉시 반환)
  → Nominatim (OpenStreetMap) — 무료, 1 req/sec 제한
  → null이면 Kakao 키워드 검색 (지역 제한) — 목적지 좌표 ±0.45°(~50km) 바운딩박스
  → null이면 Kakao 키워드 검색 (전국) — rect 없이 전국 범위
  → 그래도 null이면 coords = undefined (지도 마커 없이 목록에만 표시)
```

**Kakao 지역 제한 (`rect`):**
- `geocodeLocations(locations, regionHint)` 호출 시 목적지명(예: "강릉")을 먼저 geocoding
- 획득한 좌표를 기준으로 `rect=minLng,minLat,maxLng,maxLat` 파라미터 추가
- 같은 이름의 장소가 전국에 여럿 있을 때 엉뚱한 지역 매칭 방지
- 지역 제한 검색에서 null이면 전국 검색으로 폴백 (rect 밖에 있는 장소 대응)

**쿼리 단순화 변형 재시도 (`getQueryVariants`):**
전국 검색까지 null이면 쿼리를 단순화하여 재시도합니다.

| 변형 규칙 | 예시 |
|-----------|------|
| 앞부분 지역명 제거 | "강릉 초당순두부마을" → "초당순두부마을" |
| ~마을/~거리/~IC 접미사 제거 | "초당순두부마을" → "초당순두부" |
| prefix + suffix 동시 제거 | "강릉 초당순두부마을" → "초당순두부" |
| 긴 복합 명칭 단축 | "참소리축음기에디슨과학박물관" → "참소리박물관" |

**서버 로그:**
일정 생성 시 각 장소별 geocoding 결과가 콘솔에 출력됩니다:
```
[geocode] region "강릉" → (37.7519, 128.8761)
[geocode] ✓ Nominatim  "경포해수욕장"
[geocode] ✓ Kakao(지역) "강릉 중앙시장"
[geocode] ✓ Kakao(변형: "초당순두부") "강릉 초당순두부마을"
[geocode] ✓ Kakao(변형: "참소리박물관") "참소리축음기에디슨과학박물관"
[geocode] ✗ 실패       "안목해변 커피거리"
```

**Claude 프롬프트 location 규칙 (마커 null 방지):**
| 금지 | 대체 |
|------|------|
| IC·나들목 ("강릉 IC") | 행정구역명 ("강릉시") |
| ~마을 접미사 ("초당순두부마을") | 행정동명 ("강릉 초당동") |
| 구어체·비공식 명칭 | 공식 지명/상권명 |
| 특정 식당명 | 상권명 ("경주 황리단길") |

**coords가 없는 활동 UI 처리:**
- 번호 배지: 점선 테두리 + 흐린 색상으로 구분
- 활동 제목 옆 `지도 없음` 뱃지 표시
- hover 시 "지도 위치를 찾을 수 없습니다" 툴팁

**null 발생 원인 및 예방:**
| 원인 | 대응 |
|------|------|
| 구어체 장소명 (예: "황남동 쌈밥거리") | Claude 프롬프트에서 공식명 강제 |
| 신규/소규모 POI (Kakao 미등록) | 식당은 상권명으로 대체 (예: "경주 황리단길") |
| 동명이인 장소 | 지역명 + 장소명 조합 강제 |
| 간헐적 API 오류 | 인메모리 캐시로 재요청 방지 |

### 지도 렌더링 동작

- **마커**: 좌표가 있는 모든 활동에 번호 마커 표시, 클릭 시 해당 항목 하이라이트
- **경로**: `destWaypoints` (출발지 30km 이내 활동 제외 + coords null 활동 제외) 기준 도로 이동 경로
  - `RouteMap` 마운트 시 `/api/directions`(Naver Directions 15) 호출하여 실제 도로 경로 폴리라인 표시
  - API 실패 또는 경유지 2개 미만이면 직선 폴리라인으로 자동 폴백
- **null coords 활동 처리**: coords가 없는 활동은 경유지에서 제외하고 경로를 이어서 표시 (지도 마커도 표시 안 함)
- **지도 초기 위치**: `mapKey = JSON.stringify(activityWaypoints)`로 geocoding 완료 후 NaverMap remount → 목적지 중심 뷰
- **하이라이트**: 활동 선택 시 전체 도로 경로를 흐리게 + 선택 구간(직선)만 앰버색으로 강조
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
| 도로 경로 (Naver Directions 15) | 실제 이동 경로 시각화. null coords 활동은 경유지 제외 후 경로 이어서 표시 |
| generate 시 일괄 geocoding | 클라이언트 geocoding 대비 rate limit 제어 용이, 캐시 효율 높음 |
| mock 모드 즉시 반환 | coords 포함 mock 데이터로 geocoding 시간(~23초) 제거 |
