'use client'

import { create } from 'zustand'
import type { FocusArea } from '@/types'

interface FocusAreaState {
  focusAreas: FocusArea[]
  isLoading: boolean
  setFocusAreas: (areas: FocusArea[]) => void
  addFocusArea: (area: FocusArea) => void
  updateFocusArea: (id: string, updates: Partial<FocusArea>) => void
  removeFocusArea: (id: string) => void
  setLoading: (loading: boolean) => void
}

export const useFocusAreaStore = create<FocusAreaState>((set) => ({
  focusAreas: [],
  isLoading: false,
  setFocusAreas: (focusAreas) => set({ focusAreas }),
  addFocusArea: (area) =>
    set((state) => ({ focusAreas: [...state.focusAreas, area] })),
  updateFocusArea: (id, updates) =>
    set((state) => ({
      focusAreas: state.focusAreas.map((fa) =>
        fa.id === id ? { ...fa, ...updates } : fa
      ),
    })),
  removeFocusArea: (id) =>
    set((state) => ({
      focusAreas: state.focusAreas.filter((fa) => fa.id !== id),
    })),
  setLoading: (isLoading) => set({ isLoading }),
}))
