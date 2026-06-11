# FocusFlow — Production-Grade Super Prompt for Claude Code
### Authored for: Staff-Level Full-Stack Implementation
### Version: 2.0 | Commercial SaaS | Multi-Tenant Ready

---

## ENGINEERING MINDSET

You are a **Staff Software Engineer** with 12+ years of experience building commercial SaaS products — the kind of engineer who ships production code at companies like Notion, Linear, or Vercel. You write code that is:

- **Correct first, then fast**: No shortcuts, no "we'll fix this later"
- **Multi-tenant from day one**: Every query is scoped by `user_id`. RLS is not optional
- **Observable**: Structured logging, error boundaries, graceful degradation
- **Maintainable**: Typed schemas, clear separation of concerns, documented decisions
- **Deployable**: Works identically in local dev, staging, and production

Do NOT scaffold placeholder code. Do NOT write TODO comments and move on. Every function you write must work end-to-end before you proceed to the next one. After each major feature, do a manual walkthrough of the happy path.

---

## PROJECT IDENTITY

**Product name**: FocusFlow  
**Tagline**: "Your focused life, one day at a time."  
**Purpose**: A personal productivity and journaling application where users define their own "focus areas" (life goals, learning tracks, health habits, professional domains), then log daily activities, notes, and reflections against each area — with AI-powered summarization, voice input, rich media, and a beautiful calendar-driven interface.  
**Target**: Initially personal use, architected for commercial SaaS with subscription tiers from day one.

---

## TECHNOLOGY STACK (NON-NEGOTIABLE)

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript | Deploy to **Vercel** |
| Backend | FastAPI (Python 3.11) | Deploy to **Render** (web service) |
| Database | **Supabase PostgreSQL** | **NEVER SQLite. NEVER.** |
| Auth | Supabase Auth | Email+password + Google OAuth |
| File Storage | Supabase Storage | Private bucket, signed URLs |
| AI | Anthropic API (`claude-sonnet-4-20250514`) | Backend only, key never exposed to frontend |
| ORM | SQLAlchemy (async) + Alembic for migrations | |
| Validation | Pydantic v2 (backend) + Zod (frontend) | |
| State Management | Zustand (frontend) | |
| Rich Text | Tiptap v2 | Custom extensions for fonts + colors |
| Styling | Tailwind CSS + CSS Modules for complex components | |
| HTTP Client | Axios with interceptors (frontend → backend) | |
| Testing | Pytest (backend) + Vitest + React Testing Library (frontend) | Write at least smoke tests |
| CI/CD | GitHub Actions → auto-deploy Vercel + Render on main branch merge | |

---

## DESIGN SYSTEM (IMPLEMENT EXACTLY AS SPECIFIED)

This is not negotiable. Do not default to generic Tailwind defaults.

### Color Palette

```css
:root {
  /* Backgrounds */
  --color-bg-primary:    #0C0F1A;   /* near-black navy — main app background */
  --color-bg-surface:    #141827;   /* slightly lighter — cards, sidebar */
  --color-bg-elevated:   #1C2236;   /* modals, dropdowns, popovers */
  --color-bg-subtle:     #242B42;   /* hover states, dividers */

  /* Brand Accent — Amber Gold */
  --color-accent:        #F4A636;
  --color-accent-muted:  rgba(244, 166, 54, 0.15);
  --color-accent-hover:  #FFB84D;

  /* Secondary Accent — Teal */
  --color-teal:          #0FADA0;
  --color-teal-muted:    rgba(15, 173, 160, 0.12);

  /* Text */
  --color-text-primary:  #F0EDE6;   /* warm off-white */
  --color-text-secondary:#A8A4A0;   /* muted */
  --color-text-disabled: #52504D;

  /* Semantic */
  --color-success:       #22C55E;
  --color-warning:       #F59E0B;
  --color-error:         #EF4444;
  --color-info:          #3B82F6;

  /* Borders */
  --color-border:        rgba(255, 255, 255, 0.07);
  --color-border-focus:  rgba(244, 166, 54, 0.5);
}
```

### Typography

Load from Google Fonts in `layout.tsx`:
- **Headings**: `Playfair Display` (serif, weight 600/700) — conveys authority, depth
- **Body / UI**: `DM Sans` (weight 400/500) — clean, modern, readable at small sizes
- **Monospace / Code**: `JetBrains Mono` — for any data, IDs, technical content

**NEVER use Inter, Roboto, Arial, or system-ui as primary fonts.**

### Spacing System

Use Tailwind's default scale (4px base). Key spacings:
- Sidebar width: `240px` collapsed to `64px` icon-only on mobile
- Content max-width: `1280px` centered
- Card padding: `24px`
- Section gap: `32px`

