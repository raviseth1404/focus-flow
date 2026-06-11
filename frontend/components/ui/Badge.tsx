import { cn } from '@/lib/utils/cn'

type BadgeVariant = 'default' | 'accent' | 'teal' | 'success' | 'warning' | 'error'

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]',
  accent: 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]',
  teal: 'bg-[var(--color-teal-muted)] text-[var(--color-teal)]',
  success: 'bg-[rgba(34,197,94,0.12)] text-[var(--color-success)]',
  warning: 'bg-[rgba(245,158,11,0.12)] text-[var(--color-warning)]',
  error: 'bg-[rgba(239,68,68,0.12)] text-[var(--color-error)]',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
