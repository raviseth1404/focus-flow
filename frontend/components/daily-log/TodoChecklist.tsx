'use client'

import { useState, useCallback } from 'react'
import { entriesApi } from '@/lib/api/entries'
import type { DailyEntry, FocusArea } from '@/types'
import { CheckSquare } from 'lucide-react'

interface TodoChecklistProps {
  entry: DailyEntry | null
  focusArea: FocusArea
  entryDate: string
  focusAreaId: string
  onEntryUpdate?: (entry: DailyEntry) => void
}

export function TodoChecklist({ entry, focusArea, entryDate, focusAreaId, onEntryUpdate }: TodoChecklistProps) {
  const todos = focusArea.todo_items || []
  const [completions, setCompletions] = useState<Record<string, boolean>>(
    entry?.todo_completions || {}
  )
  const [savingKey, setSavingKey] = useState<string | null>(null)

  const toggle = useCallback(async (item: string) => {
    const newCompletions = { ...completions, [item]: !completions[item] }
    setCompletions(newCompletions)
    setSavingKey(item)

    try {
      // Upsert entry if it doesn't exist yet
      let currentEntry = entry
      if (!currentEntry) {
        currentEntry = await entriesApi.upsert({
          focus_area_id: focusAreaId,
          entry_date: entryDate,
        })
      }
      const updated = await entriesApi.updateTodos(currentEntry.id, newCompletions)
      onEntryUpdate?.(updated)
    } catch {
      // Revert on error using functional update to avoid stale closure
      setCompletions(prev => ({ ...prev, [item]: !newCompletions[item] }))
    } finally {
      setSavingKey(null)
    }
  }, [completions, entry, entryDate, focusAreaId, onEntryUpdate])

  if (todos.length === 0) return null

  const doneCount = todos.filter(t => completions[t]).length

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        <CheckSquare size={14} className="text-[var(--color-accent)]" />
        <span className="text-xs font-semibold text-[var(--color-text-disabled)] uppercase tracking-wide">
          Daily To-Dos
        </span>
        <span className="text-xs text-[var(--color-text-disabled)] ml-auto">
          {doneCount}/{todos.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-[var(--color-bg-subtle)] rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-300"
          style={{ width: `${todos.length > 0 ? (doneCount / todos.length) * 100 : 0}%` }}
        />
      </div>

      <div className="space-y-2">
        {todos.map((item) => {
          const done = !!completions[item]
          const saving = savingKey === item
          return (
            <button
              key={item}
              onClick={() => toggle(item)}
              disabled={saving}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all hover:bg-[var(--color-bg-subtle)] group"
            >
              {/* Custom checkbox */}
              <div className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${
                done
                  ? 'bg-[var(--color-accent)] border-[var(--color-accent)]'
                  : 'border-[var(--color-border)] group-hover:border-[var(--color-accent)]'
              }`}>
                {done && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className={`text-sm transition-all ${
                done
                  ? 'line-through text-[var(--color-text-disabled)]'
                  : 'text-[var(--color-text-primary)]'
              }`}>
                {item}
              </span>
              {saving && (
                <div className="ml-auto w-3 h-3 rounded-full border border-[var(--color-accent)] border-t-transparent animate-spin" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