### Component Design Principles

1. **Cards**: `background: var(--color-bg-surface)`, `border: 1px solid var(--color-border)`, `border-radius: 12px`, subtle `box-shadow: 0 2px 16px rgba(0,0,0,0.3)`
2. **Buttons (Primary)**: Amber gradient `linear-gradient(135deg, #F4A636 0%, #E8952A 100%)`, dark text, `border-radius: 8px`, scale-up on hover
3. **Buttons (Secondary/Ghost)**: Transparent with `var(--color-border)` border, text in `var(--color-text-secondary)`
4. **Inputs**: `background: var(--color-bg-elevated)`, amber focus ring, no harsh white borders
5. **Modals**: Frosted glass overlay `backdrop-filter: blur(12px)`, slide-in animation from bottom on mobile, scale-in on desktop
6. **Sidebar**: Fixed left, `var(--color-bg-surface)` background, amber indicator for active nav item
7. **Skeleton Loaders**: Animated shimmer using `var(--color-bg-subtle)` — every list/card must have a skeleton state
8. **Empty States**: Illustrated (use SVG inline illustrations, not stock icons) with a helpful CTA — never show a blank white area

### The Signature Visual

The calendar is the hero of this application. Each date cell must:
- Show a **radial completion arc** (SVG) around the date number, where the arc fill percentage = (focus areas logged / total active focus areas × 100%)
- The arc color transitions from teal (low completion) to amber (high completion) to a warm white glow (100%)
- Dates with zero entries: subtle, dark, no arc
- Today: gold pulsing border ring
- This must feel like a premium habit tracker, not a plain calendar

---

## COMPLETE DATABASE SCHEMA

Run all of this in Supabase SQL editor. Every table must have RLS enabled.

