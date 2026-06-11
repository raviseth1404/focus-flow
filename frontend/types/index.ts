export type Plan = 'free' | 'pro' | 'enterprise'
export type Mood = 'great' | 'good' | 'okay' | 'low' | 'rough'
export type Theme = 'dark' | 'light'

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  timezone: string
  plan: Plan
  onboarding_done: boolean
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  user_id: string
  theme: Theme
  default_editor_font: string
  calendar_start_month: string
  calendar_end_month: string
  sidebar_collapsed: boolean
  email_weekly_digest: boolean
}

export interface FocusArea {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  description: string | null
  target_days_per_week: number
  display_order: number
  is_active: boolean
  is_archived: boolean
  todo_items: string[]
  created_at: string
  updated_at: string
}

export interface FocusAreaWithStats extends FocusArea {
  total_days: number
  last_entry_date: string | null
  total_words: number
}

export interface AISummary {
  one_liner: string
  accomplishments: string[]
  learnings: string[]
  follow_ups: string[]
  keywords: string[]
}

export interface DailyEntry {
  id: string
  user_id: string
  focus_area_id: string
  entry_date: string
  activities: Record<string, unknown> | null
  activities_plain_text: string | null
  notes: Record<string, unknown> | null
  notes_plain_text: string | null
  ai_summary: AISummary | null
  ai_summary_generated_at: string | null
  ai_summary_model: string | null
  mood: Mood | null
  word_count: number
  todo_completions: Record<string, boolean>
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export interface CalendarHeatmapItem {
  date: string
  completion_pct: number
  mood: Mood | null
  entry_count: number
}

export interface DailyMood {
  id: string
  user_id: string
  entry_date: string
  mood: Mood
  note: string | null
  created_at: string
}

export interface Attachment {
  id: string
  user_id: string
  daily_entry_id: string
  section: 'activities' | 'notes'
  file_name: string
  file_size_bytes: number | null
  mime_type: string | null
  storage_path: string
  thumbnail_path: string | null
  created_at: string
  signed_url?: string
}

export interface PinnedItem {
  id: string
  user_id: string
  daily_entry_id: string
  focus_area_id: string
  section: 'activities' | 'notes' | 'ai_summary' | null
  pin_note: string | null
  created_at: string
}

export interface WeeklyDigestHighlight {
  focus_area_id: string
  focus_area_name: string
  days_logged: number
  summary: string
  top_insight: string
}

export interface WeeklyDigestContent {
  overall_summary: string
  momentum_score: number
  highlights_by_area: WeeklyDigestHighlight[]
  top_learnings: string[]
  next_week_suggestions: string[]
}

export interface WeeklyDigest {
  id: string
  user_id: string
  week_start: string
  week_end: string
  digest_content: WeeklyDigestContent | null
  generated_at: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export interface SearchResult extends DailyEntry {
  focus_area?: FocusArea
}
