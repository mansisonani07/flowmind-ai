"""
AI Insights endpoint.
Analyzes recent conversation data and generates actionable business insights.
"""

import json
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

from app.utils.logger import logger

router = APIRouter()


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class AIInsight(BaseModel):
    id: str
    type: str = Field(..., description="One of: trend, alert, recommendation")
    icon: str = Field(..., description="Emoji or icon identifier")
    title: str
    description: str
    action: Optional[str] = None
    actionLabel: Optional[str] = None


class InsightsResponse(BaseModel):
    insights: List[AIInsight]
    generated_at: str
    source: str = Field(..., description="Where the insights came from: conversations or sample")


# ---------------------------------------------------------------------------
# Sample insights fallback
# ---------------------------------------------------------------------------

_SAMPLE_INSIGHTS: List[Dict[str, Any]] = [
    {
        "type": "trend",
        "icon": "📈",
        "title": "Query volume increasing",
        "description": "Customer queries have increased 23% over the past 7 days, peaking during weekday afternoons between 2-4 PM.",
        "action": "/analytics",
        "actionLabel": "View Analytics",
    },
    {
        "type": "alert",
        "icon": "⚠️",
        "title": "High escalation rate detected",
        "description": "15% of recent queries were escalated due to low confidence. Consider uploading more documentation for common topics.",
        "action": "/documents",
        "actionLabel": "Upload Documents",
    },
    {
        "type": "recommendation",
        "icon": "💡",
        "title": "Expand FAQ coverage",
        "description": "The top 3 most asked questions this week are: pricing, business hours, and return policy. Add dedicated FAQs for these.",
    },
    {
        "type": "trend",
        "icon": "🎯",
        "title": "High satisfaction with product info",
        "description": "Queries about product features have a 94% confidence rate with very few escalations. Knowledge base is strong here.",
    },
    {
        "type": "recommendation",
        "icon": "🔄",
        "title": "Schedule daily summary review",
        "description": "Set up a daily 9 PM summary to stay on top of conversation trends and catch emerging customer concerns early.",
    },
]


# ---------------------------------------------------------------------------
# Prompt builder
# ---------------------------------------------------------------------------

