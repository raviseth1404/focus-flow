'use client'

import { useEffect, useState } from 'react'
import { TopNav } from '@/components/layout/TopNav'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/useAuthStore'
import { profileApi } from '@/lib/api/profile'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { LogOut, Moon, Sun } from 'lucide-react'
import type { UserPreferences } from '@/types'

export default function SettingsPage() {
  const { profile, setProfile } = useAuthStore()
  const router = useRouter()
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [prefs, setPrefs] = useState<UserPreferences | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    profileApi.getPreferences().then(setPrefs).catch(() => {})
    if (profile?.display_name) setDisplayName(profile.display_name)
  }, [profile])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const updated = await profileApi.update({ display_name: displayName })
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

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav title="Settings" />
      <div className="flex-1 p-4 md:p-6 max-w-xl mx-auto w-full space-y-8">

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
              <p className="text-sm text-[var(--color-text-disabled)] font-mono bg-[var(--color-bg-elevated)] px-3 py-2 rounded-lg border border-[var(--color-border)]">
                {profile?.id}
              </p>
            </div>
            <Button type="submit" isLoading={isSaving}>
              Save profile
            </Button>
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
              <p className="text-xs text-[var(--color-text-secondary)]">
                Currently: {prefs?.theme || 'dark'}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleToggleTheme}>
              {prefs?.theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              {prefs?.theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </Button>
          </div>
        </section>

        {/* Account */}
        <section className="card p-6">
          <h2 className="font-heading text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            Account
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Plan</p>
              <p className="text-xs text-[var(--color-text-secondary)] capitalize">
                {profile?.plan || 'free'}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
            <Button
              variant="danger"
              onClick={handleSignOut}
              isLoading={isSigningOut}
            >
              <LogOut size={14} /> Sign out
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