```sql
-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for fuzzy search

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    TEXT,
  avatar_url      TEXT,
  timezone        TEXT DEFAULT 'Asia/Kolkata',
  plan            TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  onboarding_done BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on new signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- FOCUS AREAS
-- ============================================================
CREATE TABLE focus_areas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  icon            TEXT DEFAULT '🎯',
  color           TEXT DEFAULT '#F4A636',
  description     TEXT,
  target_days_per_week  INTEGER DEFAULT 5 CHECK (target_days_per_week BETWEEN 1 AND 7),
  display_order   INTEGER DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  is_archived     BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_focus_areas_user_id ON focus_areas(user_id);
CREATE INDEX idx_focus_areas_active ON focus_areas(user_id, is_active) WHERE is_active = true;

-- ============================================================
-- DAILY ENTRIES (one row per user × focus_area × date)
-- ============================================================
CREATE TABLE daily_entries (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  focus_area_id               UUID NOT NULL REFERENCES focus_areas(id) ON DELETE CASCADE,
  entry_date                  DATE NOT NULL,

  -- Rich text stored as Tiptap JSON
  activities                  JSONB,
  activities_plain_text       TEXT GENERATED ALWAYS AS (
                                COALESCE(activities->>'text', '')
                              ) STORED,

  notes                       JSONB,
  notes_plain_text            TEXT GENERATED ALWAYS AS (
                                COALESCE(notes->>'text', '')
                              ) STORED,

  -- AI Summary
  ai_summary                  JSONB,
  -- Expected structure:
  -- {
  --   one_liner: "...",
  --   accomplishments: ["..."],
  --   learnings: ["..."],
  --   follow_ups: ["..."],
  --   keywords: ["..."]
  -- }
  ai_summary_generated_at     TIMESTAMPTZ,
  ai_summary_model            TEXT,

  -- Mood (logged once per day per focus area, or override at daily level)
  mood                        TEXT CHECK (mood IN ('great','good','okay','low','rough')),

  -- Word count cache (updated by trigger)
  word_count                  INTEGER DEFAULT 0,

  created_at                  TIMESTAMPTZ DEFAULT now(),
  updated_at                  TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_user_focusarea_date UNIQUE (user_id, focus_area_id, entry_date)
);

-- Full-text search index across all text content
CREATE INDEX idx_daily_entries_fts ON daily_entries
  USING GIN (
    to_tsvector('english',
      coalesce(activities_plain_text, '') || ' ' ||
      coalesce(notes_plain_text, '') || ' ' ||
      coalesce(ai_summary->>'one_liner', '') || ' ' ||
      coalesce(ai_summary->>'accomplishments'::text, '')
    )
  );

-- Trigram index for partial/fuzzy search
CREATE INDEX idx_daily_entries_activities_trgm ON daily_entries USING GIN (activities_plain_text gin_trgm_ops);
CREATE INDEX idx_daily_entries_notes_trgm ON daily_entries USING GIN (notes_plain_text gin_trgm_ops);
CREATE INDEX idx_daily_entries_date ON daily_entries(user_id, entry_date);
CREATE INDEX idx_daily_entries_focus_area ON daily_entries(user_id, focus_area_id);

-- ============================================================
-- DAILY MOOD (one per user per day, separate from focus areas)
-- ============================================================
CREATE TABLE daily_moods (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date  DATE NOT NULL,
  mood        TEXT NOT NULL CHECK (mood IN ('great','good','okay','low','rough')),
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_date_mood UNIQUE (user_id, entry_date)
);

-- ============================================================
-- ATTACHMENTS
-- ============================================================
CREATE TABLE attachments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_entry_id  UUID NOT NULL REFERENCES daily_entries(id) ON DELETE CASCADE,
  section         TEXT NOT NULL CHECK (section IN ('activities', 'notes')),
  file_name       TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type       TEXT,
  storage_path    TEXT NOT NULL,  -- path in Supabase Storage
  thumbnail_path  TEXT,           -- for images: auto-generated thumbnail
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_attachments_entry ON attachments(daily_entry_id);

-- ============================================================
-- PINNED ITEMS
-- ============================================================
CREATE TABLE pinned_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_entry_id  UUID NOT NULL REFERENCES daily_entries(id) ON DELETE CASCADE,
  focus_area_id   UUID NOT NULL REFERENCES focus_areas(id) ON DELETE CASCADE,
  section         TEXT CHECK (section IN ('activities', 'notes', 'ai_summary')),
  pin_note        TEXT,  -- optional label user adds to the pin
  created_at      TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_pin UNIQUE (user_id, daily_entry_id, section)
);

-- ============================================================
-- WEEKLY DIGESTS (cached AI-generated weekly summaries)
-- ============================================================
CREATE TABLE weekly_digests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start      DATE NOT NULL,  -- always Monday
  week_end        DATE NOT NULL,  -- always Sunday
  digest_content  JSONB,
  -- {
  --   overall_summary: "...",
  --   highlights_by_area: [{focus_area_id, name, summary}],
  --   top_learnings: ["..."],
  --   momentum_score: 0-100
  -- }
  generated_at    TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_week UNIQUE (user_id, week_start)
);

-- ============================================================
-- USER PREFERENCES
-- ============================================================
CREATE TABLE user_preferences (
  user_id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme                 TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  default_editor_font   TEXT DEFAULT 'DM Sans',
  calendar_start_month  DATE DEFAULT '2025-06-01',
  calendar_end_month    DATE DEFAULT '2027-03-31',
  sidebar_collapsed     BOOLEAN DEFAULT false,
  email_weekly_digest   BOOLEAN DEFAULT false,
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY — EVERY TABLE
-- ============================================================
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_areas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_entries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_moods        ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinned_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_digests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences   ENABLE ROW LEVEL SECURITY;

-- Profiles: users read/update own row only
CREATE POLICY "profiles: own row" ON profiles FOR ALL USING (auth.uid() = id);

-- Focus areas: full control over own rows
CREATE POLICY "focus_areas: own" ON focus_areas FOR ALL USING (auth.uid() = user_id);

-- Daily entries: own rows
CREATE POLICY "daily_entries: own" ON daily_entries FOR ALL USING (auth.uid() = user_id);

-- Daily moods: own rows
CREATE POLICY "daily_moods: own" ON daily_moods FOR ALL USING (auth.uid() = user_id);

-- Attachments: own rows
CREATE POLICY "attachments: own" ON attachments FOR ALL USING (auth.uid() = user_id);

-- Pinned items: own rows
CREATE POLICY "pinned_items: own" ON pinned_items FOR ALL USING (auth.uid() = user_id);

-- Weekly digests: own rows
CREATE POLICY "weekly_digests: own" ON weekly_digests FOR ALL USING (auth.uid() = user_id);

-- User preferences: own row
CREATE POLICY "user_preferences: own" ON user_preferences FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- UPDATED_AT TRIGGER (apply to all tables with updated_at)
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON focus_areas FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON daily_entries FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

## BACKEND ARCHITECTURE (FastAPI on Render)

### Directory Structure

```
backend/
├── alembic/                  # Database migration history
│   └── versions/
├── app/
│   ├── __init__.py
│   ├── main.py               # App factory, CORS, lifespan
│   ├── config.py             # Pydantic Settings, env var validation
│   ├── database.py           # Async SQLAlchemy engine + session factory
│   │
│   ├── auth/
│   │   ├── dependencies.py   # get_current_user() dependency
│   │   └── schemas.py
│   │
│   ├── routers/
│   │   ├── health.py         # GET /health — used by Render health check
│   │   ├── profile.py        # GET/PUT /me
│   │   ├── focus_areas.py    # CRUD /focus-areas
│   │   ├── entries.py        # CRUD /entries
│   │   ├── moods.py          # /moods
│   │   ├── attachments.py    # /attachments — presigned URL generation
│   │   ├── ai.py             # /ai/summarize, /ai/weekly-digest
│   │   ├── search.py         # /search
│   │   └── pins.py           # /pins
│   │
│   ├── services/
│   │   ├── ai_service.py     # All Anthropic API calls isolated here
│   │   ├── storage_service.py# Supabase Storage interactions
│   │   └── search_service.py # Full-text search query construction
│   │
│   ├── models/
│   │   └── db_models.py      # SQLAlchemy ORM models (mirrors SQL schema)
│   │
│   └── schemas/
│       ├── focus_area.py     # Pydantic request/response schemas
│       ├── entry.py
│       ├── ai.py
│       └── common.py         # PaginatedResponse, ErrorResponse
│
├── tests/
│   ├── conftest.py
│   ├── test_focus_areas.py
│   ├── test_entries.py
│   └── test_ai.py
│
├── .env.example
├── requirements.txt
├── Dockerfile                # For Render deployment
└── render.yaml               # Render service config
```

### config.py — Environment Variables (ALL REQUIRED)

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str  # Never expose to frontend
    SUPABASE_JWT_SECRET: str        # From Supabase dashboard > Settings > API

    # Database (Supabase Postgres direct connection)
    DATABASE_URL: str  # postgresql+asyncpg://...

    # Anthropic
    ANTHROPIC_API_KEY: str

    # App
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"

settings = Settings()
```

