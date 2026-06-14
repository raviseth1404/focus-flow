'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { CalendarDays, Target, Search, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', label: 'Calendar', icon: CalendarDays },
  { href: '/focus-areas', label: 'Focus Areas', icon: Target },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-bg-surface)] border-t border-[var(--color-border)] flex md:hidden">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors',
              isActive
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-text-disabled)]'
            )}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
