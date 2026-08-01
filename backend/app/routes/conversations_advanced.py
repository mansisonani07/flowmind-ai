"""
Advanced conversation endpoints.
Provides reply (Twilio mock), sentiment/category analysis, and report generation.
"""

import json
import time
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.utils.logger import logger

router = APIRouter()


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class ReplyRequest(BaseModel):
    conversation_id: str = Field(..., description="The conversation/phone number to reply to")
    message: str = Field(..., min_length=1, max_length=2000, description="The reply message to send")


class ReplyResponse(BaseModel):
    status: str
    conversation_id: str
    message: str
    sent_at: str
    channel: str = "twilio"
    note: str = Field(default="Mock send — no actual Twilio API call", description="Indicates mock mode")


class AnalyzeRequest(BaseModel):
    conversations: List[Dict[str, Any]] = Field(
        ...,
        description="List of conversations to analyze. Each should have at least a 'question' field.",
    )


class AnalyzedConversation(BaseModel):
    question: str
    answer: Optional[str] = None
    sentiment: str = Field(..., description="One of: positive, neutral, negative")
    category: str = Field(..., description="One of: sales, support, info, complaint")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence in the classification")


class AnalyzeResponse(BaseModel):
    analyzed: List[AnalyzedConversation]
    total: int
    summary: Dict[str, int] = Field(default_factory=dict, description="Count of each sentiment")


class ReportRequest(BaseModel):
    period_days: int = Field(default=7, ge=1, le=90, description="Report period in days")


class ReportMetric(BaseModel):
    label: str
    value: Any
    trend: Optional[str] = Field(default=None, description="up/down/stable")


class ReportSection(BaseModel):
    title: str
    metrics: List[ReportMetric]
    details: Optional[str] = None


class ReportResponse(BaseModel):
    report_id: str
    title: str
    period_days: int
    generated_at: str
    sections: List[ReportSection]
    summary: str


# ---------------------------------------------------------------------------
# Analysis system prompt
# ---------------------------------------------------------------------------

_ANALYSIS_SYSTEM_PROMPT = """You are FlowMind AI's conversation analysis engine. For each conversation provided, classify it with:

1. **sentiment**: One of "positive", "neutral", "negative"
   - positive: happy, grateful, satisfied, enthusiastic
   - negative: angry, frustrated, disappointed, urgent complaints
   - neutral: factual, informational, indifferent

2. **category**: One of "sales", "support", "info", "complaint"
   - sales: pricing, purchasing, orders, plans, deals
   - support: troubleshooting, returns, account issues, technical help
   - info: hours, location, general questions, FAQs
   - complaint: expressing dissatisfaction, demanding action

3. **confidence**: A float from 0.0 to 1.0 indicating your certainty in the classification

Return ONLY a valid JSON array, no other text. Each object must have: sentiment, category, confidence.

Example:
[
  {"sentiment": "positive", "category": "sales", "confidence": 0.92},
  {"sentiment": "negative", "category": "complaint", "confidence": 0.85}
]
"""


# ---------------------------------------------------------------------------
# Report generation system prompt
# ---------------------------------------------------------------------------

_REPORT_SYSTEM_PROMPT = """You are FlowMind AI's report generation engine. Based on the conversation data provided, generate a structured summary report.

Return ONLY a valid JSON object with this exact structure:
{
  "summary": "2-3 sentence executive summary of the period",
  "sections": [
    {
      "title": "Section Title (e.g. 'Query Volume Overview')",
      "metrics": [
        {"label": "Metric Name", "value": 42, "trend": "up"},
        {"label": "Another Metric", "value": "87%", "trend": "stable"}
      ],
      "details": "Optional longer description of this section"
    }
  ]
}

Generate 3-5 sections. Metrics should use numbers or percentage strings. Trends are "up", "down", or "stable".
"""


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/conversations/{conversation_id}/reply", response_model=ReplyResponse)
async def reply_to_conversation(
    conversation_id: str,
    body: ReplyRequest,
) -> ReplyResponse:
    """
    Send a reply to a conversation via Twilio (currently mocked).

    Logs the reply for audit purposes. In production, this would call
    the Twilio API to send an SMS/WhatsApp message.
    """
    now = datetime.now(timezone.utc).isoformat()
    logger.info(
        f"Reply (mock) to conversation {conversation_id}: "
        f"message='{body.message[:100]}...' "
    )

    # In production, we would call Twilio here:
    # from twilio.rest import Client
    # client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    # message = client.messages.create(body=body.message, from_=settings.TWILIO_PHONE, to=conversation_id)

    return ReplyResponse(
        status="sent",
        conversation_id=conversation_id,
        message=body.message,
        sent_at=now,
        channel="twilio",
        note="Mock send — no actual Twilio API call",
    )