### auth/dependencies.py — JWT Verification

```python
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Verifies the Supabase JWT from the Authorization header.
    Returns the decoded payload containing user id, email, etc.
    Raises 401 if token is invalid or expired.
    """
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
```

### Complete API Endpoint Reference

#### Health
```
GET  /health                        → { status: "ok", version: "1.0.0" }
```

#### Profile
```
GET  /me                            → Profile
PUT  /me                            → Profile
GET  /me/preferences                → UserPreferences
PUT  /me/preferences                → UserPreferences
```

#### Focus Areas
```
GET    /focus-areas                 → FocusArea[]  (sorted by display_order)
POST   /focus-areas                 → FocusArea
GET    /focus-areas/{id}            → FocusArea + stats (total_days, last_entry_date, total_words)
PUT    /focus-areas/{id}            → FocusArea
DELETE /focus-areas/{id}            → 204
PUT    /focus-areas/reorder         → { ids: UUID[] }  → 200 (batch reorder)
```

#### Daily Entries
```
GET  /entries?date=YYYY-MM-DD                     → Entry[] (all focus areas for that date)
GET  /entries?focus_area_id=...&limit=20&offset=0 → PaginatedResponse<Entry>
GET  /entries/{id}                                → Entry
POST /entries                                     → Entry  (upsert by user+focus_area+date)
PUT  /entries/{id}                                → Entry
GET  /entries/calendar-heatmap?year=2025&month=6  → [{date, completion_pct, mood}]
```

#### AI
```
POST /ai/summarize          → Body: { entry_id }  → AISummary (saves to DB, returns result)
POST /ai/weekly-digest      → Body: { week_start: "YYYY-MM-DD" } → WeeklyDigest
```

#### Search
```
GET  /search?q=...&focus_area_id=...&date_from=...&date_to=...&limit=20
     → { results: SearchResult[], total: int }
```

#### Moods
```
GET  /moods?month=YYYY-MM   → DailyMood[]
POST /moods                 → DailyMood (upsert by user+date)
```

#### Attachments
```
POST /attachments/presign   → Body: { entry_id, section, file_name, mime_type }
                              → { upload_url, storage_path, attachment_id }
POST /attachments/confirm   → Body: { attachment_id }  → confirms file was uploaded
GET  /attachments/{entry_id}→ Attachment[]
DELETE /attachments/{id}    → 204 + deletes from Supabase Storage
```

#### Pins
```
GET  /pins                  → PinnedItem[] (with entry + focus_area data joined)
POST /pins                  → PinnedItem
DELETE /pins/{id}           → 204
```

### AI Service — Complete Prompts

**Daily Entry Summarize (`ai_service.py`):**

