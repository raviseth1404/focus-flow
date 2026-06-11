'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { createClient } from '@/lib/supabase/client'
import { profileApi } from '@/lib/api/profile'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { setUser, setSession, setProfile, setLoading, isLoading } = useAuthStore()

  useEffect(() => {
    const supabase = createClient()

    // Load initial session from cookie (no server round-trip)
    const initialize = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setSession(session)
        setUser(session.user)
        try {
          const profile = await profileApi.get()
          setProfile(profile)
        } catch {}
      }
      setLoading(false)
    }

    initialize()

    // Only act on explicit sign-out
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setSession(null)
          setProfile(null)
          router.replace('/login')
        } else if (event === 'SIGNED_IN' && session) {
          setSession(session)
          setUser(session.user)
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setSession(session)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, setUser, setSession, setProfile, setLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
          <p className="text-sm text-[var(--color-text-secondary)]">Loading FocusFlow…</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
