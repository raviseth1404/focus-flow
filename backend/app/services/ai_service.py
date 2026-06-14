import json
import anthropic
from app.config import settings

client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
MODEL = "claude-sonnet-4-5"

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
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


async def summarize_focus_area_notes(
    focus_area_name: str,
    notes_text: str,
    total_notes: int,
) -> str:
    prompt = f"""You are summarizing all journal notes for a focus area called "{focus_area_name}".
There are {total_notes} notes in total. Here they are chronologically:

{notes_text}

Write a clear, insightful summary (3-5 paragraphs) that:
- Captures the overall journey and progress
- Highlights key themes, learnings, and patterns
- Notes important milestones or breakthroughs
- Suggests what to focus on going forward

Write in second person ("You have...", "Your notes show..."). Be specific and reference actual content from the notes."""

    message = await client.messages.create(
        model=MODEL,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text.strip()


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
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())