```python
SUMMARIZE_SYSTEM_PROMPT = """
You are a thoughtful personal productivity assistant helping a professional reflect on their day.
Your job is to distill their raw activities and notes into structured, actionable insights.
Be concise, specific, and encouraging — but honest.
Return ONLY valid JSON with no markdown fences, no preamble, no explanation.
"""

SUMMARIZE_USER_PROMPT = """
Focus Area: {focus_area_name}
Date: {entry_date}

ACTIVITIES LOGGED:
{activities_text}

NOTES / REFLECTIONS:
{notes_text}

Analyze the above and return this exact JSON structure:
{{
  "one_liner": "One crisp sentence capturing the essence of today in this focus area",
  "accomplishments": ["Specific thing done or completed", "..."],
  "learnings": ["Key insight, concept, or skill developed", "..."],
  "follow_ups": ["Action item or thing to revisit", "..."],
  "keywords": ["topic1", "topic2", "topic3"]
}}

Rules:
- accomplishments: concrete, past-tense actions (max 5)
- learnings: genuine insights, not restatements of activities (max 5)
- follow_ups: actionable, specific next steps (max 4)
- keywords: 3-5 topic tags for search/discovery
- If activities and notes are empty or minimal, return empty arrays with a supportive one_liner
"""
```

**Weekly Digest (`ai_service.py`):**

```python
WEEKLY_DIGEST_PROMPT = """
You are analyzing a professional's weekly activity log across multiple focus areas.
Generate a meaningful weekly digest that helps them see patterns, celebrate progress, and plan ahead.
Return ONLY valid JSON.

Week: {week_start} to {week_end}
Days logged: {days_logged} / 7

ENTRIES BY FOCUS AREA:
{entries_json}

Return this exact JSON structure:
{{
  "overall_summary": "2-3 sentence overview of the week",
  "momentum_score": <integer 0-100, based on consistency and depth of entries>,
  "highlights_by_area": [
    {{
      "focus_area_id": "...",
      "focus_area_name": "...",
      "days_logged": <int>,
      "summary": "1-2 sentence summary of progress this week",
      "top_insight": "Single best learning or accomplishment"
    }}
  ],
  "top_learnings": ["..."],
  "next_week_suggestions": ["One actionable suggestion per active focus area"]
}}
"""
```

### Error Handling & Response Standards

All API errors must follow this format:
```json
{
  "error": {
    "code": "ENTRY_NOT_FOUND",
    "message": "Daily entry not found for the specified date and focus area",
    "details": {}
  }
}
```

Use these standard error codes:
- `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`
- `AI_SERVICE_ERROR`, `STORAGE_ERROR`, `DATABASE_ERROR`
- `RATE_LIMIT_EXCEEDED` (for AI endpoints — add a simple per-user rate limiter)

---

## FRONTEND ARCHITECTURE (Next.js 14 on Vercel)

