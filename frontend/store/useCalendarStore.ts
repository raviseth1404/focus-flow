'use client'

import { create } from 'zustand'
import type { CalendarHeatmapItem } from '@/types'

interface CalendarState {
  selectedDate: string | null
  currentYear: number
  currentMonth: number
  heatmapData: Record<string, CalendarHeatmapItem>
  isDrawerOpen: boolean
  setSelectedDate: (date: string | null) => void
  setMonth: (year: number, month: number) => void
  setHeatmapData: (data: CalendarHeatmapItem[]) => void
  openDrawer: (date: string) => void
  closeDrawer: () => void
}

const now = new Date()

export const useCalendarStore = create<CalendarState>((set) => ({
  selectedDate: null,
  currentYear: now.getFullYear(),
  currentMonth: now.getMonth(),
  heatmapData: {},
  isDrawerOpen: false,
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setMonth: (currentYear, currentMonth) => set({ currentYear, currentMonth }),
  setHeatmapData: (data) =>
    set({
      heatmapData: Object.fromEntries(data.map((item) => [item.date, item])),
    }),
  openDrawer: (date) => set({ selectedDate: date, isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
}))
