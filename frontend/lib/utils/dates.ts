import { format, parseISO, startOfWeek, endOfWeek, addMonths, isSameDay, isToday } from 'date-fns'

export const CALENDAR_START = new Date(2025, 5, 1)   // June 1 2025 local time
export const CALENDAR_END = new Date(2027, 2, 31)     // March 31 2027 local time

export function formatDate(date: Date | string, pattern = 'yyyy-MM-dd'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, pattern)
}

export function getWeekBounds(date: Date): { start: Date; end: Date } {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  }
}

export function getMonthsInRange(start: Date, end: Date): Date[] {
  const months: Date[] = []
  let current = new Date(start.getFullYear(), start.getMonth(), 1)
  while (current <= end) {
    months.push(new Date(current))
    current = addMonths(current, 1)
  }
  return months
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = []
  const date = new Date(year, month, 1)
  while (date.getMonth() === month) {
    days.push(new Date(date))
    date.setDate(date.getDate() + 1)
  }
  return days
}

export { isSameDay, isToday, parseISO, format }
