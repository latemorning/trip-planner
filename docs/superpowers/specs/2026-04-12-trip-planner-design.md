# Trip Planner — Design Spec

**Date:** 2026-04-12  
**Status:** Approved

---

## Overview

개인용 AI 여행 일정 생성 웹 앱. 사용자가 목적지, 기간, 여행 스타일, 예산을 입력하면 Claude가 자동으로 일정을 생성하고, 사용자가 인라인으로 편집할 수 있다.

---

## Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **AI:** Claude Sonnet 4.6 (executor) + Claude Opus 4.6 (advisor, beta)
- **Map:** Kakao Maps JavaScript SDK
- **Storage:** localStorage (DB 없음)
- **Deployment:** Vercel

---

## Architecture

```
trip-planner/
├── app/
│   ├── page.tsx                  # 입력 폼
│   ├── itinerary/page.tsx        # 일정 뷰 + 인라인 편집
│   └── api/generate/route.ts     # Claude API 스트리밍 엔드포인트
├── components/
│   ├── TripForm.tsx              # 목적지, 기간, 스타일, 예산 입력
│   ├── ItineraryView.tsx         # 날짜별 카드 목록
│   ├── DayCard.tsx               # 하루치 일정 카드 (편집 가능)
│   └── RouteMap.tsx              # Kakao Maps 지도 + 동선 표시
└── lib/
    ├── claude.ts                 # Claude API 클라이언트 + Advisor 설정
    ├── storage.ts                # localStorage 저장/불러오기
    └── geocode.ts                # 장소명 → 좌표 변환 (Kakao 로컬 API)
```

---

## Data Model

```ts
type TripInput = {
  destination: string         // 목적지 (예: "도쿄 5박 6일")
  startDate: string           // ISO date string
  endDate: string             // ISO date string
  styles: TravelStyle[]       // 선택된 스타일 태그
  budget: number              // 총 예산 (KRW)
}

type TravelStyle = '맛집' | '관광' | '자연' | '쇼핑'

type Itinerary = {
  destination: string
  startDate: string
  endDate: string
  totalBudget: number
  days: Day[]
}

type Day = {
  date: string                // ISO date string
  activities: Activity[]
}

type Activity = {
  id: string
  time: string                // 예: "09:00"
  title: string
  description: string
  estimatedCost: number       // KRW
  location?: string           // 장소명 (예: "경복궁")
  coords?: { lat: number; lng: number }  // Kakao 로컬 API로 변환된 좌표
}
```

---

## AI Integration — Advisor Pattern

`/api/generate/route.ts`에서 Claude Sonnet 4.6을 executor로, Opus 4.6을 advisor로 사용.

- **Beta header:** `anthropic-beta: advisor-tool-2026-03-01`
- **Advisor tool type:** `advisor_20260301`
- Sonnet이 일정 생성 중 복잡한 결정(예산 배분, 이동 경로 최적화, 선호도 충돌 해결)이 필요할 때 Opus에 자동으로 조언을 요청
- 전체 교환은 단일 API 호출 내에서 처리됨
- 응답은 스트리밍으로 클라이언트에 전달

**프롬프트 구조:**
- 시스템: 여행 일정 생성 전문가 역할, JSON 형식으로 Day 배열 반환
- 사용자: 목적지, 기간, 스타일, 예산 포함

---

## UI Flow

### 1. 홈 화면 (`/`)

- 입력 필드: 목적지(텍스트), 여행 기간(날짜 범위 선택), 여행 스타일(멀티 태그 선택), 총 예산(숫자 입력)
- "일정 생성" 버튼 → 로딩 스피너로 전환 후 `/itinerary`로 이동

### 2. 일정 화면 (`/itinerary`)

- **레이아웃:** 좌측 일정 카드 목록 / 우측 Kakao Maps 지도 (2단 분할)
- **생성 중:** 날짜별 DayCard가 스트리밍으로 순서대로 나타남
- **생성 완료:** 전체 일정 표시 + 지도에 핀 및 동선 렌더링
- **상단 요약:** 총 예산 대비 예상 지출 합계
- **DayCard 편집:** 카드 클릭 시 인라인 편집 모드 전환 (활동 제목/설명/시간/비용 수정, 활동 추가/삭제)
- **저장:** 편집 내용은 localStorage에 자동 저장
- **"처음부터 다시" 버튼:** 홈으로 복귀

### 지도 상호작용

- 날짜 탭 클릭 → 해당 날의 활동 핀만 표시, 동선 폴리라인 갱신
- 활동 핀 클릭 → 해당 DayCard 활동 항목 하이라이트
- DayCard 활동 호버 → 지도의 대응 핀 강조

---

## Error Handling

| 상황 | 처리 |
|------|------|
| API 호출 실패 | 토스트 메시지 + 재시도 버튼 |
| 스트리밍 중단 | 부분 일정 유지 + 재생성 옵션 표시 |
| localStorage 없음 | 무시 (편집 내용 미저장 안내) |
| 장소 좌표 변환 실패 | 해당 활동 핀 생략, 나머지 정상 표시 |
| Kakao Maps SDK 로드 실패 | 지도 영역에 에러 메시지 표시, 일정 카드는 정상 동작 |

---

## Out of Scope

- 사용자 인증/로그인
- 서버 사이드 일정 저장 (DB)
- 여러 여행 계획 관리
- 이동 수단별 경로 안내 (도보/대중교통/차)
- 공유 기능