### Directory Structure

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   │
│   ├── (app)/
│   │   ├── layout.tsx              # AppShell: Sidebar + TopNav + main content area
│   │   ├── page.tsx                # / → Calendar Home
│   │   ├── focus-areas/
│   │   │   ├── page.tsx            # /focus-areas → Grid of all focus areas
│   │   │   └── [id]/page.tsx       # /focus-areas/[id] → Timeline view
│   │   ├── search/page.tsx         # /search
│   │   └── settings/page.tsx       # /settings → profile + preferences
│   │
│   ├── api/
│   │   └── auth/callback/route.ts  # Supabase OAuth callback handler
│   │
│   ├── globals.css                 # CSS variables + base styles
│   └── layout.tsx                  # Root layout: fonts, providers
│
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── AuthGuard.tsx           # Wraps protected routes
│   │
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopNav.tsx
│   │   └── AppShell.tsx
│   │
│   ├── calendar/
│   │   ├── CalendarGrid.tsx        # Main calendar component
│   │   ├── CalendarCell.tsx        # Individual date cell with completion arc
│   │   ├── CompletionArc.tsx       # SVG radial arc component
│   │   └── CalendarNav.tsx         # Month navigation
│   │
│   ├── daily-log/
│   │   ├── DailyLogDrawer.tsx      # Slide-over drawer containing the full daily log
│   │   ├── FocusAreaTabs.tsx       # Tab bar for each focus area
│   │   ├── ActivitiesTab.tsx
│   │   ├── NotesTab.tsx
│   │   └── AISummaryTab.tsx
│   │
│   ├── editor/
│   │   ├── RichTextEditor.tsx      # Tiptap wrapper
│   │   ├── EditorToolbar.tsx       # Bold/italic/bullets/font/color toolbar
│   │   ├── FontPicker.tsx
│   │   ├── ColorPicker.tsx
│   │   ├── VoiceInputButton.tsx    # Web Speech API integration
│   │   └── AttachmentUploader.tsx
│   │
│   ├── focus-areas/
│   │   ├── FocusAreaCard.tsx       # Card in the grid view
│   │   ├── FocusAreaForm.tsx       # Create/edit modal
│   │   ├── FocusAreaTimeline.tsx   # Detail page timeline
│   │   ├── TimelineEntry.tsx       # Single entry in timeline
│   │   └── EmojiPicker.tsx
│   │
│   ├── ai/
│   │   ├── AISummaryPanel.tsx      # Display + generate button
│   │   └── WeeklyDigestCard.tsx
│   │
│   ├── search/
│   │   ├── SearchModal.tsx         # Cmd+K modal
│   │   └── SearchResultItem.tsx
│   │
│   └── ui/                         # Primitive design system components
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── Drawer.tsx
│       ├── Badge.tsx
│       ├── Avatar.tsx
│       ├── SkeletonLoader.tsx
│       ├── EmptyState.tsx
│       ├── Tooltip.tsx
│       └── Toast.tsx               # Toast notification system
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser Supabase client
│   │   └── server.ts               # Server-side Supabase client (for RSC)
│   ├── api/
│   │   ├── client.ts               # Axios instance with auth interceptor
│   │   ├── focus-areas.ts          # API call functions
│   │   ├── entries.ts
│   │   ├── ai.ts
│   │   ├── search.ts
│   │   └── attachments.ts
│   └── utils/
│       ├── dates.ts                # date-fns helpers, FY calendar bounds
│       ├── tiptap.ts               # Tiptap JSON ↔ plain text helpers
│       └── cn.ts                   # Tailwind class merging utility
│
├── store/
│   ├── useAuthStore.ts             # Zustand: user session
│   ├── useFocusAreaStore.ts        # Zustand: focus areas list
│   ├── useCalendarStore.ts         # Zustand: selected date, heatmap data
│   └── useUIStore.ts               # Zustand: drawer open/close, search modal
│
├── hooks/
│   ├── useEntries.ts               # SWR/React Query for entries
│   ├── useVoiceInput.ts            # Web Speech API hook
│   ├── useFileUpload.ts            # Upload flow with progress
│   └── useDebounce.ts
│
├── types/
│   └── index.ts                    # All TypeScript interfaces mirroring backend schemas
│
├── public/
│   └── illustrations/              # SVG empty state illustrations
│
├── .env.local.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Key Implementation Details

#### 1. Auth Flow (Supabase)

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// lib/api/client.ts — Axios with auto-injected JWT
import axios from 'axios'
import { createClient } from '@/lib/supabase/client'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

apiClient.interceptors.request.use(async (config) => {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

// Auto-refresh on 401
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const supabase = createClient()
      await supabase.auth.refreshSession()
      return apiClient.request(error.config)
    }
    return Promise.reject(error)
  }
)
```

#### 2. Rich Text Editor (Tiptap)

Extensions to include:
- `StarterKit` (bold, italic, lists, headings)
- `TextStyle` + `Color` (font color)
- `FontFamily` (custom fonts)
- `Highlight`
- `Placeholder`
- `CharacterCount`
- `Image` (for pasted images)
- Custom `VoiceInput` mark

Font options available in editor:
```typescript
const EDITOR_FONTS = [
  { label: 'DM Sans', value: 'DM Sans' },
  { label: 'Playfair Display', value: 'Playfair Display' },
  { label: 'Lora', value: 'Lora' },
  { label: 'Merriweather', value: 'Merriweather' },
  { label: 'Source Code Pro', value: 'Source Code Pro' },
  { label: 'JetBrains Mono', value: 'JetBrains Mono' },
]

const EDITOR_COLORS = [
  '#F0EDE6', '#F4A636', '#0FADA0', '#3B82F6',
  '#22C55E', '#EF4444', '#F59E0B', '#8B5CF6',
  '#EC4899', '#6B7280', '#FFFFFF', '#000000',
]
```

#### 3. Voice Input Hook

```typescript
// hooks/useVoiceInput.ts
export function useVoiceInput(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-IN'  // Indian English default, user can override

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('')
      if (event.results[event.results.length - 1].isFinal) {
        onTranscript(transcript)
      }
    }

    recognition.start()
    recognitionRef.current = recognition
    setIsListening(true)
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  return { isListening, startListening, stopListening }
}
```

#### 4. File Upload Flow

```
User clicks Attach
  → Frontend calls POST /attachments/presign
  → Backend generates Supabase Storage presigned upload URL
  → Frontend uploads file directly to Supabase Storage (not through backend)
  → Frontend calls POST /attachments/confirm with attachment_id
  → Backend marks attachment as confirmed
  → Frontend renders thumbnail/file card
