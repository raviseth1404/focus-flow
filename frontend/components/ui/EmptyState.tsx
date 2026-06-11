import { cn } from '@/lib/utils/cn'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      {icon && (
        <div className="mb-4 text-[var(--color-text-disabled)]">
          {icon}
        </div>
      )}
      <h3 className="font-heading text-lg font-semibold text-[var(--color-text-primary)] mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[var(--color-text-secondary)] max-w-xs mb-6">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="primary" size="md">
          {action.label}
        </Button>
      )}
    </div>
  )
}

// SVG illustration for "no focus areas"
export function NoFocusAreasIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" opacity="0.3" />
      <circle cx="40" cy="40" r="24" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      <circle cx="40" cy="40" r="6" fill="currentColor" opacity="0.7" />
      <path d="M40 16 L40 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M40 54 L40 64" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M16 40 L26 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M54 40 L64 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </svg>
  )
}

export function NoEntriesIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="16" y="12" width="48" height="56" rx="6" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <line x1="26" y1="28" x2="54" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="26" y1="38" x2="54" y2="38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <line x1="26" y1="48" x2="42" y2="48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <circle cx="57" cy="57" r="12" fill="var(--color-bg-elevated)" stroke="currentColor" strokeWidth="2" opacity="0.6" />
      <line x1="57" y1="52" x2="57" y2="57" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <circle cx="57" cy="61" r="1.5" fill="currentColor" opacity="0.7" />
    </svg>
  )
}

export function NoSearchResultsIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="34" cy="34" r="20" stroke="currentColor" strokeWidth="2.5" opacity="0.4" />
      <line x1="48" y1="48" x2="64" y2="64" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
      <line x1="26" y1="34" x2="42" y2="34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="34" y1="26" x2="34" y2="42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}
