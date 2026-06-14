'use client'

import { useEffect, useState } from 'react'
import { TopNav } from '@/components/layout/TopNav'
import { FocusAreaCard } from '@/components/focus-areas/FocusAreaCard'
import { FocusAreaForm } from '@/components/focus-areas/FocusAreaForm'
import { Button } from '@/components/ui/Button'
import { SkeletonList } from '@/components/ui/SkeletonLoader'
import { EmptyState, NoFocusAreasIllustration } from '@/components/ui/EmptyState'
import { focusAreasApi } from '@/lib/api/focus-areas'
import { useFocusAreaStore } from '@/store/useFocusAreaStore'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import type { FocusArea, FocusAreaWithStats } from '@/types'

export default function FocusAreasPage() {
  const { focusAreas, setFocusAreas, updateFocusArea, removeFocusArea } = useFocusAreaStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingFa, setEditingFa] = useState<FocusAreaWithStats | null>(null)
  const [statsMap, setStatsMap] = useState<Record<string, FocusAreaWithStats>>({})

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const areas = await focusAreasApi.list()
        setFocusAreas(areas)
        // Load stats for each
        const stats = await Promise.all(
          areas.map((fa) => focusAreasApi.get(fa.id).catch(() => ({ ...fa, total_days: 0, total_words: 0, last_entry_date: null })))
        )
        setStatsMap(Object.fromEntries(stats.map((s) => [s.id, s as FocusAreaWithStats])))
      } catch {
        toast.error('Failed to load focus areas')
      }
      setIsLoading(false)
    }
    load()
  }, [setFocusAreas])

  const handleSuccess = (fa: FocusArea) => {
    const updated = { ...fa, total_days: 0, total_words: 0, last_entry_date: null }
    setStatsMap((prev) => ({ ...prev, [fa.id]: updated as FocusAreaWithStats }))
    updateFocusArea(fa.id, fa)
    if (!focusAreas.find((a) => a.id === fa.id)) {
      setFocusAreas([...focusAreas, fa])
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this focus area? All entries will be lost.')) return
    try {
      await focusAreasApi.delete(id)
      removeFocusArea(id)
      toast.success('Focus area deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleArchive = async (id: string) => {
    try {
      await focusAreasApi.update(id, { is_archived: true })
      removeFocusArea(id)
      toast.success('Focus area archived')
    } catch {
      toast.error('Failed to archive')
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav title="Focus Areas" />
      <div className="flex-1 p-4 md:p-6 max-w-content mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {focusAreas.length} area{focusAreas.length !== 1 ? 's' : ''}
          </p>
          <Button onClick={() => { setEditingFa(null); setIsFormOpen(true) }} size="sm">
            <Plus size={14} /> New Area
          </Button>
        </div>

        {isLoading ? (
          <SkeletonList count={3} />
        ) : focusAreas.length === 0 ? (
          <EmptyState
            icon={<NoFocusAreasIllustration />}
            title="No focus areas yet"
            description="Create your first focus area to start tracking your progress."
            action={{ label: 'Create Focus Area', onClick: () => setIsFormOpen(true) }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {focusAreas.map((fa) => (
              <FocusAreaCard
                key={fa.id}
                focusArea={statsMap[fa.id] ?? { ...fa, total_days: 0, total_words: 0, last_entry_date: null }}
                onEdit={(faws) => { setEditingFa(faws); setIsFormOpen(true) }}
                onDelete={handleDelete}
                onArchive={handleArchive}
              />
            ))}
          </div>
        )}
      </div>

      <FocusAreaForm
        key={isFormOpen ? (editingFa?.id ?? 'new') : 'closed'}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={editingFa}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
