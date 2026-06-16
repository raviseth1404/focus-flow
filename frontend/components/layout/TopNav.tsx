'use client'

import { useUIStore } from '@/store/useUIStore'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/Button'
import { Search, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface TopNavProps {
  title?: string
}

export function TopNav({ title }: TopNavProps) {
  const { openSearch } = useUIStore()
  const { signOut } = useAuthStore()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    signOut()
    router.push('/login')
    toast.success('Signed out')
  }

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]">
      {title && (
        <h1 className="font-heading text-xl font-semibold text-[var(--color-text-primary)]">
          {title}
        </h1>
      )}

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={openSearch}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] bg-[var(--color-bg-elevated)] border border-[var(--color-border)] hover:border-[rgba(255,255,255,0.14)] transition-colors"
        >
          <Search size={14} />
          <span className="hidden sm:block">Search</span>
          <kbd className="hidden sm:block text-xs text-[var(--color-text-disabled)] bg-[var(--color-bg-subtle)] px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </button>

        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut size={14} />
        </Button>
      </div>
    </header>
  )
}
