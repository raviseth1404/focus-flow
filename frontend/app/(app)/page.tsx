import { TopNav } from '@/components/layout/TopNav'
import { CalendarGrid } from '@/components/calendar/CalendarGrid'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <TopNav title="Calendar" />
      <div className="flex-1 p-6 max-w-content mx-auto w-full">
        <CalendarGrid />
      </div>
    </div>
  )
}
