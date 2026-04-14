import type { Day } from '@/types'

/**
 * 실제 Claude API + Nominatim geocoding으로 생성된 mock 일정 데이터
 * 안양시 만안구 → 경주 3박 4일 (어른 2명, 아이 1명)
 *
 * 생성일: 2026-04-14
 * 개발/테스트 시 USE_MOCK_API=true 환경변수로 활성화
 */
export const MOCK_DAYS: Day[] = [
  {
    "date": 'REPLACE_DATE_0',
    "activities": [
      {
        "id": "day1_act1",
        "time": "07:00",
        "title": "안양 출발 (자차)",
        "description": "안양시 만안구 출발 → 경부고속도로(1번) 이용 → 경주 IC 도착. 예상 거리 약 370km, 소요 시간 약 3시간 30분~4시간. 연료비: 370÷12×1680≈51,800원 + 고속도로 통행료 약 18,000원",
        "estimatedCost": 69800,
        "location": "안양시 만안구",
        "coords": {
          "lat": 37.3863,
          "lng": 126.9324
        }
      },
      {
        "id": "day1_act2",
        "time": "11:00",
        "title": "경주 황리단길",
        "description": "경주 도착 후 황리단길에서 점심 식사 및 분위기 탐방. 한옥 감성의 카페와 맛집이 즐비한 핫플레이스. 점심 식비 어른 2명(12,000원)×2 + 아이 1명(7,200원) = 31,200원",
        "estimatedCost": 31200,
        "location": "경주 황리단길",
        "coords": {
          "lat": 35.8393246,
          "lng": 129.2097584
        }
      },
      {
        "id": "day1_act3",
        "time": "13:00",
        "title": "경주 대릉원",
        "description": "신라 왕족의 고분군. 천마총 내부 관람 가능. 넓은 잔디밭에서 아이와 함께 산책하기 좋음. 입장료: 어른 3,000원×2 + 아이 1,500원×1 = 7,500원",
        "estimatedCost": 7500,
        "location": "경주 대릉원",
        "coords": {
          "lat": 35.8389484,
          "lng": 129.2119324
        }
      },
      {
        "id": "day1_act4",
        "time": "14:30",
        "title": "경주 첨성대",
        "description": "신라시대 천문대로 유네스코 세계문화유산. 대릉원에서 도보 5분 거리로 동선 효율적. 입장료 무료",
        "estimatedCost": 0,
        "location": "경주 첨성대",
        "coords": {
          "lat": 35.834704,
          "lng": 129.2189849
        }
      },
      {
        "id": "day1_act5",
        "time": "15:30",
        "title": "경주 동궁과 월지",
        "description": "신라 별궁 터와 연못. 야간 조명이 아름다우나 오후 방문도 좋음. 입장료: 어른 3,000원×2 + 아이 1,500원×1 = 7,500원",
        "estimatedCost": 7500,
        "location": "경주 동궁과 월지",
        "coords": {
          "lat": 35.8347003,
          "lng": 129.2264375
        }
      },
      {
        "id": "day1_act6",
        "time": "17:00",
        "title": "경주 교촌마을 저녁 식사",
        "description": "경주 교촌마을 인근 한식 식당에서 경주 한우 불고기 또는 비빔밥으로 저녁 식사. 저녁 식비 어른 2명(15,000원)×2 + 아이 1명(9,000원)×1 = 39,000원",
        "estimatedCost": 39000,
        "location": "경주 교촌마을"
      },
      {
        "id": "day1_act7",
        "time": "19:00",
        "title": "경주 황남동 숙소 체크인",
        "description": "황남동 또는 보문단지 인근 펜션/모텔 체크인. 기준 2인 요금 약 80,000원 + 추가 1인 25,000원 = 105,000원",
        "estimatedCost": 105000,
        "location": "경주시 황남동",
        "coords": {
          "lat": 35.8344229,
          "lng": 129.2140413
        }
      }
    ]
  },
  {
    "date": 'REPLACE_DATE_1',
    "activities": [
      {
        "id": "day2_act1",
        "time": "08:00",
        "title": "경주 교리김밥 아침 식사",
        "description": "경주 대표 아침 맛집 교리김밥에서 아침 식사. 어른 2명(6,000원)×2 + 아이 1명(3,600원) = 15,600원",
        "estimatedCost": 15600,
        "location": "경주 교리김밥"
      },
      {
        "id": "day2_act2",
        "time": "09:00",
        "title": "불국사",
        "description": "유네스코 세계문화유산, 신라 불교 예술의 정수. 다보탑·석가탑·청운교 관람. 아이와 함께 역사 탐방. 입장료: 어른 6,000원×2 + 아이 3,000원×1 = 15,000원",
        "estimatedCost": 15000,
        "location": "불국사",
        "coords": {
          "lat": 35.7889948,
          "lng": 129.3308902
        }
      },
      {
        "id": "day2_act3",
        "time": "11:00",
        "title": "석굴암",
        "description": "불국사에서 셔틀버스로 10분 거리. 통일신라시대 석굴 사원, 국보. 입장료: 어른 6,000원×2 + 아이 3,000원×1 = 15,000원. 셔틀버스: 어른 3,000원×2 + 아이 1,500원×1 = 7,500원",
        "estimatedCost": 22500,
        "location": "석굴암",
        "coords": {
          "lat": 35.7947879,
          "lng": 129.3492496
        }
      },
      {
        "id": "day2_act4",
        "time": "13:00",
        "title": "경주 보문단지 점심",
        "description": "보문호 주변 식당에서 점심. 쌈밥 또는 돌솥밥 정식. 어른 2명(13,000원)×2 + 아이 1명(7,800원) = 33,800원",
        "estimatedCost": 33800,
        "location": "경주 보문단지",
        "coords": {
          "lat": 35.8341634,
          "lng": 129.2838094
        }
      },
      {
        "id": "day2_act5",
        "time": "14:30",
        "title": "국립경주박물관",
        "description": "신라 유물 4만여 점 보유, 성덕대왕신종(에밀레종) 관람. 아이 교육 여행에 최적. 입장료 무료",
        "estimatedCost": 0,
        "location": "국립경주박물관",
        "coords": {
          "lat": 35.8289946,
          "lng": 129.2279662
        }
      },
      {
        "id": "day2_act6",
        "time": "16:30",
        "title": "경주 최부자댁",
        "description": "300년 역사의 경주 최씨 고택 관람. 교촌마을 내 위치, 국립경주박물관에서 차로 10분. 입장료 무료",
        "estimatedCost": 0,
        "location": "경주 최부자댁"
      },
      {
        "id": "day2_act7",
        "time": "18:00",
        "title": "경주 성동시장 저녁 식사",
        "description": "경주 재래시장에서 경주빵·찰보리빵·순대국밥 등 로컬 먹거리 저녁. 어른 2명(10,000원)×2 + 아이 1명(6,000원) = 26,000원",
        "estimatedCost": 26000,
        "location": "경주 성동시장",
        "coords": {
          "lat": 35.8454625,
          "lng": 129.2163155
        }
      },
      {
        "id": "day2_act8",
        "time": "20:00",
        "title": "경주 황남동 숙소 2박째",
        "description": "전날과 동일 숙소 연박. 숙박비 동일 적용. 기준 2인 80,000원 + 추가 1인 25,000원 = 105,000원",
        "estimatedCost": 105000,
        "location": "경주시 황남동",
        "coords": {
          "lat": 35.8344229,
          "lng": 129.2140413
        }
      }
    ]
  },
  {
    "date": 'REPLACE_DATE_2',
    "activities": [
      {
        "id": "day3_act1",
        "time": "08:30",
        "title": "경주 황리단길 카페 아침",
        "description": "황리단길 한옥 카페에서 브런치 아침. 어른 2명(8,000원)×2 + 아이 1명(4,800원) = 20,800원",
        "estimatedCost": 20800,
        "location": "경주 황리단길",
        "coords": {
          "lat": 35.8393246,
          "lng": 129.2097584
        }
      },
      {
        "id": "day3_act2",
        "time": "10:00",
        "title": "경주 남산 (삼릉 코스)",
        "description": "경주 남산 삼릉 코스 트레킹. 곳곳에 마애불·석탑·고분 산재. 아이와 함께 완만한 코스 선택 (약 2시간 소요). 입장료 무료",
        "estimatedCost": 0,
        "location": "경주 남산 삼릉"
      },
      {
        "id": "day3_act3",
        "time": "12:30",
        "title": "경주 포석정 점심 후 관람",
        "description": "포석정 관람 후 인근 식당에서 점심. 입장료: 어른 1,000원×2 + 아이 500원×1 = 2,500원. 점심 식비: 어른 2명(12,000원)×2 + 아이 1명(7,200원) = 31,200원",
        "estimatedCost": 33700,
        "location": "경주 포석정",
        "coords": {
          "lat": 35.8074218,
          "lng": 129.2098639
        }
      },
      {
        "id": "day3_act4",
        "time": "14:30",
        "title": "양동마을",
        "description": "유네스코 세계문화유산 한국 최대 규모 씨족 마을. 경주 시내에서 차로 약 25분. 조선시대 기와집·초가집 보존. 입장료: 어른 4,000원×2 + 아이 2,000원×1 = 10,000원",
        "estimatedCost": 10000,
        "location": "양동마을",
        "coords": {
          "lat": 35.4668684,
          "lng": 129.2921563
        }
      },
      {
        "id": "day3_act5",
        "time": "16:30",
        "title": "감포항 드라이브",
        "description": "양동마을에서 동해안 감포항까지 드라이브 약 40km. 동해 바다 경치 감상. 이동 연료비: 40÷12×1680≈5,600원",
        "estimatedCost": 5600,
        "location": "경주 감포항",
        "coords": {
          "lat": 35.8042394,
          "lng": 129.5026317
        }
      },
      {
        "id": "day3_act6",
        "time": "17:30",
        "title": "감포항 회센터 저녁 식사",
        "description": "신선한 동해 활어회 저녁 식사. 어른 2명(25,000원)×2 + 아이 1명(15,000원) = 65,000원",
        "estimatedCost": 65000,
        "location": "경주 감포항",
        "coords": {
          "lat": 35.8042394,
          "lng": 129.5026317
        }
      },
      {
        "id": "day3_act7",
        "time": "19:30",
        "title": "경주 보문단지 숙소 3박째",
        "description": "보문단지 콘도 또는 펜션으로 숙소 변경 (마지막 날 출발 편의). 기준 2인 90,000원 + 추가 1인 25,000원 = 115,000원",
        "estimatedCost": 115000,
        "location": "경주 보문단지",
        "coords": {
          "lat": 35.8341634,
          "lng": 129.2838094
        }
      }
    ]
  },
  {
    "date": 'REPLACE_DATE_3',
    "activities": [
      {
        "id": "day4_act1",
        "time": "08:00",
        "title": "경주 현지 식당 아침 식사",
        "description": "숙소 인근 해장국 또는 한식 아침 식사. 어른 2명(8,000원)×2 + 아이 1명(4,800원) = 20,800원",
        "estimatedCost": 20800,
        "location": "경주 보문단지",
        "coords": {
          "lat": 35.8341634,
          "lng": 129.2838094
        }
      },
      {
        "id": "day4_act2",
        "time": "09:00",
        "title": "경주 IC 인근 기림사",
        "description": "함월산 기슭 천년 고찰. 보문단지에서 차로 20분. 조용하고 아름다운 사찰. 입장료: 어른 3,000원×2 + 아이 1,500원×1 = 7,500원",
        "estimatedCost": 7500,
        "location": "기림사",
        "coords": {
          "lat": 35.8370179,
          "lng": 129.4029658
        }
      },
      {
        "id": "day4_act3",
        "time": "10:30",
        "title": "경주 황남빵 쇼핑",
        "description": "경주 대표 기념품 황남빵 구입. 귀가 전 가족·지인 선물용. 예산 약 20,000원",
        "estimatedCost": 20000,
        "location": "경주 황남빵 본점"
      },
      {
        "id": "day4_act4",
        "time": "11:30",
        "title": "경주 점심 식사 (귀가 전)",
        "description": "경주 IC 인근 식당에서 마지막 점심. 경주 쌈밥 정식. 어른 2명(13,000원)×2 + 아이 1명(7,800원) = 33,800원",
        "estimatedCost": 33800,
        "location": "경주 IC",
        "coords": {
          "lat": 35.8051633,
          "lng": 129.1869639
        }
      },
      {
        "id": "day4_act5",
        "time": "13:00",
        "title": "경주 → 안양 귀가 (자차)",
        "description": "경주 IC 출발 → 경부고속도로(1번) → 안양시 만안구 귀가. 예상 거리 약 370km, 소요 시간 약 3시간 30분~4시간. 연료비: 370÷12×1680≈51,800원 + 고속도로 통행료 약 18,000원",
        "estimatedCost": 69800,
        "location": "안양시 만안구",
        "coords": {
          "lat": 37.3863,
          "lng": 126.9324
        }
      }
    ]
  }
]

export const MOCK_ORIGIN_COORDS = { lat: 37.3863, lng: 126.9324 }

/**
 * 입력받은 날짜 기준으로 더미 일정의 날짜를 재설정하고 NDJSON 문자열 반환
 */
export function buildMockNDJSON(startDate: string): string {
  const start = new Date(startDate + 'T00:00:00')
  return MOCK_DAYS.map((day, i) => {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return JSON.stringify({ ...day, date: `${y}-${m}-${d}` })
  }).join('\n')
}