```

This pattern keeps large files off the FastAPI server and Render's bandwidth.

#### 5. Calendar Heatmap Cell (SVG Arc)

```typescript
// components/calendar/CompletionArc.tsx
interface CompletionArcProps {
  percentage: number  // 0–100
  size: number        // cell size in px
}

export function CompletionArc({ percentage, size }: CompletionArcProps) {
  const radius = size / 2 - 3
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const arcColor = percentage === 0 ? 'transparent'
    : percentage < 40 ? '#0FADA0'   // teal — low completion
    : percentage < 80 ? '#F4A636'   // amber — mid completion
    : '#FFFFFF'                      // white glow — high completion

  return (
    <svg width={size} height={size} className="absolute inset-0">
      {/* Track */}
      <circle
        cx={size/2} cy={size/2} r={radius}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2"
      />
      {/* Progress arc */}
      <circle
        cx={size/2} cy={size/2} r={radius}
        fill="none" stroke={arcColor} strokeWidth="2"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
      />
    </svg>
  )
}
```

---

## ENVIRONMENT VARIABLES

### Frontend `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=https://focusflow-api.onrender.com
NEXT_PUBLIC_APP_URL=https://focusflow.vercel.app
```

### Backend `.env`
```env
# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase-dashboard

# Database — use the "Direct Connection" string from Supabase
# Format: postgresql+asyncpg://postgres.[ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
DATABASE_URL=postgresql+asyncpg://...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# App
ENVIRONMENT=production
CORS_ORIGINS=["https://focusflow.vercel.app","http://localhost:3000"]
LOG_LEVEL=INFO
```

---

## RENDER DEPLOYMENT CONFIG (`render.yaml`)

```yaml
services:
  - type: web
    name: focusflow-api
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2
    healthCheckPath: /health
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: DATABASE_URL
        sync: false
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: SUPABASE_JWT_SECRET
        sync: false
      - key: ANTHROPIC_API_KEY
        sync: false
      - key: ENVIRONMENT
        value: production
      - key: CORS_ORIGINS
        sync: false
```

---

## SUPABASE SETUP CHECKLIST

Run these steps in order **before** starting the build:

1. **Create project** in Supabase dashboard (region: ap-south-1 Mumbai)
2. **Run the full SQL schema** from the Database section above
3. **Authentication → Providers**: Enable Email and Google OAuth
   - Google: Get Client ID + Secret from Google Cloud Console → OAuth 2.0
   - Set redirect URL: `https://xxxx.supabase.co/auth/v1/callback`
4. **Storage → Create bucket**: `attachments`, set to **private**
5. **Storage → Policies**: Allow authenticated users to read/write their own folder: `user_id/*`
6. **Authentication → URL Configuration**:
   - Site URL: `https://focusflow.vercel.app`
   - Redirect URLs: add `https://focusflow.vercel.app/api/auth/callback`
7. **Settings → API**: Copy `JWT Secret` for backend env var `SUPABASE_JWT_SECRET`

---

## GITHUB ACTIONS CI/CD (`.github/workflows/deploy.yml`)

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: cd backend && pip install -r requirements.txt && pytest tests/ -v

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd frontend && npm ci && npm run type-check && npm run test

  # Render and Vercel deploy automatically on push to main
  # No manual deploy step needed — configure auto-deploy in their dashboards
