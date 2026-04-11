'use client'

import { useState } from 'react'
import type { Day, Activity } from '@/types'

type EditState = {
  activityId: string
  title: string
  description: string
  time: string
  estimatedCost: string
}

type Props = {
  day: Day
  onChange: (day: Day) => void
  highlightedActivityId: string | null
}

export default function DayCard({ day, onChange, highlightedActivityId }: Props) {
  const [editState, setEditState] = useState<EditState | null>(null)

  const dateLabel = new Date(day.date + 'T00:00:00').toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
  const totalCost = day.activities.reduce((sum, a) => sum + a.estimatedCost, 0)

  function startEdit(activity: Activity) {
    setEditState({
      activityId: activity.id,
      title: activity.title,
      description: activity.description,
      time: activity.time,
      estimatedCost: String(activity.estimatedCost),
    })
  }

  function saveEdit() {
    if (!editState) return
    onChange({
      ...day,
      activities: day.activities.map((a) =>
        a.id === editState.activityId
          ? {
              ...a,
              title: editState.title,
              description: editState.description,
              time: editState.time,
              estimatedCost: parseInt(editState.estimatedCost, 10) || 0,
            }
          : a
      ),
    })
    setEditState(null)
  }

  function deleteActivity(id: string) {
    onChange({ ...day, activities: day.activities.filter((a) => a.id !== id) })
  }

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-800">{dateLabel}</h3>
        <span className="text-sm text-gray-500">
          총 ₩{totalCost.toLocaleString()}
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {day.activities.map((activity) =>
          editState?.activityId === activity.id ? (
            <li key={activity.id} className="rounded-lg border p-3 bg-blue-50">
              <div className="flex flex-col gap-2">
                <input
                  value={editState.title}
                  onChange={(e) =>
                    setEditState({ ...editState, title: e.target.value })
                  }
                  className="border rounded px-2 py-1 text-sm w-full"
                />
                <input
                  value={editState.description}
                  onChange={(e) =>
                    setEditState({ ...editState, description: e.target.value })
                  }
                  className="border rounded px-2 py-1 text-sm w-full"
                />
                <div className="flex gap-2">
                  <input
                    value={editState.time}
                    onChange={(e) =>
                      setEditState({ ...editState, time: e.target.value })
                    }
                    className="border rounded px-2 py-1 text-sm w-24"
                    placeholder="HH:MM"
                  />
                  <input
                    type="number"
                    value={editState.estimatedCost}
                    onChange={(e) =>
                      setEditState({ ...editState, estimatedCost: e.target.value })
                    }
                    className="border rounded px-2 py-1 text-sm flex-1"
                    placeholder="비용 (원)"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setEditState(null)}
                    className="px-3 py-1 bg-gray-200 rounded text-sm"
                  >
                    취소
                  </button>
                </div>
              </div>
            </li>
          ) : (
            <li
              key={activity.id}
              onClick={() => startEdit(activity)}
              className={`rounded-lg border p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                highlightedActivityId === activity.id ? 'ring-2 ring-blue-400' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-gray-400 mr-2">{activity.time}</span>
                  <span className="font-medium text-sm">{activity.title}</span>
                  {activity.description && (
                    <p className="text-xs text-gray-500 mt-0.5 ml-8 truncate">
                      {activity.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  <span className="text-xs text-gray-500">
                    ₩{activity.estimatedCost.toLocaleString()}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteActivity(activity.id)
                    }}
                    aria-label="삭제"
                    className="text-gray-300 hover:text-red-400 text-base leading-none"
                  >
                    ×
                  </button>
                </div>
              </div>
            </li>
          )
        )}
      </ul>
    </div>
  )
}
