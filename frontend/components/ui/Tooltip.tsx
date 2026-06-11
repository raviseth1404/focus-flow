'use client'

import { useState, useRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface TooltipProps {
  content: string
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
}

export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={cn(
            'absolute z-50 px-2.5 py-1 text-xs font-medium whitespace-nowrap rounded-md pointer-events-none',
            'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]',
            'border border-[var(--color-border)]',
            positionClasses[side]
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}
