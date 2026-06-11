'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { useUIStore } from '@/store/useUIStore'
import { useAuthStore } from '@/store/useAuthStore'
import { Avatar } from '@/components/ui/Avatar'
import { Tooltip } from '@/components/ui/Tooltip'
import {
  CalendarDays, Target, Search, Settings,
  ChevronLeft, ChevronRight, Zap
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', label: 'Calendar', icon: CalendarDays },
  { href: '/focus-areas', label: 'Focus Areas', icon: Target },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isSidebarCollapsed, toggleSidebar } = useUIStore()
  const { profile } = useAuthStore()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-30 h-screen flex flex-col',
        'bg-[var(--color-bg-surface)] border-r border-[var(--color-border)]',
        'transition-all duration-300 ease-in-out',
        isSidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-[var(--color-border)]',
        isSidebarCollapsed && 'justify-center px-0'
      )}>
        <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-muted)] flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-[var(--color-accent)]" />
        </div>
        {!isSidebarCollapsed && (
          <span className="font-heading font-semibold text-[var(--color-text-primary)] text-base">
            FocusFlow
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
          const item = (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
                isSidebarCollapsed && 'justify-center px-2',
                isActive
                  ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)]'
              )}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!isSidebarCollapsed && <span>{label}</span>}
              {isActive && !isSidebarCollapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
              )}
            </Link>
          )
          return isSidebarCollapsed ? (
            <Tooltip key={href} content={label} side="right">{item}</Tooltip>
          ) : item
        })}
      </nav>

      {/* User + Collapse */}
      <div className="p-2 border-t border-[var(--color-border)] space-y-1">
        <div className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg',
          isSidebarCollapsed && 'justify-center px-2'
        )}>
          <Avatar src={profile?.avatar_url} name={profile?.display_name} size="sm" />
          {!isSidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                {profile?.display_name || 'User'}
              </p>
              <p className="text-xs text-[var(--color-text-disabled)] capitalize">
                {profile?.plan || 'free'}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={toggleSidebar}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
            'text-[var(--color-text-disabled)] hover:text-[var(--color-text-secondary)]',
            'hover:bg-[var(--color-bg-subtle)] transition-colors',
            isSidebarCollapsed && 'justify-center px-2'
          )}
        >
          {isSidebarCollapsed ? <ChevronRight size={16} /> : (
            <>
              <ChevronLeft size={16} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
