import json
import anthropic
from app.config import settings

client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
MODEL = "claude-3-haiku-20240307"

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


async def summarize_entry(
    focus_area_name: str,
    entry_date: str,
    activities_text: str,
    notes_text: str,
) -> dict:
    prompt = SUMMARIZE_USER_PROMPT.format(
        focus_area_name=focus_area_name,
        entry_date=entry_date,
        activities_text=activities_text or "(none)",
        notes_text=notes_text or "(none)",
    )

    message = await client.messages.create(
        model=MODEL,
        max_tokens=1024,
        system=SUMMARIZE_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    return json.loads(raw)


async def generate_weekly_digest(
    week_start: str,
    week_end: str,
    days_logged: int,
    entries_data: list[dict],
) -> dict:
    prompt = WEEKLY_DIGEST_PROMPT.format(
        week_start=week_start,
        week_end=week_end,
        days_logged=days_logged,
        entries_json=json.dumps(entries_data, indent=2),
    )

    message = await client.messages.create(
        model=MODEL,
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    return json.loads(raw)
