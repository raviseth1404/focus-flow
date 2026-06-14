'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { focusAreasApi } from '@/lib/api/focus-areas'
import toast from 'react-hot-toast'
import type { FocusArea } from '@/types'
import { Plus, X, Pencil, Check } from 'lucide-react'

const PRESET_COLORS = [
  '#F4A636', '#0FADA0', '#3B82F6', '#22C55E',
  '#EF4444', '#8B5CF6', '#EC4899', '#F59E0B',
]

const PRESET_ICONS = [
  '🎯', '📚', '💪', '🏃', '💻', '🎨', '🌱', '💰',
  '🧘', '✍️', '🎵', '🔬', '🌍', '❤️', '🚀', '⚡',
]

interface FocusAreaFormProps {
  isOpen: boolean
  onClose: () => void
  initialData?: FocusArea | null
  onSuccess: (fa: FocusArea) => void
}

export function FocusAreaForm({ isOpen, onClose, initialData, onSuccess }: FocusAreaFormProps) {
  const [name, setName] = useState(initialData?.name || '')
  const [icon, setIcon] = useState(initialData?.icon || '🎯')
  const [color, setColor] = useState(initialData?.color || '#F4A636')
  const [description, setDescription] = useState(initialData?.description || '')
  const [targetDays, setTargetDays] = useState(initialData?.target_days_per_week || 5)
  const [todoItems, setTodoItems] = useState<string[]>(initialData?.todo_items || [])
  const [newTodo, setNewTodo] = useState('')
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const addTodo = () => {
    const t = newTodo.trim()
    if (!t || todoItems.includes(t)) return
    setTodoItems([...todoItems, t])
    setNewTodo('')
  }

  const removeTodo = (idx: number) => {
    setTodoItems(todoItems.filter((_, i) => i !== idx))
    if (editingIdx === idx) setEditingIdx(null)
  }

  const startEdit = (idx: number) => {
    setEditingIdx(idx)
    setEditingValue(todoItems[idx])
  }

  const commitEdit = () => {
    if (editingIdx === null) return
    const t = editingValue.trim()
    if (t) {
      const updated = [...todoItems]
      updated[editingIdx] = t
      setTodoItems(updated)
    }
    setEditingIdx(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    // Commit any in-progress todo edit
    if (editingIdx !== null) commitEdit()
    setIsLoading(true)
    try {
      let fa: FocusArea
      if (initialData) {
        fa = await focusAreasApi.update(initialData.id, { name, icon, color, description, target_days_per_week: targetDays, todo_items: todoItems })
        toast.success('Focus area updated')
      } else {
        fa = await focusAreasApi.create({ name, icon, color, description, target_days_per_week: targetDays, todo_items: todoItems })
        toast.success('Focus area created!')
      }
      onSuccess(fa)
      onClose()
    } catch {
      toast.error('Failed to save focus area')
    }
    setIsLoading(false)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Focus Area' : 'New Focus Area'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label="Name"
            placeholder="e.g. Deep Work, Health & Fitness"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          {/* Icon picker */}
          <div>
            <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 block">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all
                    ${icon === ic
                      ? 'bg-[var(--color-accent-muted)] ring-2 ring-[var(--color-accent)]'
                      : 'bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-subtle)]'
                    }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 block">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all
                    ${color === c ? 'ring-2 ring-offset-2 ring-offset-[var(--color-bg-elevated)] ring-white scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">
              Target days/week: <span className="text-[var(--color-accent)]">{targetDays}</span>
            </label>
            <input
              type="range"
              min="1"
              max="7"
              value={targetDays}
              onChange={(e) => setTargetDays(Number(e.target.value))}
              className="w-full accent-[var(--color-accent)]"
            />
            <div className="flex justify-between text-xs text-[var(--color-text-disabled)] mt-1">
              <span>1 day</span>
              <span>7 days</span>
            </div>
          </div>

          <Input
            label="Description (optional)"
            placeholder="What is this focus area about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Daily To-Do List */}
          <div>
            <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">
              Daily To-Do List <span className="text-[var(--color-text-disabled)] font-normal">(shown as checkboxes each day)</span>
            {todoItems.length > 0 && (
              <span className="ml-2 text-xs font-normal text-[var(--color-accent)]">{todoItems.length} added</span>
            )}
            </label>
            <div className="space-y-2 mb-2 max-h-48 overflow-y-auto pr-1">
              {todoItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
                  {editingIdx === idx ? (
                    <>
                      <input
                        autoFocus
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
                          if (e.key === 'Escape') setEditingIdx(null)
                        }}
                        className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] focus:outline-none"
                      />
                      <button type="button" onClick={commitEdit} className="text-[var(--color-accent)] hover:text-green-400 transition-colors">
                        <Check size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-[var(--color-text-primary)]">{item}</span>
                      <button type="button" onClick={() => startEdit(idx)} className="text-[var(--color-text-disabled)] hover:text-[var(--color-text-primary)] transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button type="button" onClick={() => removeTodo(idx)} className="text-[var(--color-text-disabled)] hover:text-red-400 transition-colors">
                        <X size={14} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Gym, Use stairs, Read 10 pages"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTodo())}
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] focus:outline-none focus:border-[var(--color-accent)]"
              />
              <button
                type="button"
                onClick={addTodo}
                className="px-3 py-2 rounded-lg bg-[var(--color-accent-muted)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={isLoading}>
              {initialData ? 'Save changes' : 'Create'}
            </Button>
          </div>
        </form>
    </Modal>
  )
}
