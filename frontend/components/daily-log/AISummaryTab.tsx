'use client'

import { useState } from 'react'
import { aiApi } from '@/lib/api/ai'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Sparkles, RefreshCw, CheckCircle, Lightbulb, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'
import type { DailyEntry, AISummary } from '@/types'

interface AISummaryTabProps {
  entry: DailyEntry | null
  onEntryUpdate: (entry: DailyEntry) => void
}

export function AISummaryTab({ entry, onEntryUpdate }: AISummaryTabProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const summary = entry?.ai_summary as AISummary | null

  const handleGenerate = async () => {
    if (!entry) {
      toast.error('Save some activities or notes first')
      return
    }
    setIsGenerating(true)
    try {
      const updated = await aiApi.summarize(entry.id)
      onEntryUpdate(updated)
      toast.success('AI summary generated!')
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined
      toast.error(typeof msg === 'string' ? msg : 'Failed to generate summary')
    }
    setIsGenerating(false)
  }

  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--color-accent-muted)] flex items-center justify-center mb-4">
          <Sparkles size={24} className="text-[var(--color-accent)]" />
        </div>
        <h3 className="font-heading text-lg font-semibold text-[var(--color-text-primary)] mb-2">
          Generate AI Summary
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] max-w-xs mb-6">
          Claude will analyze your activities and notes and distill them into key insights.
        </p>
        <Button onClick={handleGenerate} isLoading={isGenerating}>
          <Sparkles size={14} />
          Generate Summary
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            {summary.one_liner}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleGenerate} isLoading={isGenerating}>
          <RefreshCw size={13} />
        </Button>
      </div>

      {entry?.ai_summary_generated_at && (
        <p className="text-xs text-[var(--color-text-disabled)]">
          Generated {format(parseISO(entry.ai_summary_generated_at), 'MMM d, h:mm a')}
          {entry.ai_summary_model && ` · ${entry.ai_summary_model}`}
        </p>
      )}

      {/* Accomplishments */}
      {summary.accomplishments?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={14} className="text-[var(--color-success)]" />
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
              Accomplishments
            </span>
          </div>
          <ul className="space-y-1.5 ml-5">
            {summary.accomplishments.map((item, i) => (
              <li key={i} className="text-sm text-[var(--color-text-primary)] list-disc">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Learnings */}
      {summary.learnings?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={14} className="text-[var(--color-warning)]" />
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
              Learnings
            </span>
          </div>
          <ul className="space-y-1.5 ml-5">
            {summary.learnings.map((item, i) => (
              <li key={i} className="text-sm text-[var(--color-text-primary)] list-disc">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Follow-ups */}
      {summary.follow_ups?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ArrowRight size={14} className="text-[var(--color-info)]" />
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
              Follow-ups
            </span>
          </div>
          <ul className="space-y-1.5 ml-5">
            {summary.follow_ups.map((item, i) => (
              <li key={i} className="text-sm text-[var(--color-text-primary)] list-disc">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Keywords */}
      {summary.keywords?.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {summary.keywords.map((kw, i) => (
            <Badge key={i} variant="accent">
              {kw}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
