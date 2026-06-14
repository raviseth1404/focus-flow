'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { profileApi } from '@/lib/api/profile'
import { focusAreasApi } from '@/lib/api/focus-areas'
import { useAuthStore } from '@/store/useAuthStore'
import { useFocusAreaStore } from '@/store/useFocusAreaStore'
import toast from 'react-hot-toast'
import { CheckCircle2, Target, User, MapPin } from 'lucide-react'

const TIMEZONES = [
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Australia/Sydney', 'Pacific/Auckland',
]

const PRESET_ICONS = ['🎯', '📚', '💪', '🏃', '💻', '🎨', '🌱', '💰', '🧘', '✍️', '🎵', '🔬']
const PRESET_COLORS = ['#F4A636', '#0FADA0', '#3B82F6', '#22C55E', '#EF4444', '#8B5CF6']

const STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'profile', label: 'Profile' },
  { id: 'timezone', label: 'Timezone' },
  { id: 'focus', label: 'First Focus Area' },
  { id: 'done', label: 'All Set' },
]

interface OnboardingFlowProps {
  onComplete: () => void
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { profile, setProfile } = useAuthStore()
  const { setFocusAreas } = useFocusAreaStore()

  const [step, setStep] = useState(0)
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [timezone, setTimezone] = useState(profile?.timezone || 'Asia/Kolkata')
  const [faName, setFaName] = useState('')
  const [faIcon, setFaIcon] = useState('🎯')
  const [faColor, setFaColor] = useState('#F4A636')
  const [isLoading, setIsLoading] = useState(false)
  const [skipFocus, setSkipFocus] = useState(false)

  const stepCount = STEPS.length

  const next = () => setStep(s => Math.min(s + 1, stepCount - 1))

  const handleSaveProfile = async () => {
    if (!displayName.trim()) return
    setIsLoading(true)
    try {
      const updated = await profileApi.update({ display_name: displayName.trim(), timezone })
      setProfile(updated)
      next()
    } catch {
      toast.error('Failed to save profile')
    }
    setIsLoading(false)
  }

  const handleSaveTimezone = async () => {
    setIsLoading(true)
    try {
      const updated = await profileApi.update({ timezone })
      setProfile(updated)
      next()
    } catch {
      toast.error('Failed to save timezone')
    }
    setIsLoading(false)
  }

  const handleCreateFocus = async () => {
    if (!faName.trim() && !skipFocus) return
    setIsLoading(true)
    try {
      if (!skipFocus && faName.trim()) {
        const fa = await focusAreasApi.create({
          name: faName.trim(),
          icon: faIcon,
          color: faColor,
          description: '',
          target_days_per_week: 5,
          todo_items: [],
        })
        setFocusAreas([fa])
      }
      const updated = await profileApi.completeOnboarding()
      setProfile(updated)
      next()
    } catch {
      toast.error('Something went wrong')
    }
    setIsLoading(false)
  }

  const handleFinish = () => onComplete()

  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-bg-base)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i < step ? 'w-8 bg-[var(--color-accent)]' :
                i === step ? 'w-8 bg-[var(--color-accent)]' :
                'w-4 bg-[var(--color-border)]'
              }`}
            />
          ))}
        </div>

        <div className="card p-8">
          {/* Step 0 — Welcome */}
          {step === 0 && (
            <div className="text-center space-y-4">
              <div className="text-5xl mb-2">🎯</div>
              <h1 className="font-heading text-2xl font-bold text-[var(--color-text-primary)]">
                Welcome to FocusFlow
              </h1>
              <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                Your personal dashboard to track focus areas, log daily progress, and build lasting habits. Let's get you set up in 2 minutes.
              </p>
              <Button className="w-full mt-4" onClick={next}>
                Get started →
              </Button>
            </div>
          )}

          {/* Step 1 — Name */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-[var(--color-accent-muted)] flex items-center justify-center">
                  <User size={16} className="text-[var(--color-accent)]" />
                </div>
                <h2 className="font-heading text-xl font-semibold text-[var(--color-text-primary)]">What should we call you?</h2>
              </div>
              <Input
                label="Your name"
                placeholder="e.g. Ravi"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                autoFocus
              />
              <Button
                className="w-full"
                onClick={handleSaveProfile}
                isLoading={isLoading}
                disabled={!displayName.trim()}
              >
                Continue
              </Button>
            </div>
          )}

          {/* Step 2 — Timezone */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-[var(--color-accent-muted)] flex items-center justify-center">
                  <MapPin size={16} className="text-[var(--color-accent)]" />
                </div>
                <h2 className="font-heading text-xl font-semibold text-[var(--color-text-primary)]">Your timezone</h2>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">This ensures your daily logs are recorded at the right time.</p>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Timezone</label>
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
              <Button className="w-full" onClick={handleSaveTimezone} isLoading={isLoading}>
                Continue
              </Button>
            </div>
          )}

          {/* Step 3 — First focus area */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-[var(--color-accent-muted)] flex items-center justify-center">
                  <Target size={16} className="text-[var(--color-accent)]" />
                </div>
                <h2 className="font-heading text-xl font-semibold text-[var(--color-text-primary)]">Create your first focus area</h2>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">Focus areas are the key parts of your life you want to track — like Health, Work, or Learning.</p>

              <Input
                label="Name"
                placeholder="e.g. Health & Fitness"
                value={faName}
                onChange={e => { setFaName(e.target.value); setSkipFocus(false) }}
                autoFocus
              />

              <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 block">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_ICONS.map(ic => (
                    <button key={ic} type="button" onClick={() => setFaIcon(ic)}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${faIcon === ic ? 'bg-[var(--color-accent-muted)] ring-2 ring-[var(--color-accent)]' : 'bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-subtle)]'}`}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 block">Color</label>
                <div className="flex gap-2">
                  {PRESET_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setFaColor(c)}
                      className={`w-7 h-7 rounded-full transition-all ${faColor === c ? 'ring-2 ring-offset-2 ring-offset-[var(--color-bg-elevated)] ring-white scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => { setSkipFocus(true); handleCreateFocus() }} isLoading={isLoading}>
                  Skip
                </Button>
                <Button className="flex-1" onClick={handleCreateFocus} isLoading={isLoading} disabled={!faName.trim()}>
                  Create & continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 4 — Done */}
          {step === 4 && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle2 size={56} className="text-[var(--color-accent)]" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-[var(--color-text-primary)]">You're all set, {displayName || 'there'}!</h2>
              <p className="text-[var(--color-text-secondary)] text-sm">
                Start logging your first day. Every day you log builds your streak — let's see how far you can go!
              </p>
              <Button className="w-full mt-4" onClick={handleFinish}>
                Go to my dashboard →
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
