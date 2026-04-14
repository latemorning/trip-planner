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
        "id": "d1_a1",
        "time": "07:00",
        "title": "안양시 만안구 출발",
        "description": "안양시 만안구에서 경주 방면 출발. 안양→수원→천안→대전→김천→경주 방향 경부고속도로 이용. 예상 거리 약 370km, 소요 시간 약 3시간 30분~4시간 (휴게소 1회 포함).",
        "estimatedCost": 65800,
        "location": "안양시 만안구",
        "coords": {
          "lat": 37.3863,
          "lng": 126.9324
        }
      },
      {
        "id": "d1_a2",
        "time": "11:00",
        "title": "경주 도착 및 점심 - 경주 쌈밥거리",
        "description": "경주 황남동 쌈밥거리에서 경주 대표 한정식 스타일 쌈밥으로 첫 끼니. 어른 2명(13,000원×2) + 아이 1명(8,000원). 경주 도착 후 첫 식사.",
        "estimatedCost": 34000,
        "location": "경주 황남동 쌈밥거리"
      },
      {
        "id": "d1_a3",
        "time": "13:00",
        "title": "대릉원 (천마총)",
        "description": "신라 고분군 밀집 지역. 내부 천마총 관람 포함. 어른 3,000원×2=6,000원, 아이 2,000원×1=2,000원. 넓은 잔디 공원으로 아이와 산책하기 좋음.",
        "estimatedCost": 8000,
        "location": "경주 대릉원",
        "coords": {
          "lat": 35.8389484,
          "lng": 129.2119324
        }
      },
      {
        "id": "d1_a4",
        "time": "14:30",
        "title": "경주 첨성대",
        "description": "신라시대 천문대로 동아시아 현존 최고(最古) 천문대. 대릉원과 도보 5분 거리. 어른 2,000원×2=4,000원, 아이 1,000원×1=1,000원.",
        "estimatedCost": 5000,
        "location": "경주 첨성대",
        "coords": {
          "lat": 35.834704,
          "lng": 129.2189849
        }
      },
      {
        "id": "d1_a5",
        "time": "15:30",
        "title": "경주 동궁과 월지 (안압지)",
        "description": "통일신라 왕궁 별궁 터. 황룡사지와 가까워 동선 효율적. 어른 3,000원×2=6,000원, 아이 2,000원×1=2,000원. 야경이 유명하니 저녁에도 잠시 재방문 가능.",
        "estimatedCost": 8000,
        "location": "경주 동궁과 월지",
        "coords": {
          "lat": 35.8347003,
          "lng": 129.2264375
        }
      },
      {
        "id": "d1_a6",
        "time": "17:00",
        "title": "경주 황리단길 카페·산책",
        "description": "경주 황남동 황리단길에서 자유롭게 골목 구경 및 디저트 카페 이용. 경주빵·찰보리빵 등 간식 포함 예상 비용. 3인 기준 음료·디저트.",
        "estimatedCost": 18000,
        "location": "경주 황리단길",
        "coords": {
          "lat": 35.8393246,
          "lng": 129.2097584
        }
      },
      {
        "id": "d1_a7",
        "time": "18:30",
        "title": "저녁 식사 - 경주 한우국밥",
        "description": "경주 성동시장 인근 국밥집에서 저녁. 어른 10,000원×2=20,000원, 아이 6,000원×1=6,000원.",
        "estimatedCost": 26000,
        "location": "경주 성동시장",
        "coords": {
          "lat": 35.8454625,
          "lng": 129.2163155
        }
      },
      {
        "id": "d1_a8",
        "time": "20:00",
        "title": "숙소 체크인 - 경주 보문관광단지",
        "description": "보문관광단지 내 숙소 체크인. 2인 기준 객실 + 아이 추가 비용 포함. 예산 감안 중급 호텔 또는 펜션 기준 1박.",
        "estimatedCost": 90000,
        "location": "경주 보문관광단지",
        "coords": {
          "lat": 35.8436334,
          "lng": 129.287022
        }
      }
    ]
  },
  {
    "date": 'REPLACE_DATE_1',
    "activities": [
      {
        "id": "d2_a1",
        "time": "08:00",
        "title": "조식 - 숙소 주변 해장국",
        "description": "보문단지 인근 식당에서 간단한 아침 식사. 어른 8,000원×2=16,000원, 아이 5,000원×1=5,000원.",
        "estimatedCost": 21000,
        "location": "경주 보문관광단지",
        "coords": {
          "lat": 35.8436334,
          "lng": 129.287022
        }
      },
      {
        "id": "d2_a2",
        "time": "09:00",
        "title": "불국사",
        "description": "유네스코 세계문화유산. 석가탑·다보탑·청운교 등 핵심 관람. 어른 6,000원×2=12,000원, 아이 3,000원×1=3,000원. 주차비 약 2,000원.",
        "estimatedCost": 17000,
        "location": "불국사",
        "coords": {
          "lat": 35.7889948,
          "lng": 129.3308902
        }
      },
      {
        "id": "d2_a3",
        "time": "11:00",
        "title": "석굴암",
        "description": "불국사에서 자차 약 10분. 통일신라 석조 불상의 걸작. 어른 6,000원×2=12,000원, 아이 3,000원×1=3,000원.",
        "estimatedCost": 15000,
        "location": "석굴암",
        "coords": {
          "lat": 35.7947879,
          "lng": 129.3492496
        }
      },
      {
        "id": "d2_a4",
        "time": "12:30",
        "title": "점심 - 경주 한방백숙 또는 산채비빔밥",
        "description": "석굴암·불국사 인근 식당가에서 점심. 어른 13,000원×2=26,000원, 아이 8,000원×1=8,000원.",
        "estimatedCost": 34000,
        "location": "경주 불국사 관광단지"
      },
      {
        "id": "d2_a5",
        "time": "14:00",
        "title": "국립경주박물관",
        "description": "신라 유물 4만 점 이상 소장. 성덕대왕신종(에밀레종) 관람. 무료 입장. 아이와 함께 역사 체험에 적합. 주차비 약 2,000원.",
        "estimatedCost": 2000,
        "location": "국립경주박물관",
        "coords": {
          "lat": 35.8289946,
          "lng": 129.2279662
        }
      },
      {
        "id": "d2_a6",
        "time": "16:00",
        "title": "경주 교촌마을 (교동 최씨 고택)",
        "description": "경주 최씨 가문 전통 고택 관람. 경주 월성과 인접해 동선 효율적. 어른 3,000원×2=6,000원, 아이 2,000원×1=2,000원.",
        "estimatedCost": 8000,
        "location": "경주 교촌마을"
      },
      {
        "id": "d2_a7",
        "time": "17:30",
        "title": "경주 월성 (반월성)",
        "description": "신라 왕궁터. 해자 복원 구간 산책. 경주 교촌마을에서 도보 5분. 무료 입장.",
        "estimatedCost": 0,
        "location": "경주 월성",
        "coords": {
          "lat": 35.8318394,
          "lng": 129.2227299
        }
      },
      {
        "id": "d2_a8",
        "time": "19:00",
        "title": "저녁 식사 - 경주 물회",
        "description": "동해안과 가까운 경주 특성상 물회·회덮밥 전문점 이용. 어른 14,000원×2=28,000원, 아이 8,000원×1=8,000원.",
        "estimatedCost": 36000,
        "location": "경주 성건동",
        "coords": {
          "lat": 35.8577814,
          "lng": 129.2057156
        }
      },
      {
        "id": "d2_a9",
        "time": "20:30",
        "title": "숙소 복귀 및 휴식",
        "description": "보문관광단지 숙소 복귀. 2박 연박 기준. 2인 객실 + 아이 추가 비용.",
        "estimatedCost": 90000,
        "location": "경주 보문관광단지",
        "coords": {
          "lat": 35.8436334,
          "lng": 129.287022
        }
      }
    ]
  },
  {
    "date": 'REPLACE_DATE_2',
    "activities": [
      {
        "id": "d3_a1",
        "time": "08:30",
        "title": "조식 - 경주빵 및 카페",
        "description": "보문단지 인근 베이커리 또는 카페에서 간단한 아침. 경주 명물 경주빵 포함. 3인 기준.",
        "estimatedCost": 18000,
        "location": "경주 보문관광단지",
        "coords": {
          "lat": 35.8436334,
          "lng": 129.287022
        }
      },
      {
        "id": "d3_a2",
        "time": "09:30",
        "title": "경주 보문호수 산책",
        "description": "보문관광단지 내 보문호 둘레길 산책. 아이와 함께 자연 체험. 무료.",
        "estimatedCost": 0,
        "location": "경주 보문호수"
      },
      {
        "id": "d3_a3",
        "time": "10:30",
        "title": "양동마을",
        "description": "유네스코 세계문화유산 한국 민속마을. 보문단지에서 자차 약 25분. 어른 4,000원×2=8,000원, 아이 2,000원×1=2,000원.",
        "estimatedCost": 10000,
        "location": "경주 양동마을",
        "coords": {
          "lat": 35.9957664,
          "lng": 129.2540725
        }
      },
      {
        "id": "d3_a4",
        "time": "12:30",
        "title": "점심 - 포항 구룡포 과메기·해산물",
        "description": "양동마을에서 포항 구룡포까지 자차 약 35분. 동해안 해산물 점심. 어른 15,000원×2=30,000원, 아이 9,000원×1=9,000원.",
        "estimatedCost": 39000,
        "location": "포항 구룡포",
        "coords": {
          "lat": 35.9724726,
          "lng": 129.5479546
        }
      },
      {
        "id": "d3_a5",
        "time": "14:00",
        "title": "포항 호미곶",
        "description": "한반도 최동단. 상생의 손 조형물. 해맞이광장. 무료 입장. 구룡포에서 자차 약 20분. 아이와 해변 체험.",
        "estimatedCost": 0,
        "location": "포항 호미곶",
        "coords": {
          "lat": 36.021045,
          "lng": 129.374258
        }
      },
      {
        "id": "d3_a6",
        "time": "15:30",
        "title": "포항 → 경주 이동",
        "description": "호미곶에서 경주 숙소로 복귀. 자차 약 50분, 거리 약 55km. 연료비 = 55÷12×1680 ≈ 7,700원.",
        "estimatedCost": 7700,
        "location": "경주 보문관광단지",
        "coords": {
          "lat": 35.8436334,
          "lng": 129.287022
        }
      },
      {
        "id": "d3_a7",
        "time": "16:30",
        "title": "경주 신라밀레니엄파크 또는 경주월드",
        "description": "아이를 위한 테마파크 체험. 경주월드 기준 어른 32,000원×2=64,000원, 아이 27,000원×1=27,000원 (온라인 할인 적용 추정).",
        "estimatedCost": 91000,
        "location": "경주월드",
        "coords": {
          "lat": 35.8367881,
          "lng": 129.2817197
        }
      },
      {
        "id": "d3_a8",
        "time": "19:00",
        "title": "저녁 식사 - 경주 갈비·불고기",
        "description": "경주 시내 갈비 전문점에서 마지막 저녁. 어른 18,000원×2=36,000원, 아이 10,000원×1=10,000원.",
        "estimatedCost": 46000,
        "location": "경주 노서동",
        "coords": {
          "lat": 35.8397837,
          "lng": 129.2024452
        }
      },
      {
        "id": "d3_a9",
        "time": "21:00",
        "title": "숙소 체크인 (마지막 밤)",
        "description": "3박째 숙소. 귀가 전날이므로 보문단지 동일 숙소 또는 시내 숙소. 2인 객실 + 아이 추가.",
        "estimatedCost": 90000,
        "location": "경주 보문관광단지",
        "coords": {
          "lat": 35.8436334,
          "lng": 129.287022
        }
      }
    ]
  },
  {
    "date": 'REPLACE_DATE_3',
    "activities": [
      {
        "id": "d4_a1",
        "time": "08:00",
        "title": "조식 - 경주 시내 해장국",
        "description": "귀가 전 아침 식사. 경주 시내 유명 해장국 또는 설렁탕. 어른 9,000원×2=18,000원, 아이 5,000원×1=5,000원.",
        "estimatedCost": 23000,
        "location": "경주 중앙시장",
        "coords": {
          "lat": 35.8446555,
          "lng": 129.2059765
        }
      },
      {
        "id": "d4_a2",
        "time": "09:00",
        "title": "경주 기념품 쇼핑",
        "description": "중앙시장 또는 황남동 기념품샵에서 경주빵·찰보리빵·한과 등 특산품 구입. 예상 쇼핑 비용.",
        "estimatedCost": 25000,
        "location": "경주 중앙시장",
        "coords": {
          "lat": 35.8446555,
          "lng": 129.2059765
        }
      },
      {
        "id": "d4_a3",
        "time": "10:00",
        "title": "경주 출발 → 안양시 만안구 귀가",
        "description": "경주에서 안양시 만안구로 귀가. 경주IC → 경부고속도로 → 안양 방면. 거리 약 370km, 소요 시간 약 3시간 30분~4시간. 연료비 = 370÷12×1680 ≈ 51,800원 + 고속도로 통행료 약 14,000원.",
        "estimatedCost": 65800,
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
