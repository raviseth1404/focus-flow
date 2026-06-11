# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

FocusFlow is a two-service SaaS app:
- **`frontend/`** — Next.js 14 App Router (TypeScript) → deployed to Vercel
- **`backend/`** — FastAPI (Python 3.9, async) → deployed to Render

Database: Supabase PostgreSQL with Row Level Security. Auth: Supabase Auth (JWT). AI: Anthropic API (backend-only).

## Commands

### Backend
```bash
cd backend
pip install -r requirements.txt
python3 -m uvicorn app.main:app --reload   # dev server (port 8000) — use python3 -m, not bare uvicorn
pytest tests/ -v                           # all tests
pytest tests/test_health.py -v            # single test file
pytest tests/ -k "test_health" -v         # single test by name
```

### Frontend
```bash
cd frontend
npm install
npm run dev                            # dev server (port 3000)
npm run build                          # production build
npm run type-check                     # tsc --noEmit (run before commits)
npm run test                           # vitest run (all)
npx vitest run components/ui/__tests__/Button.test.tsx  # single test
```

## Credentials & environment

Both env files are already populated at `backend/.env` and `frontend/.env.local`. Do not overwrite them from the examples.

**Supabase project**: `mkssyfcxgdjypdrlbmka` — region `ap-south-1`  
**Supabase URL**: `https://mkssyfcxgdjypdrlbmka.supabase.co`  
**Database host**: `aws-1-ap-south-1.pooler.supabase.com:5432` (session pooler)

**Known gotcha — DATABASE_URL password encoding**: the password contains `*`, `,`, `#`, `%` which must be percent-encoded if SQLAlchemy raises a connection error on startup. Encoded form:
```
postgresql+asyncpg://postgres.mkssyfcxgdjypdrlbmka:%2A7fh%2CnQpEqG%239m%25@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```

**Local dev URLs**:
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:3000`
- `NEXT_PUBLIC_API_URL` in `frontend/.env.local` is `http://localhost:8000`. Update to the Render URL before deploying to Vercel.

## Architecture

### Auth flow
Every protected backend route uses `Depends(get_current_user)` from `app/auth/dependencies.py`.

**Critical — ES256 JWT**: New Supabase projects sign JWTs with ES256 (asymmetric), not HS256. The backend fetches and caches the JWKS from `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`, matches on `kid`, and verifies with `jwt.algorithms.ECAlgorithm.from_jwk(jwk)`. The `cryptography` package is required for this (`requirements.txt`). Falls back to HS256 with base64-decoded secret for legacy tokens.

The frontend Axios client (`lib/api/client.ts`) injects the Bearer token on every request and retries once on 401 by refreshing the Supabase session. The `middleware.ts` and `AuthGuard` component together manage redirects — middleware handles SSR, AuthGuard handles client-side.

### Backend request path
`app/main.py` (CORS + routers) → `app/routers/*.py` → `app/services/*.py` (AI/storage) + direct SQLAlchemy queries. All DB access is async via `AsyncSession`. Every query that fetches user data **must** scope by `user_id` (RLS is a safety net, not the primary guard).

### Python 3.9 compatibility
The runtime is Python 3.9. **Do not use**:
- `dict | None` / `X | Y` union syntax → use `Optional[X]` or `Union[X, Y]` from `typing`
- `list[X]` as a `response_model` argument is fine (PEP 585, supported in 3.9+)

### Frontend data flow
- **Auth state**: `AuthGuard` (`components/auth/AuthGuard.tsx`) initialises the Supabase listener and populates `useAuthStore`. All `(app)` routes are wrapped by it via `app/(app)/layout.tsx`.
- **API calls**: All backend calls go through `lib/api/client.ts` (Axios). Feature-specific functions in `lib/api/*.ts`. No direct `fetch` calls.
- **State**: Zustand stores in `store/`. `useCalendarStore` owns selected date + heatmap. `useFocusAreaStore` is source of truth for focus areas list. `useUIStore` controls sidebar + search modal.

