'use client'

import { useUIStore } from '@/store/useUIStore'
import { Sidebar } from './Sidebar'
import { cn } from '@/lib/utils/cn'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { isSidebarCollapsed } = useUIStore()

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <Sidebar />
      <main
        className={cn(
          'transition-all duration-300 ease-in-out min-h-screen',
          isSidebarCollapsed ? 'pl-16' : 'pl-60'
        )}
      >
        {children}
      </main>
    </div>
  )
}