_INSIGHTS_SYSTEM_PROMPT = """You are FlowMind AI's analytics engine. Analyze the provided conversation data and generate actionable business insights.

For each insight, classify it as one of:
- "trend" — A pattern or trend in customer behavior
- "alert" — Something that needs immediate attention
- "recommendation" — A suggestion for improvement

For each insight provide:
- "icon": An appropriate single emoji (📊, 📈, ⚠️, 💡, 🎯, 🔥, 📉, 🔄, ✅, ❌)
- "title": A short, clear title (5-8 words)
- "description": A detailed explanation (2-3 sentences)
- "action": (optional) A URL path for the user to navigate to (e.g. "/documents", "/analytics")
- "actionLabel": (optional) Label for the action button

Generate 3-6 insights based on the data. If data is sparse, still provide useful general recommendations.

Return ONLY a valid JSON array of insight objects, no other text. Each object must have: type, icon, title, description. action and actionLabel are optional.

Example format:
[
  {"type": "trend", "icon": "📈", "title": "...", "description": "..."},
  {"type": "alert", "icon": "⚠️", "title": "...", "description": "...", "action": "/documents", "actionLabel": "Upload Documents"}
]
"""


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("/insights/generate", response_model=InsightsResponse)
async def generate_insights(request: Request) -> InsightsResponse:
    """
    Generate AI-powered insights from recent conversations.

    Pulls the last 7 days of conversation data from the sheets logger,
    sends it to Groq for analysis, and returns structured insight objects.
    Falls back to sample insights if no data is available or parsing fails.
    """
    rag = request.app.state.rag_engine
    start_time = time.time()

    # --- Fetch recent conversations ---
    try:
        recent = rag.sheets_logger.get_recent_conversations(limit=100)
    except Exception as exc:
        logger.warning(f"Failed to fetch conversations for insights: {exc}")
        recent = []

    # Filter to last 7 days
    seven_days_ago = datetime.now(timezone.utc).isoformat()[:10]
    recent_week = [c for c in recent if c.get("timestamp", "") >= seven_days_ago]

    if not recent_week:
        logger.info("No conversation data in last 7 days — returning sample insights")
        insights = [AIInsight(id=str(uuid.uuid4()), **s) for s in _SAMPLE_INSIGHTS]
        return InsightsResponse(
            insights=insights,
            generated_at=datetime.now(timezone.utc).isoformat(),
            source="sample",
        )

    # --- Build prompt for Groq ---
    conversation_summary = []
    for conv in recent_week[:50]:
        conversation_summary.append(
            f"- Q: {conv.get('question', 'N/A')} | "
            f"Confidence: {conv.get('confidence', 0)} | "
            f"Escalated: {conv.get('escalated', False)} | "
            f"Response time: {conv.get('response_time_ms', 0)}ms"
        )

    user_prompt = (
        f"Analyze these {len(conversation_summary)} recent customer conversations:\n\n"
        + "\n".join(conversation_summary)
        + "\n\nGenerate insights as a JSON array."
    )

    # --- Call Groq ---
    try:
        response = rag.groq_client._client.chat.completions.create(
            model=rag.groq_client._model,
            messages=[
                {"role": "system", "content": _INSIGHTS_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.4,
            max_tokens=1024,
        )
        raw_content = response.choices[0].message.content.strip() if response.choices else ""
    except Exception as exc:
        logger.error(f"Groq insights generation failed: {exc}")
        insights = [AIInsight(id=str(uuid.uuid4()), **s) for s in _SAMPLE_INSIGHTS]
        return InsightsResponse(
            insights=insights,
            generated_at=datetime.now(timezone.utc).isoformat(),
            source="sample (Groq error)",
        )

    # --- Parse Groq response ---
    insights = _parse_insights(raw_content)

    elapsed = round(time.time() - start_time, 2)
    logger.info(f"Insights generated: {len(insights)} insights in {elapsed}s")

    return InsightsResponse(
        insights=insights,
        generated_at=datetime.now(timezone.utc).isoformat(),
        source="conversations" if insights else "sample",
    )


def _parse_insights(raw: str) -> List[AIInsight]:
    """
    Parse Groq's response into a list of AIInsight objects.
    Handles various JSON formats and extracts arrays from markdown code blocks.
    """
    # Try to extract JSON array from markdown code blocks
    content = raw.strip()
    if content.startswith("```"):
        lines = content.split("\n")
        # Remove first line (```json or ```) and last line (```)
        lines = [l for l in lines if not l.strip().startswith("```")]
        content = "\n".join(lines)

    # Try to find a JSON array in the content
    bracket_start = content.find("[")
    bracket_end = content.rfind("]")
    if bracket_start != -1 and bracket_end != -1 and bracket_end > bracket_start:
        content = content[bracket_start:bracket_end + 1]

    try:
        parsed = json.loads(content)
    except json.JSONDecodeError as exc:
        logger.warning(f"Failed to parse insights JSON: {exc}")
        return [AIInsight(id=str(uuid.uuid4()), **s) for s in _SAMPLE_INSIGHTS]

    if not isinstance(parsed, list):
        logger.warning(f"Insights response is not a list: {type(parsed)}")
        return [AIInsight(id=str(uuid.uuid4()), **s) for s in _SAMPLE_INSIGHTS]

    insights: List[AIInsight] = []
    for item in parsed:
        try:
            if not isinstance(item, dict):
                continue
            # Validate type field
            insight_type = item.get("type", "recommendation")
            if insight_type not in ("trend", "alert", "recommendation"):
                insight_type = "recommendation"

            insight = AIInsight(
                id=item.get("id", str(uuid.uuid4())),
                type=insight_type,
                icon=item.get("icon", "💡"),
                title=item.get("title", "Untitled Insight"),
                description=item.get("description", ""),
                action=item.get("action"),
                actionLabel=item.get("actionLabel"),
            )
            insights.append(insight)
        except Exception as exc:
            logger.warning(f"Skipping invalid insight: {exc}")
            continue

    # If we parsed nothing, fall back to samples
    if not insights:
        insights = [AIInsight(id=str(uuid.uuid4()), **s) for s in _SAMPLE_INSIGHTS]

    return insights
