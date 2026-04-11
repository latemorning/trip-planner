import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ItineraryView from '@/components/ItineraryView'
import type { Itinerary } from '@/types'

// next/dynamic을 mock하여 RouteMap(Kakao SDK 의존)을 동기적으로 교체
jest.mock('next/dynamic', () => () => {
  const MockRouteMap = () => <div data-testid="route-map" />
  MockRouteMap.displayName = 'MockRouteMap'
  return MockRouteMap
})

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