### Calendar → Daily log flow
1. `CalendarGrid` fetches heatmap (`GET /entries/calendar-heatmap`) and renders `CalendarCell` per day.
2. Clicking a cell calls `useCalendarStore.openDrawer(dateStr)`.
3. `DailyLogDrawer` opens, fetches fresh focus areas + entries for that date, sets them in state.
4. `FocusAreaTabs` owns tab state (activities / notes / ai_summary) and renders `TodoChecklist` + `ActivitiesTab` or `NotesTab`.
5. `ActivitiesTab` / `NotesTab` auto-save via 800ms debounce to `POST /entries` and also expose a manual **Save** button with a "Saving…" / "✓ Saved" indicator.

### Daily entries — upsert semantics
`POST /entries` creates or updates based on the `(user_id, focus_area_id, entry_date)` unique constraint. There is exactly **one entry per focus-area per date**. Notes and activities for the same date are merged into that single entry — never create a second entry for the same date.

### Rich text
Content stored as Tiptap JSON (`JSONB`). Plain text derived client-side and also computed server-side for full-text search (`activities_plain_text`, `notes_plain_text`). Always derive plain text from JSON — never send it separately.

### Focus area daily to-dos
`focus_areas.todo_items` (JSONB `string[]`) defines the template checklist shown every day. `daily_entries.todo_completions` (JSONB `{item: bool}`) stores per-day completion state. Toggling a checkbox hits `PATCH /entries/{id}/todos`. `TodoChecklist` creates the entry first (upsert with no content) if it doesn't exist yet, then patches todos.

### Note pinning
`daily_entries.is_pinned` (boolean, default false). Toggle via `PATCH /entries/{id}/pin`. Pinned notes float to the top on the focus area detail page.

### Focus area detail page (`/focus-areas/[id]`)
Shows notes-only timeline (entries filtered to those with `notes != null`). Pinned notes always shown first. "New Note" modal detects if an entry already exists for the selected date and pre-loads its content so subsequent edits append rather than overwrite.

### File uploads
Direct-to-storage: `POST /attachments/presign` → upload to Supabase Storage signed URL → `POST /attachments/confirm`. Files never touch the FastAPI server.

### AI summarisation
`POST /ai/summarize` reads entry from DB, calls `ai_service.summarize_entry()` (Anthropic API), saves result to `daily_entries.ai_summary` (JSONB). In-process per-user rate limiter: 20 calls/hour.

## Key conventions

- **Route groups**: `app/(auth)/` for login/signup (no sidebar), `app/(app)/` for authenticated pages (with AppShell + AuthGuard).
- **CSS variables**: all colours from CSS vars in `app/globals.css`. Use `var(--color-*)`. Never hardcode hex colours that duplicate a design token.
- **No `any` types**: use `Record<string, unknown>` for Tiptap JSON content.
- **Calendar bounds**: `CALENDAR_START = 2025-06-01`, `CALENDAR_END = 2027-03-31` — enforced in `lib/utils/dates.ts` and `CalendarNav`.
- **Date strings**: always build date strings as `${date.getFullYear()}-${...getMonth()+1...}-${...getDate()...}` (local time). Never use `date.toISOString()` — it converts to UTC and causes off-by-one for users in UTC+ timezones.
- **Modal scroll**: the `Modal` component caps card height at `max-h-[90vh]` with a scrollable body. Any long list inside a modal (e.g. todo items) should also add its own `max-h-* overflow-y-auto` container so items are visible without relying solely on outer modal scroll.
- **PaginatedResponse serialization**: when returning SQLAlchemy objects inside a generic Pydantic model, call `.model_validate()` explicitly: `[EntryResponse.model_validate(item) for item in items]`.
- **Force form re-mount on open**: use `key={isOpen ? editingId ?? 'new' : 'closed'}` on modal form components to reset `useState` when switching between create/edit modes.
