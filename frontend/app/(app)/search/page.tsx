'use client'

import { TopNav } from '@/components/layout/TopNav'
import { useUIStore } from '@/store/useUIStore'
import { Button } from '@/components/ui/Button'
import { Search } from 'lucide-react'
import { useEffect } from 'react'

export default function SearchPage() {
  const { openSearch } = useUIStore()

  useEffect(() => {
    // Auto-open search modal when navigating to /search
    openSearch()
  }, [openSearch])

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav title="Search" />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg-elevated)] flex items-center justify-center mx-auto mb-4">
            <Search size={28} className="text-[var(--color-text-disabled)]" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-[var(--color-text-primary)] mb-2">
            Search your entries
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-5">
            Press ⌘K anywhere to open search
          </p>
          <Button onClick={openSearch}>
            <Search size={14} /> Open Search
          </Button>
        </div>
      </div>
    </div>
  )
}
