'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils/cn'
import { X } from 'lucide-react'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  width?: string
}

export function Drawer({ isOpen, onClose, title, children, width = 'max-w-2xl' }: DrawerProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 frosted-overlay transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-full bg-[var(--color-bg-surface)]',
          'border-l border-[var(--color-border)]',
          'transition-transform duration-300 ease-in-out',
          'flex flex-col',
          `sm:${width}`,
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        style={{ boxShadow: '-8px 0 48px rgba(0,0,0,0.4)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          {title && (
            <h2 className="font-heading text-lg font-semibold text-[var(--color-text-primary)]">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  )
}
