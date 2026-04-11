import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DayCard from '@/components/DayCard'
import type { Day } from '@/types'

const mockDay: Day = {
  date: '2026-05-01',
  activities: [
    {
      id: 'a1',
      time: '09:00',
      title: '경복궁 관람',
      description: '조선 시대 왕궁',
      estimatedCost: 3000,
      location: '경복궁',
    },
  ],
}

describe('DayCard', () => {
  it('renders date, activities, and total cost', () => {
    render(<DayCard day={mockDay} onChange={jest.fn()} highlightedActivityId={null} />)
    expect(screen.getByText('경복궁 관람')).toBeInTheDocument()
    expect(screen.getByText('09:00')).toBeInTheDocument()
    expect(screen.getAllByText(/3,000|3000/)).toHaveLength(2)
  })

  it('enters edit mode when activity is clicked', async () => {
    const user = userEvent.setup()
    render(<DayCard day={mockDay} onChange={jest.fn()} highlightedActivityId={null} />)
    await user.click(screen.getByText('경복궁 관람'))
    expect(screen.getByDisplayValue('경복궁 관람')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument()
  })

  it('calls onChange with updated activity on save', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    render(<DayCard day={mockDay} onChange={onChange} highlightedActivityId={null} />)

    await user.click(screen.getByText('경복궁 관람'))
    const titleInput = screen.getByDisplayValue('경복궁 관람')
    await user.clear(titleInput)
    await user.type(titleInput, '덕수궁 관람')
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        activities: [expect.objectContaining({ id: 'a1', title: '덕수궁 관람' })],
      })
    )
  })

  it('cancels edit without calling onChange', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    render(<DayCard day={mockDay} onChange={onChange} highlightedActivityId={null} />)

    await user.click(screen.getByText('경복궁 관람'))
    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText('경복궁 관람')).toBeInTheDocument()
  })

  it('calls onChange without deleted activity', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    render(<DayCard day={mockDay} onChange={onChange} highlightedActivityId={null} />)

    await user.click(screen.getByRole('button', { name: '삭제' }))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ activities: [] })
    )
  })

  it('applies ring highlight when highlightedActivityId matches', () => {
    render(<DayCard day={mockDay} onChange={jest.fn()} highlightedActivityId="a1" />)
    const item = screen.getByText('경복궁 관람').closest('li')
    expect(item).toHaveClass('ring-2')
  })
})
