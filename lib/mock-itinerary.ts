import type { Day } from '@/types'

/**
 * 실제 Claude API 응답을 모방한 더미 일정 데이터
 * 안양 → 경주 3박 4일 (어른 2명, 아이 1명)
 *
 * 개발/테스트 시 USE_MOCK_API=true 환경변수로 활성화
 * 실제 Kakao 지도에서 geocoding 가능한 실제 장소명 사용
 */
export const MOCK_DAYS: Day[] = [
  {
    date: 'REPLACE_DATE_0',
    activities: [
      {
        id: 'mock-d1-a1',
        time: '08:00',
        title: '안양 출발 (자차)',
        description: '경부고속도로 → 통영대전고속도로 → 경주 IC, 약 3시간 30분 소요',
        estimatedCost: 47600,
        location: '안양시 만안구',
      },
      {
        id: 'mock-d1-a2',
        time: '11:30',
        title: '경주 도착 / 황리단길 점심',
        description: '황리단길 한정식 또는 비빔밥 (어른 2 × 15,000 + 아이 1 × 9,000)',
        estimatedCost: 39000,
        location: '경주 황리단길',
      },
      {
        id: 'mock-d1-a3',
        time: '13:30',
        title: '불국사',
        description: '유네스코 세계문화유산 (어른 6,000 × 2 + 아이 3,000 × 1)',
        estimatedCost: 15000,
        location: '불국사',
      },
      {
        id: 'mock-d1-a4',
        time: '16:00',
        title: '석굴암',
        description: '불국사에서 차량 10분 (어른 6,000 × 2 + 아이 3,000 × 1)',
        estimatedCost: 15000,
        location: '석굴암',
      },
      {
        id: 'mock-d1-a5',
        time: '18:00',
        title: '숙소 체크인 (경주 한옥스테이)',
        description: '경주 시내 한옥 숙소, 2인 기준 + 아이 추가 1인',
        estimatedCost: 130000,
        location: '경주시 황남동',
      },
    ],
  },
  {
    date: 'REPLACE_DATE_1',
    activities: [
      {
        id: 'mock-d2-a1',
        time: '09:00',
        title: '첨성대',
        description: '신라시대 천문대 (무료 관람)',
        estimatedCost: 0,
        location: '경주 첨성대',
      },
      {
        id: 'mock-d2-a2',
        time: '10:00',
        title: '동궁과 월지 (안압지)',
        description: '신라 별궁 연못 (어른 3,000 × 2 + 아이 1,500 × 1)',
        estimatedCost: 7500,
        location: '동궁과 월지',
      },
      {
        id: 'mock-d2-a3',
        time: '12:00',
        title: '교촌마을 점심',
        description: '경주 교촌닭갈비 또는 쌈밥 (어른 2 × 14,000 + 아이 1 × 8,400)',
        estimatedCost: 36400,
        location: '경주 교촌마을',
      },
      {
        id: 'mock-d2-a4',
        time: '14:00',
        title: '국립경주박물관',
        description: '신라 유물 상설 전시, 국보급 문화재 (무료)',
        estimatedCost: 0,
        location: '국립경주박물관',
      },
      {
        id: 'mock-d2-a5',
        time: '16:30',
        title: '대릉원 (천마총)',
        description: '신라 왕릉군 (어른 3,000 × 2 + 아이 2,000 × 1)',
        estimatedCost: 8000,
        location: '대릉원',
      },
      {
        id: 'mock-d2-a6',
        time: '19:00',
        title: '황리단길 저녁 & 야경',
        description: '저녁 식사 후 야간 황리단길 산책 (어른 2 × 18,000 + 아이 1 × 10,800)',
        estimatedCost: 46800,
        location: '경주 황리단길',
      },
    ],
  },
  {
    date: 'REPLACE_DATE_2',
    activities: [
      {
        id: 'mock-d3-a1',
        time: '09:30',
        title: '포석정',
        description: '신라 왕실 연회 터 (어른 3,000 × 2 + 아이 무료)',
        estimatedCost: 6000,
        location: '포석정',
      },
      {
        id: 'mock-d3-a2',
        time: '11:00',
        title: '남산 삼릉 탐방로',
        description: '경주 남산 도보 탐방, 석불·탑 다수 (무료)',
        estimatedCost: 0,
        location: '경주 남산 삼릉',
      },
      {
        id: 'mock-d3-a3',
        time: '13:00',
        title: '점심 (현지 식당)',
        description: '경주 최부잣집 인근 한정식 (어른 2 × 16,000 + 아이 1 × 9,600)',
        estimatedCost: 41600,
        location: '경주시 교동',
      },
      {
        id: 'mock-d3-a4',
        time: '15:00',
        title: '기림사',
        description: '토함산 자락 고찰 (어른 4,000 × 2 + 아이 2,000 × 1)',
        estimatedCost: 10000,
        location: '기림사',
      },
      {
        id: 'mock-d3-a5',
        time: '18:30',
        title: '숙소 2박째',
        description: '전날과 동일 숙소 연박',
        estimatedCost: 130000,
        location: '경주시 황남동',
      },
    ],
  },
  {
    date: 'REPLACE_DATE_3',
    activities: [
      {
        id: 'mock-d4-a1',
        time: '09:00',
        title: '아침 & 체크아웃',
        description: '숙소 조식 또는 근처 카페 (어른 2 × 8,000 + 아이 1 × 4,800)',
        estimatedCost: 20800,
        location: '경주시 황남동',
      },
      {
        id: 'mock-d4-a2',
        time: '10:30',
        title: '경주 기념품 쇼핑',
        description: '경주빵, 찰보리빵 등 특산품 구입',
        estimatedCost: 30000,
        location: '경주역',
      },
      {
        id: 'mock-d4-a3',
        time: '12:00',
        title: '경주 출발 (귀가)',
        description: '경주 IC → 통영대전고속도로 → 경부고속도로 → 안양, 약 3시간 30분',
        estimatedCost: 47600,
        location: '경주시',
      },
      {
        id: 'mock-d4-a4',
        time: '15:30',
        title: '안양 도착',
        description: '여행 종료',
        estimatedCost: 0,
        location: '안양시 만안구',
      },
    ],
  },
]

/**
 * 입력받은 날짜 기준으로 더미 일정의 날짜를 재설정하고 NDJSON 문자열 반환
 */
export function buildMockNDJSON(startDate: string): string {
  const start = new Date(startDate + 'T00:00:00')
  return MOCK_DAYS.slice(0, 2).map((day, i) => {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return JSON.stringify({ ...day, date: `${y}-${m}-${d}` })
  }).join('\n')
}
