'use client'

import { useEffect, useState } from 'react'
import { TopNav } from '@/components/layout/TopNav'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/useAuthStore'
import { profileApi } from '@/lib/api/profile'
import type { StreakData } from '@/lib/api/profile'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { LogOut, Moon, Sun, Flame, Trophy, CalendarDays, Zap } from 'lucide-react'
import type { UserPreferences } from '@/types'

const TIMEZONES = [
  'Asia/Kolkata', 'Asia/Colombo', 'Asia/Dhaka', 'Asia/Karachi',
  'Asia/Dubai', 'Asia/Singapore', 'Asia/Hong_Kong', 'Asia/Tokyo', 'Asia/Seoul',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'America/Sao_Paulo',
  'Australia/Sydney', 'Australia/Melbourne', 'Pacific/Auckland', 'Africa/Lagos',
]

export default function SettingsPage() {
  const { profile, setProfile, user } = useAuthStore()
  const router = useRouter()
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [timezone, setTimezone] = useState(profile?.timezone || 'Asia/Kolkata')
  const [prefs, setPrefs] = useState<UserPreferences | null>(null)
  const [streak, setStreak] = useState<StreakData | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    profileApi.getPreferences().then(setPrefs).catch(() => {})
    profileApi.getStreak().then(setStreak).catch(() => {})
    if (profile?.display_name) setDisplayName(profile.display_name)
    if (profile?.timezone) setTimezone(profile.timezone)
  }, [profile])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const updated = await profileApi.update({ display_name: displayName, timezone })
      setProfile(updated)
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    }
    setIsSaving(false)
  }

  const handleToggleTheme = async () => {
    if (!prefs) return
    const newTheme = prefs.theme === 'dark' ? 'light' : 'dark'
    try {
      const updated = await profileApi.updatePreferences({ theme: newTheme })
      setPrefs(updated)
      document.documentElement.className = newTheme === 'dark' ? 'dark' : 'light'
    } catch {
      toast.error('Failed to update theme')
    }
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const streakEmoji = (n: number) => n >= 30 ? '🔥' : n >= 7 ? '⚡' : n >= 3 ? '✨' : '📅'

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav title="Settings" />
      <div className="flex-1 p-4 md:p-6 max-w-xl mx-auto w-full space-y-6">

        {/* Streak Card */}
        {streak && (
          <section className="card p-6">
            <h2 className="font-heading text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <Flame size={18} className="text-[var(--color-accent)]" /> Streak
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--color-accent)] font-heading">
                  {streak.current_streak}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1 flex items-center justify-center gap-1">
                  <Zap size={10} /> Current
                </div>
                {streak.current_streak > 0 && (
                  <div className="text-lg mt-1">{streakEmoji(streak.current_streak)}</div>
                )}
              </div>
              <div className="text-center border-x border-[var(--color-border)]">
                <div className="text-3xl font-bold text-[var(--color-text-primary)] font-heading">
                  {streak.longest_streak}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1 flex items-center justify-center gap-1">
                  <Trophy size={10} /> Longest
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--color-text-primary)] font-heading">
                  {streak.total_days}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1 flex items-center justify-center gap-1">
                  <CalendarDays size={10} /> Total days
                </div>
              </div>
            </div>
            <p className="text-xs text-[var(--color-text-disabled)] text-center mt-4">
              {streak.current_streak === 0
                ? 'Log an entry today to start your streak! 🚀'
                : streak.current_streak === streak.longest_streak
                ? '🏆 This is your all-time best streak! Keep going!'
                : `${streak.longest_streak - streak.current_streak} more days to beat your record`}
            </p>
          </section>
        )}

        {/* Profile */}
        <section className="card p-6">
          <h2 className="font-heading text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            Profile
          </h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Input
              label="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
            <div>
              <label className="text-sm font-medium text-[var(--color-text-secondary)] block mb-1.5">
                Email
              </label>
              <p className="text-sm text-[var(--color-text-disabled)] bg-[var(--color-bg-elevated)] px-3 py-2 rounded-lg border border-[var(--color-border)]">
                {user?.email || '—'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
              >
                {TIMEZONES.map(tz => (
                  <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <Button type="submit" isLoading={isSaving}>Save profile</Button>
          </form>
        </section>

        {/* Appearance */}
        <section className="card p-6">
          <h2 className="font-heading text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            Appearance
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Theme</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Currently: {prefs?.theme || 'dark'}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleToggleTheme}>
              {prefs?.theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              {prefs?.theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </Button>
          </div>
        </section>

        {/* Install as App */}
        <section className="card p-6">
          <h2 className="font-heading text-lg font-semibold text-[var(--color-text-primary)] mb-2">
            Install App
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-3">
            Add FocusFlow to your home screen for a full-screen, app-like experience.
          </p>
          <div className="space-y-2 text-xs text-[var(--color-text-disabled)]">
            <p>📱 <strong className="text-[var(--color-text-secondary)]">iOS Safari:</strong> Tap the Share button → "Add to Home Screen"</p>
            <p>🤖 <strong className="text-[var(--color-text-secondary)]">Android Chrome:</strong> Tap menu (⋮) → "Add to Home Screen"</p>
            <p>💻 <strong className="text-[var(--color-text-secondary)]">Desktop Chrome/Edge:</strong> Click the install icon (⊕) in the address bar</p>
          </div>
        </section>

        {/* Account */}
        <section className="card p-6">
          <h2 className="font-heading text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            Account
          </h2>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Plan</p>
              <p className="text-xs text-[var(--color-text-secondary)] capitalize">{profile?.plan || 'free'} — personal use</p>
            </div>
          </div>
          <div className="pt-4 border-t border-[var(--color-border)]">
            <Button variant="danger" onClick={handleSignOut} isLoading={isSigningOut}>
              <LogOut size={14} /> Sign out
            </Button>
          </div>
        </section>

      </div>
    </div>
  )
}
