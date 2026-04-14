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
  onHighlight: (id: string | null) => void
}

export default function DayCard({ day, onChange, highlightedActivityId, onHighlight }: Props) {
  const [editState, setEditState] = useState<EditState | null>(null)

  const dateLabel = new Date(day.date + 'T00:00:00').toLocaleDateString('ko-KR', {
    month: 'long', day: 'numeric', weekday: 'short',
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
    <div style={{
      borderRadius: 'var(--radius)', border: '1px solid var(--border)',
      background: 'var(--surface)', padding: '16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{dateLabel}</span>
        <span style={{
          fontSize: '12px', color: 'var(--accent)', background: 'var(--accent-dim)',
          padding: '3px 10px', borderRadius: '100px', fontWeight: 600,
        }}>₩{totalCost.toLocaleString()}</span>
      </div>

      <ul style={{ display: 'flex', flexDirection: 'column', gap: '6px', listStyle: 'none', padding: 0, margin: 0 }}>
        {day.activities.map((activity, idx) =>
          editState?.activityId === activity.id ? (
            /* 편집 모드 */
            <li key={activity.id} style={{
              borderRadius: '8px', border: '1px solid var(--accent-blue)',
              background: 'var(--blue-dim)', padding: '12px',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input value={editState.title}
                  onChange={(e) => setEditState({ ...editState, title: e.target.value })}
                  placeholder="장소명" style={{ width: '100%', padding: '7px 10px', fontSize: '13px' }} />
                <input value={editState.description}
                  onChange={(e) => setEditState({ ...editState, description: e.target.value })}
                  placeholder="설명" style={{ width: '100%', padding: '7px 10px', fontSize: '13px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input value={editState.time}
                    onChange={(e) => setEditState({ ...editState, time: e.target.value })}
                    placeholder="HH:MM" style={{ width: '80px', padding: '7px 10px', fontSize: '13px' }} />
                  <input type="number" value={editState.estimatedCost}
                    onChange={(e) => setEditState({ ...editState, estimatedCost: e.target.value })}
                    placeholder="비용" style={{ flex: 1, padding: '7px 10px', fontSize: '13px' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={saveEdit} style={{
                    padding: '6px 16px', borderRadius: '6px', border: 'none',
                    background: 'var(--accent-blue)', color: '#fff',
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  }}>저장</button>
                  <button onClick={() => setEditState(null)} style={{
                    padding: '6px 16px', borderRadius: '6px', border: '1px solid var(--border)',
                    background: 'transparent', color: 'var(--text-2)', fontSize: '12px', cursor: 'pointer',
                  }}>취소</button>
                </div>
              </div>
            </li>
          ) : (
            /* 보기 모드 */
            <li
              key={activity.id}
              onClick={() => onHighlight(highlightedActivityId === activity.id ? null : activity.id)}
              style={{
                borderRadius: '8px',
                border: `1px solid ${highlightedActivityId === activity.id ? 'var(--accent)' : 'var(--border-light)'}`,
                background: highlightedActivityId === activity.id ? 'var(--accent-dim)' : 'var(--surface-2)',
                padding: '10px 12px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  {/* 번호 배지 */}
                  <span style={{
                    flexShrink: 0,
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: highlightedActivityId === activity.id ? 'var(--accent)' : 'var(--surface)',
                    border: `1px solid ${highlightedActivityId === activity.id ? 'var(--accent)' : 'var(--border)'}`,
                    color: highlightedActivityId === activity.id ? '#000' : 'var(--text-2)',
                    fontSize: '11px', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{idx + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 600, color: 'var(--accent)',
                        background: 'var(--accent-dim)', padding: '1px 6px', borderRadius: '4px', flexShrink: 0,
                      }}>{activity.time}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {activity.title}
                      </span>
                    </div>
                    {activity.description && (
                      <p style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {activity.description}
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px', flexShrink: 0 }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-2)', fontWeight: 500 }}>
                    ₩{activity.estimatedCost.toLocaleString()}
                  </span>
                  {/* 편집 버튼 */}
                  <button
                    onClick={(e) => { e.stopPropagation(); startEdit(activity) }}
                    title="편집"
                    style={{
                      background: 'none', border: 'none', color: 'var(--text-muted)',
                      cursor: 'pointer', fontSize: '13px', padding: '0 2px', transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-blue)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >✎</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteActivity(activity.id) }}
                    aria-label="삭제"
                    style={{
                      background: 'none', border: 'none', color: 'var(--text-muted)',
                      cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '0 2px', transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >×</button>
                </div>
              </div>
            </li>
          )
        )}
      </ul>
    </div>
  )
}
