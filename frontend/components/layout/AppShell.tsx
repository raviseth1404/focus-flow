'use client'

import { useUIStore } from '@/store/useUIStore'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { cn } from '@/lib/utils/cn'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { isSidebarCollapsed } = useUIStore()

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Sidebar — desktop only */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <main
        className={cn(
          'transition-all duration-300 ease-in-out min-h-screen',
          // Desktop: offset for sidebar
          isSidebarCollapsed ? 'md:pl-16' : 'md:pl-60',
          // Mobile: no sidebar offset, add bottom padding for bottom nav
          'pb-20 md:pb-0'
        )}
      >
        {children}
      </main>

      {/* Bottom nav — mobile only */}
      <BottomNav />
    </div>
  )
}
