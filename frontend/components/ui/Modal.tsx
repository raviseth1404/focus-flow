'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils/cn'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export function Modal({ isOpen, onClose, title, children, size = 'md', className }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

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

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div className="frosted-overlay absolute inset-0" />
      <div
        className={cn(
          'relative w-full card',
          'max-h-[90vh] flex flex-col',
          'animate-[scale-in_0.2s_ease] sm:animate-none',
          'sm:animate-[scale-in_0.2s_ease]',
          sizeMap[size],
          className
        )}
        style={{ boxShadow: '0 8px 48px rgba(0,0,0,0.5)' }}
      >
        {/* Sticky header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-0 flex-shrink-0">
          {title ? (
            <h2 className="font-heading text-lg font-semibold text-[var(--color-text-primary)]">
              {title}
            </h2>
          ) : <span />}
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)] transition-colors ml-auto"
          >
            <X size={16} />
          </button>
        </div>
        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 pb-6 pt-5">
          {children}
        </div>
      </div>
    </div>
  )
}
