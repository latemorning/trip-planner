// types/index.ts
export type TravelStyle = '맛집' | '관광' | '자연' | '쇼핑' | '아이'

export type TripInput = {
  origin: string
  destination: string
  startDate: string
  endDate: string
  styles: TravelStyle[]
  budget: number
  adults: number
  children: number
  savedDestinations: string[]  // 즐겨찾기 목적지 (근처 포함 여부 판단용)
}

export type SavedDestination = {
  name: string
  savedAt: string  // ISO datetime
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
  origin: string
  originCoords?: { lat: number; lng: number }
  destination: string
  startDate: string
  endDate: string
  totalBudget: number
  days: Day[]
}