```

---

## FEATURES SUMMARY TABLE

| # | Feature | Where |
|---|---|---|
| 1 | Email + Google OAuth login/signup | Auth pages |
| 2 | User profile + avatar | Settings |
| 3 | Focus Areas CRUD with emoji + color | Focus Areas page |
| 4 | Drag-to-reorder focus areas | Focus Areas page |
| 5 | Financial year calendar (Jun 25 – Mar 27) | Home |
| 6 | Completion arc heatmap on calendar cells | Calendar |
| 7 | Mood indicator dot on calendar | Calendar |
| 8 | Daily Log drawer per date | Calendar → Drawer |
| 9 | Activities tab with rich text | Daily Log |
| 10 | Notes tab with rich text | Daily Log |
| 11 | Multiple fonts + 12 font colors in editor | Rich Text Editor |
| 12 | Bullet points + numbered lists | Rich Text Editor |
| 13 | Voice-to-text input (microphone button) | Rich Text Editor |
| 14 | File + photo attachment upload | Daily Log |
| 15 | AI Summary tab (Anthropic API) | Daily Log |
| 16 | AI Summary saved + regeneratable | Daily Log |
| 17 | Focus Area detail page (full timeline) | Focus Areas |
| 18 | Pinned notes/entries | Focus Areas detail |
| 19 | Global search (Cmd+K) | Everywhere |
| 20 | Full-text search across all content | Search |
| 21 | Weekly AI Digest | Weekly Digest page |
| 22 | Daily streak tracker | Home dashboard |
| 23 | Focus area target days/week + progress ring | Focus Area card |
| 24 | Dark/light mode toggle | Settings |
| 25 | Skeleton loaders on all async content | Throughout |
| 26 | Mobile responsive layout | Throughout |
| 27 | Empty states with illustrations | Throughout |
| 28 | Toast notification system | Throughout |
| 29 | Export focus area timeline as PDF | Focus Area detail |
| 30 | User preferences (timezone, default font) | Settings |

---

## IMPLEMENTATION ORDER (Follow Exactly)

**Phase 1 — Foundation (Do not skip steps)**
1. Run full SQL schema in Supabase. Verify RLS policies work by testing with two test users.
2. Configure Supabase Auth (email + Google OAuth). Test signup + login manually.
3. FastAPI skeleton: `main.py`, `config.py`, `database.py`, `health.py`. Deploy to Render. Confirm `/health` returns 200.
4. `auth/dependencies.py` — JWT verification. Write a test that rejects an invalid token.
5. Next.js project: install deps, configure `globals.css` with the full CSS variable system, set up Google Fonts, configure Tailwind to use CSS vars.
6. `AppShell` layout: Sidebar + TopNav + content area. All links wired up (even if pages are empty).
7. Auth pages: Login + Signup forms. Google OAuth button. Test full flow end-to-end.

**Phase 2 — Core Data**
8. Focus Areas API (all 6 endpoints) + Frontend CRUD (page, form modal, drag-to-reorder).
9. Calendar component with navigation. Hard-code Jun 2025 – Mar 2027 bounds. No heatmap yet.
10. Daily Log Drawer: opens on date click, shows focus area tabs. No editor yet — just tab structure.
11. Rich Text Editor (Tiptap) with full toolbar (fonts, colors, bullets, headings). Test persistence.
12. Activities + Notes tabs wired to API (upsert on blur / Cmd+S).
13. Calendar heatmap: wire `GET /entries/calendar-heatmap` → render completion arcs per cell.

**Phase 3 — AI + Media**
14. Voice input hook + button in editor toolbar. Test in Chrome.
15. Attachment upload flow (presign → direct upload → confirm). Test with image + PDF.
16. AI Summary tab + `/ai/summarize` endpoint. Test with actual Anthropic key.
17. Weekly Digest (`/ai/weekly-digest` + UI card).

**Phase 4 — Discovery**
18. Focus Area detail timeline page with expandable entries + pinning.
19. Global search (Cmd+K modal + `/search` endpoint with full-text + trigram).
20. PDF export of focus area timeline.

**Phase 5 — Polish**
21. Skeleton loaders on all loading states.
22. Empty states with SVG illustrations on: no focus areas, no entries for a date, no search results.
23. Toast notifications for all create/update/delete/error actions.
24. Mobile responsive audit — every page must work on 375px viewport.
25. Dark/light mode toggle wired to `user_preferences`.
26. Streak tracker calculation + display on home above calendar.
27. CI/CD: GitHub Actions test jobs. Verify auto-deploy on Render + Vercel.
28. Final end-to-end walkthrough: signup → create 3 focus areas → log 5 days → generate AI summary → search → weekly digest → export PDF.

---

## NON-NEGOTIABLE PRODUCTION REQUIREMENTS

Before calling this done, all of the following must be true:

- [ ] No hardcoded secrets anywhere in code
- [ ] All API routes require valid JWT (no unprotected data endpoints)
- [ ] Every database query is scoped by `user_id` (never return another user's data)
- [ ] File uploads go directly to Supabase Storage, not through FastAPI
- [ ] Anthropic API key is backend-only, never in frontend env vars
- [ ] CORS on FastAPI: only allow `NEXT_PUBLIC_APP_URL` and `localhost:3000`
- [ ] All forms have loading states + error messages
- [ ] All API calls have try/catch with user-facing error toasts
- [ ] No `any` types in TypeScript except where genuinely unavoidable
- [ ] Mobile layout tested at 375px (iPhone SE) and 390px (iPhone 14)
- [ ] `/health` endpoint returns 200 within 2s (Render keep-alive)
- [ ] Supabase RLS verified: logged in as User A, cannot read User B's data
