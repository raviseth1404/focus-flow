'use client'

import { useState } from 'react'
import { Share2, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'

interface ShareButtonProps {
  title: string
  text: string
  className?: string
  size?: 'sm' | 'xs'
}

export function ShareButton({ title, text, className, size = 'sm' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    if (!text.trim()) {
      toast('Nothing to share yet', { icon: '📝' })
      return
    }

    // Web Share API — shows native share sheet (Gmail, WhatsApp, Messages, etc.)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text })
        return
      } catch (err: unknown) {
        // User cancelled — not an error
        if (err instanceof Error && err.name === 'AbortError') return
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(`${title}\n\n${text}`)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not share or copy')
    }
  }

  const iconSize = size === 'xs' ? 12 : 14

  return (
    <button
      type="button"
      onClick={handleShare}
      title="Share"
      className={cn(
        'flex items-center gap-1 transition-colors',
        size === 'xs'
          ? 'text-[var(--color-text-disabled)] hover:text-[var(--color-text-secondary)]'
          : 'px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]',
        className
      )}
    >
      {copied
        ? <><Check size={iconSize} />{size !== 'xs' && 'Copied'}</>
        : <><Share2 size={iconSize} />{size !== 'xs' && 'Share'}</>}
    </button>
  )
}
