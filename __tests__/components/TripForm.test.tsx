import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TripForm from '@/components/TripForm'

describe('TripForm', () => {
  it('renders all input fields', () => {
    render(<TripForm onSubmit={jest.fn()} loading={false} />)
    expect(screen.getByPlaceholderText('예: 제주도, 부산')).toBeInTheDocument()
    expect(screen.getByLabelText('출발일')).toBeInTheDocument()
    expect(screen.getByLabelText('도착일')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('예산 (원)')).toBeInTheDocument()
    expect(screen.getByText('맛집')).toBeInTheDocument()
    expect(screen.getByText('관광')).toBeInTheDocument()
    expect(screen.getByText('자연')).toBeInTheDocument()
    expect(screen.getByText('쇼핑')).toBeInTheDocument()
  })

  it('calls onSubmit with correct values', async () => {
    const user = userEvent.setup()
    const onSubmit = jest.fn()
    render(<TripForm onSubmit={onSubmit} loading={false} />)

    await user.type(screen.getByPlaceholderText('예: 제주도, 부산'), '제주도')
    await user.type(screen.getByLabelText('출발일'), '2026-05-01')
    await user.type(screen.getByLabelText('도착일'), '2026-05-03')
    await user.click(screen.getByText('맛집'))
    await user.type(screen.getByPlaceholderText('예산 (원)'), '500000')
    await user.click(screen.getByRole('button', { name: '일정 생성' }))

    expect(onSubmit).toHaveBeenCalledWith({
      destination: '제주도',
      startDate: '2026-05-01',
      endDate: '2026-05-03',
      styles: ['맛집'],
      budget: 500000,
    })
  })

  it('toggles style on repeated click', async () => {
    const user = userEvent.setup()
    const onSubmit = jest.fn()
    render(<TripForm onSubmit={onSubmit} loading={false} />)

    await user.click(screen.getByText('관광'))
    await user.click(screen.getByText('관광')) // deselect
    await user.type(screen.getByPlaceholderText('예: 제주도, 부산'), '서울')
    await user.type(screen.getByLabelText('출발일'), '2026-06-01')
    await user.type(screen.getByLabelText('도착일'), '2026-06-02')
    await user.type(screen.getByPlaceholderText('예산 (원)'), '300000')
    await user.click(screen.getByRole('button', { name: '일정 생성' }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ styles: [] })
    )
  })

  it('disables button and shows loading text when loading', () => {
    render(<TripForm onSubmit={jest.fn()} loading={true} />)
    const btn = screen.getByRole('button', { name: '생성 중...' })
    expect(btn).toBeDisabled()
  })
})
