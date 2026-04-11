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