@router.post("/conversations/analyze", response_model=AnalyzeResponse)
async def analyze_conversations(
    request: Request,
    body: AnalyzeRequest,
) -> AnalyzeResponse:
    """
    Analyze a batch of conversations for sentiment and category using Groq.

    Each conversation in the input should have at least a "question" field.
    Returns each conversation enriched with sentiment, category, and confidence.
    """
    if not body.conversations:
        raise HTTPException(status_code=400, detail="No conversations provided for analysis")

    rag = request.app.state.rag_engine

    # Build prompt
    conversation_texts = []
    for conv in body.conversations:
        q = conv.get("question", "N/A")
        a = conv.get("answer", "")
        conversation_texts.append(f"Q: {q}\nA: {a if a else '(no answer)'}")

    user_prompt = (
        f"Analyze {len(conversation_texts)} conversations:\n\n"
        + "\n---\n".join(conversation_texts)
        + "\n\nReturn a JSON array of classifications."
    )

    # Call Groq
    try:
        response = rag.groq_client._client.chat.completions.create(
            model=rag.groq_client._model,
            messages=[
                {"role": "system", "content": _ANALYSIS_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            max_tokens=2048,
        )
        raw = response.choices[0].message.content.strip() if response.choices else "[]"
    except Exception as exc:
        logger.error(f"Groq analysis failed: {exc}")
        # Fallback: return neutral for all
        analyzed = [
            AnalyzedConversation(
                question=c.get("question", ""),
                answer=c.get("answer"),
                sentiment="neutral",
                category="info",
                confidence=0.5,
            )
            for c in body.conversations
        ]
        return AnalyzeResponse(analyzed=analyzed, total=len(analyzed), summary={"neutral": len(analyzed)})

    # Parse response
    classifications = _parse_json_array(raw)

    analyzed = []
    sentiment_counts: Dict[str, int] = {}
    for i, conv in enumerate(body.conversations):
        if i < len(classifications):
            cls = classifications[i]
            sentiment = cls.get("sentiment", "neutral")
            category = cls.get("category", "info")
            confidence = cls.get("confidence", 0.5)
        else:
            sentiment = "neutral"
            category = "info"
            confidence = 0.5

        # Validate fields
        if sentiment not in ("positive", "neutral", "negative"):
            sentiment = "neutral"
        if category not in ("sales", "support", "info", "complaint"):
            category = "info"
        confidence = max(0.0, min(1.0, float(confidence)))

        analyzed.append(AnalyzedConversation(
            question=conv.get("question", ""),
            answer=conv.get("answer"),
            sentiment=sentiment,
            category=category,
            confidence=round(confidence, 4),
        ))
        sentiment_counts[sentiment] = sentiment_counts.get(sentiment, 0) + 1

    return AnalyzeResponse(
        analyzed=analyzed,
        total=len(analyzed),
        summary=sentiment_counts,
    )


@router.post("/reports/generate", response_model=ReportResponse)
async def generate_report(
    request: Request,
    body: ReportRequest,
) -> ReportResponse:
    """
    Generate a summary report for the specified period.

    Fetches conversation data from the sheets logger for the given period,
    analyzes it with Groq, and returns structured data for frontend rendering.
    """
    rag = request.app.state.rag_engine
    report_id = str(uuid.uuid4())

    # Fetch conversation data
    try:
        all_conversations = rag.sheets_logger.get_recent_conversations(limit=500)
    except Exception:
        all_conversations = []

    cutoff = (datetime.now(timezone.utc) - timedelta(days=body.period_days)).isoformat()
    period_conversations = [c for c in all_conversations if c.get("timestamp", "") >= cutoff]

    # Build data summary for Groq
    total = len(period_conversations)
    confidences = []
    escalations = 0
    question_keywords: Dict[str, int] = {}
    response_times = []

    for c in period_conversations:
        try:
            confidences.append(float(c.get("confidence", 0)))
        except (ValueError, TypeError):
            pass
        if str(c.get("escalated", "")).lower() in ("true", "1", "yes"):
            escalations += 1
        try:
            response_times.append(float(c.get("response_time_ms", 0)))
        except (ValueError, TypeError):
            pass
        q = c.get("question", "").lower()
        for keyword in ("price", "hours", "return", "shipping", "support", "contact"):
            if keyword in q:
                question_keywords[keyword] = question_keywords.get(keyword, 0) + 1

    avg_conf = round(sum(confidences) / len(confidences), 2) if confidences else 0
    avg_rt = round(sum(response_times) / len(response_times), 2) if response_times else 0
    esc_rate = round(escalations / total * 100, 1) if total else 0

    # Build prompt with structured data
    data_summary = json.dumps({
        "total_queries": total,
        "avg_confidence": avg_conf,
        "escalation_rate": esc_rate,
        "avg_response_time_ms": avg_rt,
        "topic_keywords": question_keywords,
        "period_days": body.period_days,
    }, indent=2)

    user_prompt = (
        f"Generate a report for the past {body.period_days} days.\n\n"
        f"Conversation data summary:\n{data_summary}\n\n"
        f"Return a JSON report object."
    )

    try:
        response = rag.groq_client._client.chat.completions.create(
            model=rag.groq_client._model,
            messages=[
                {"role": "system", "content": _REPORT_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=2048,
        )
        raw = response.choices[0].message.content.strip() if response.choices else "{}"
    except Exception as exc:
        logger.error(f"Report generation failed: {exc}")
        # Fallback report
        return ReportResponse(
            report_id=report_id,
            title=f"FlowMind AI Report — {body.period_days} Day Summary",
            period_days=body.period_days,
            generated_at=datetime.now(timezone.utc).isoformat(),
            sections=[
                ReportSection(
                    title="Overview",
                    metrics=[
                        ReportMetric(label="Total Queries", value=total, trend="stable"),
                        ReportMetric(label="Avg Confidence", value=f"{avg_conf}%", trend="stable"),
                        ReportMetric(label="Escalation Rate", value=f"{esc_rate}%", trend="stable"),
                        ReportMetric(label="Avg Response Time", value=f"{avg_rt}ms", trend="stable"),
                    ],
                ),
            ],
            summary=f"During the past {body.period_days} days, {total} queries were processed.",
        )

    # Parse report
    report_data = _parse_json_object(raw)
    summary_text = report_data.get("summary", f"Report for the past {body.period_days} days.")
    sections_raw = report_data.get("sections", [])

    sections: List[ReportSection] = []
    for sec in sections_raw:
        try:
            metrics = [
                ReportMetric(
                    label=m.get("label", ""),
                    value=m.get("value", ""),
                    trend=m.get("trend"),
                )
                for m in sec.get("metrics", [])
            ]
            sections.append(ReportSection(
                title=sec.get("title", "Untitled Section"),
                metrics=metrics,
                details=sec.get("details"),
            ))
        except Exception:
            continue

    if not sections:
        sections.append(ReportSection(
            title="Overview",
            metrics=[
                ReportMetric(label="Total Queries", value=total, trend="stable"),
                ReportMetric(label="Avg Confidence", value=f"{avg_conf}%", trend="stable"),
                ReportMetric(label="Escalation Rate", value=f"{esc_rate}%", trend="stable"),
            ],
        ))

    return ReportResponse(
        report_id=report_id,
        title=f"FlowMind AI Report — {body.period_days} Day Summary",
        period_days=body.period_days,
        generated_at=datetime.now(timezone.utc).isoformat(),
        sections=sections,
        summary=summary_text,
    )


# ---------------------------------------------------------------------------
# JSON parsing helpers
# ---------------------------------------------------------------------------

def _parse_json_array(raw: str) -> List[Dict[str, Any]]:
    """Parse a JSON array from potentially messy LLM output."""
    content = raw.strip()
    if content.startswith("```"):
        lines = content.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        content = "\n".join(lines)

    start = content.find("[")
    end = content.rfind("]")
    if start != -1 and end > start:
        content = content[start:end + 1]

    try:
        parsed = json.loads(content)
        if isinstance(parsed, list):
            return parsed
    except json.JSONDecodeError:
        pass

    return []


def _parse_json_object(raw: str) -> Dict[str, Any]:
    """Parse a JSON object from potentially messy LLM output."""
    content = raw.strip()
    if content.startswith("```"):
        lines = content.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        content = "\n".join(lines)

    start = content.find("{")
    end = content.rfind("}")
    if start != -1 and end > start:
        content = content[start:end + 1]

    try:
        parsed = json.loads(content)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass

    return {}
