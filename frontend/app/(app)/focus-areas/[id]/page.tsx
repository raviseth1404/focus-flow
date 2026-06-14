'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { TopNav } from '@/components/layout/TopNav'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SkeletonList } from '@/components/ui/SkeletonLoader'
import { EmptyState, NoEntriesIllustration } from '@/components/ui/EmptyState'
import { focusAreasApi } from '@/lib/api/focus-areas'
import { entriesApi } from '@/lib/api/entries'
import { FocusAreaForm } from '@/components/focus-areas/FocusAreaForm'
import { format, parseISO } from 'date-fns'
import { ChevronLeft, Plus, Save, Pencil, FileText, Pin, PinOff, Sparkles, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { aiApi } from '@/lib/api/ai'
import type { FocusAreaSummaryResponse } from '@/lib/api/ai'
import type { FocusArea, FocusAreaWithStats, DailyEntry } from '@/types'

const LIMIT = 20

// ── Note modal (create or edit) ──────────────────────────────────────
function NoteModal({
  isOpen, onClose, focusAreaId, existingEntry, allEntries, onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  focusAreaId: string
  existingEntry?: DailyEntry | null   // if set → edit mode
  allEntries: DailyEntry[]            // all loaded entries, to detect existing note for a date
  onSuccess: (entry: DailyEntry) => void
}) {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const isEditMode = !!existingEntry

  // In "new" mode, check if there's already a note for the initial date
  const initialDate = existingEntry?.entry_date ?? todayStr
  const initialMatchingEntry = !isEditMode
    ? allEntries.find(e => e.entry_date === initialDate && e.notes) ?? null
    : null

  const [date, setDate] = useState(initialDate)
  // Pre-load existing note content (edit mode: existingEntry.notes; new mode: match for initial date)
  const [notes, setNotes] = useState<Record<string, unknown> | null>(
    existingEntry?.notes ?? initialMatchingEntry?.notes ?? null
  )
  const [isSaving, setIsSaving] = useState(false)

  // Entry for the currently-selected date (only used in "new" mode)
  const entryForDate = !isEditMode ? allEntries.find(e => e.entry_date === date && e.notes) ?? null : null
  const isResuming = !isEditMode && !!entryForDate

  // When date changes (new mode only), auto-load existing note for that date
  const handleDateChange = (newDate: string) => {
    setDate(newDate)
    if (!isEditMode) {
      const match = allEntries.find(e => e.entry_date === newDate && e.notes)
      setNotes(match?.notes ?? null)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const entry = await entriesApi.upsert({ focus_area_id: focusAreaId, entry_date: date, notes })
      toast.success('Note saved!')
      onSuccess(entry)
      onClose()
    } catch {
      toast.error('Failed to save note')
    }
    setIsSaving(false)
  }

  const modalTitle = isEditMode ? 'Edit Note' : isResuming ? 'Edit Existing Note' : 'New Note'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="lg">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            disabled={isEditMode}
            className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-60 disabled:cursor-not-allowed"
          />
          {isResuming && (
            <p className="text-xs text-[var(--color-accent)] mt-1">
              ✏️ Existing note loaded — your previous content is shown below. Add more at the bottom or edit anywhere.
            </p>
          )}
          {isEditMode && (
            <p className="text-xs text-[var(--color-text-disabled)] mt-1">Date cannot be changed when editing a note.</p>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Note</p>
          <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
            <RichTextEditor
              key={isEditMode ? (existingEntry?.id ?? 'edit') : date}
              content={notes}
              onChange={setNotes}
              placeholder="Write your note…"
            />
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSave} isLoading={isSaving}>
            <Save size={14} /> Save Note
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Main page ────────────────────────────────────────────────────────
export default function FocusAreaDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [focusArea, setFocusArea] = useState<FocusAreaWithStats | null>(null)
  const [entries, setEntries] = useState<DailyEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<DailyEntry | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [togglingPinId, setTogglingPinId] = useState<string | null>(null)
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null)
  const [aiSummary, setAiSummary] = useState<FocusAreaSummaryResponse | null>(null)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [showAiSummary, setShowAiSummary] = useState(false)

  const load = useCallback(async (pageNum: number) => {
    setIsLoading(true)
    try {
      const [fa, paginated] = await Promise.all([
        focusAreasApi.get(id),
        entriesApi.listByFocusArea(id, LIMIT, pageNum * LIMIT),
      ])
      setFocusArea(fa)
      setTotal(paginated.total)
      if (pageNum === 0) setEntries(paginated.items)
      else setEntries((prev) => [...prev, ...paginated.items])
    } catch {
      toast.error('Failed to load notes')
    }
    setIsLoading(false)
  }, [id])

  useEffect(() => { load(0) }, [load])

  const openNewNote = () => {
    setEditingEntry(null)
    setIsNoteModalOpen(true)
  }

  const openEditNote = (entry: DailyEntry) => {
    setEditingEntry(entry)
    setIsNoteModalOpen(true)
  }

  const handleNoteSuccess = (updatedEntry: DailyEntry) => {
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.id === updatedEntry.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = updatedEntry
        return next
      }
      return [updatedEntry, ...prev]
    })
    // Refresh focus area stats
    focusAreasApi.get(id).then(setFocusArea).catch(() => {})
  }

  const deleteNote = async (entry: DailyEntry) => {
    if (!confirm('Delete this note? This cannot be undone.')) return
    setDeletingNoteId(entry.id)
    try {
      await entriesApi.deleteNotes(entry.id)
      setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, notes: null, notes_plain_text: null } : e))
      toast.success('Note deleted')
      focusAreasApi.get(id).then(setFocusArea).catch(() => {})
    } catch {
      toast.error('Failed to delete note')
    }
    setDeletingNoteId(null)
  }

  const handleAiSummarize = async () => {
    setIsAiLoading(true)
    setShowAiSummary(true)
    try {
      const result = await aiApi.summarizeFocusArea(id)
      setAiSummary(result)
    } catch {
      toast.error('Failed to generate AI summary. Try again.')
      setShowAiSummary(false)
    }
    setIsAiLoading(false)
  }

  const togglePin = async (entry: DailyEntry) => {
    setTogglingPinId(entry.id)
    try {
      const updated = await entriesApi.togglePin(entry.id, !entry.is_pinned)
      setEntries((prev) => prev.map((e) => e.id === updated.id ? updated : e))
      toast.success(updated.is_pinned ? 'Note pinned' : 'Note unpinned')
    } catch {
      toast.error('Failed to update pin')
    }
    setTogglingPinId(null)
  }

  // Only show entries that have notes
  const noteEntries = entries.filter(e => e.notes)

  // Pinned first, then sorted by date desc
  const sortedEntries = [
    ...noteEntries.filter(e => e.is_pinned).sort((a, b) => b.entry_date.localeCompare(a.entry_date)),
    ...noteEntries.filter(e => !e.is_pinned).sort((a, b) => b.entry_date.localeCompare(a.entry_date)),
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav />
      <div className="flex-1 p-4 md:p-6 max-w-content mx-auto w-full">

        {/* Back */}
        <Link
          href="/focus-areas"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-5 transition-colors"
        >
          <ChevronLeft size={14} /> Focus Areas
        </Link>

        {/* Header */}
        {focusArea && (
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{focusArea.icon}</span>
                <h1 className="font-heading text-3xl font-semibold text-[var(--color-text-primary)]">
                  {focusArea.name}
                </h1>
              </div>
              <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
                <span>{focusArea.total_days ?? 0} days logged</span>
                <span>{(focusArea.total_words ?? 0).toLocaleString()} words total</span>
                {focusArea.todo_items?.length > 0 && (
                  <span className="text-[var(--color-accent)]">
                    {focusArea.todo_items.length} daily to-dos
                  </span>
                )}
                {focusArea.description && (
                  <span className="text-[var(--color-text-disabled)]">{focusArea.description}</span>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="secondary" onClick={() => setIsEditOpen(true)} size="sm">
                <Pencil size={14} /> Edit
              </Button>
              <Button
                variant="secondary"
                onClick={handleAiSummarize}
                size="sm"
                isLoading={isAiLoading}
                disabled={sortedEntries.length === 0}
                title={sortedEntries.length === 0 ? 'Add some notes first' : 'Summarize all notes with AI'}
              >
                <Sparkles size={14} /> AI Summary
              </Button>
              <Button onClick={openNewNote} size="sm">
                <Plus size={14} /> New Note
              </Button>
            </div>
          </div>
        )}

        {/* AI Summary Panel */}
        {showAiSummary && (
          <div className="mb-8 card p-6 border border-[var(--color-accent-muted)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[var(--color-accent)]" />
                <h3 className="font-heading font-semibold text-[var(--color-text-primary)]">AI Summary</h3>
                {aiSummary && (
                  <span className="text-xs text-[var(--color-text-disabled)]">
                    {aiSummary.total_notes} notes · {aiSummary.date_range}
                  </span>
                )}
              </div>
              <button
                onClick={() => { setShowAiSummary(false); setAiSummary(null) }}
                className="text-xs text-[var(--color-text-disabled)] hover:text-[var(--color-text-secondary)] transition-colors"
              >
                Dismiss
              </button>
            </div>
            {isAiLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-[var(--color-bg-elevated)] rounded animate-pulse w-full" />
                <div className="h-4 bg-[var(--color-bg-elevated)] rounded animate-pulse w-5/6" />
                <div className="h-4 bg-[var(--color-bg-elevated)] rounded animate-pulse w-4/6" />
                <div className="h-4 bg-[var(--color-bg-elevated)] rounded animate-pulse w-5/6" />
                <div className="h-4 bg-[var(--color-bg-elevated)] rounded animate-pulse w-3/4" />
              </div>
            ) : aiSummary ? (
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
                {aiSummary.summary}
              </p>
            ) : null}
          </div>
        )}

        {/* Notes list */}
        {isLoading && page === 0 ? (
          <SkeletonList count={4} />
        ) : sortedEntries.length === 0 ? (
          <EmptyState
            icon={<NoEntriesIllustration />}
            title="No notes yet"
            description="Click 'New Note' to start writing notes for this focus area. Your daily log notes from the calendar will also appear here."
            action={{ label: 'New Note', onClick: openNewNote }}
          />
        ) : (
          <div className="space-y-0">
            {/* Pinned section label */}
            {sortedEntries.some(e => e.is_pinned) && (
              <div className="flex items-center gap-2 mb-3">
                <Pin size={12} className="text-[var(--color-accent)]" />
                <span className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wide">Pinned</span>
              </div>
            )}

            {sortedEntries.map((entry, idx) => {
              const isPinnedSection = entry.is_pinned
              const prevWasPinned = idx > 0 && sortedEntries[idx - 1].is_pinned
              const showUnpinnedLabel = !isPinnedSection && prevWasPinned

              return (
                <div key={entry.id}>
                  {showUnpinnedLabel && (
                    <div className="flex items-center gap-2 mt-4 mb-3">
                      <span className="text-xs font-semibold text-[var(--color-text-disabled)] uppercase tracking-wide">All notes</span>
                    </div>
                  )}
                  <div className="flex gap-5">
                    {/* Date column */}
                    <div className="flex flex-col items-center w-28 flex-shrink-0">
                      <div className="text-center">
                        <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wide">
                          {format(parseISO(entry.entry_date), 'MMM')}
                        </p>
                        <p className="text-2xl font-bold text-[var(--color-text-primary)] leading-none">
                          {format(parseISO(entry.entry_date), 'd')}
                        </p>
                        <p className="text-xs text-[var(--color-text-disabled)]">
                          {format(parseISO(entry.entry_date), 'yyyy')}
                        </p>
                      </div>
                      {/* Timeline line */}
                      {idx < sortedEntries.length - 1 && (
                        <div className="flex-1 w-px bg-[var(--color-border)] mt-3 min-h-[2rem]" />
                      )}
                    </div>

                    {/* Note content */}
                    <div className="flex-1 pb-6">
                      <div className={`card p-5 ${entry.is_pinned ? 'border border-[var(--color-accent-muted)] ring-1 ring-[var(--color-accent-muted)]' : ''}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <FileText size={13} className="text-[var(--color-accent)]" />
                          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                            {format(parseISO(entry.entry_date), 'EEEE, MMMM d')}
                          </span>
                          {entry.word_count > 0 && (
                            <span className="text-xs text-[var(--color-text-disabled)]">
                              {entry.word_count} words
                            </span>
                          )}
                          {/* Actions */}
                          <div className="ml-auto flex items-center gap-1">
                            <button
                              onClick={() => togglePin(entry)}
                              disabled={togglingPinId === entry.id}
                              title={entry.is_pinned ? 'Unpin note' : 'Pin note'}
                              className={`p-1.5 rounded-md transition-colors ${
                                entry.is_pinned
                                  ? 'text-[var(--color-accent)] bg-[var(--color-accent-muted)] hover:bg-[var(--color-bg-subtle)]'
                                  : 'text-[var(--color-text-disabled)] hover:text-[var(--color-accent)] hover:bg-[var(--color-bg-subtle)]'
                              }`}
                            >
                              {entry.is_pinned ? <PinOff size={13} /> : <Pin size={13} />}
                            </button>
                            <button
                              onClick={() => openEditNote(entry)}
                              title="Edit note"
                              className="p-1.5 rounded-md text-[var(--color-text-disabled)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)] transition-colors"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => deleteNote(entry)}
                              disabled={deletingNoteId === entry.id}
                              title="Delete note"
                              className="p-1.5 rounded-md text-[var(--color-text-disabled)] hover:text-red-400 hover:bg-[var(--color-bg-subtle)] transition-colors disabled:opacity-40"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        <RichTextEditor content={entry.notes} readOnly />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {entries.length < total && (
              <div className="text-center pt-4 pl-33">
                <Button
                  variant="secondary"
                  onClick={() => { const next = page + 1; setPage(next); load(next) }}
                  isLoading={isLoading}
                >
                  Load more ({total - noteEntries.length} remaining)
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {focusArea && (
        <>
          <NoteModal
            key={isNoteModalOpen ? (editingEntry?.id ?? 'new') : 'closed'}
            isOpen={isNoteModalOpen}
            onClose={() => { setIsNoteModalOpen(false); setEditingEntry(null) }}
            focusAreaId={id}
            existingEntry={editingEntry}
            allEntries={entries}
            onSuccess={handleNoteSuccess}
          />
          <FocusAreaForm
            key={isEditOpen ? 'edit-open' : 'edit-closed'}
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            initialData={focusArea}
            onSuccess={(updated: FocusArea) => {
              setFocusArea((prev) => prev ? { ...prev, ...updated } : prev)
            }}
          />
        </>
      )}
    </div>
  )
}
