"""
Cost tracking endpoints.
Monitors token usage across queries and calculates cost estimates
using Groq's Llama 3.3 70B pricing model.

Pricing (Groq — Llama 3.3 70B Versatile):
  - Input:  $0.05 / 1M tokens
  - Output: $0.08 / 1M tokens
"""

import time
import uuid
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

from app.utils.logger import logger

router = APIRouter()

# ---------------------------------------------------------------------------
# Pricing constants
# ---------------------------------------------------------------------------
INPUT_COST_PER_M = 0.05   # $0.05 per 1M input tokens
OUTPUT_COST_PER_M = 0.08  # $0.08 per 1M output tokens
FREE_TIER_TOKENS = 1_000_000  # 1M free tokens per month

# ---------------------------------------------------------------------------
# In-memory token usage tracking
# ---------------------------------------------------------------------------
_usage_log: List[Dict[str, Any]] = []


def record_token_usage(
    input_tokens: int,
    output_tokens: int,
    total_tokens: int,
    user_phone: str = "unknown",
    endpoint: str = "query",
) -> Dict[str, Any]:
    """
    Record a query's token usage. Call this from other routes.

    Returns the recorded entry for chaining.
    """
    entry = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": total_tokens,
        "user_phone": user_phone,
        "endpoint": endpoint,
        "input_cost": round(input_tokens * INPUT_COST_PER_M / 1_000_000, 6),
        "output_cost": round(output_tokens * OUTPUT_COST_PER_M / 1_000_000, 6),
        "total_cost": round(
            (input_tokens * INPUT_COST_PER_M + output_tokens * OUTPUT_COST_PER_M) / 1_000_000,
            6,
        ),
    }
    _usage_log.append(entry)
    return entry


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class DailyCostPoint(BaseModel):
    date: str
    cost: float
    tokens: int


class FeatureBreakdown(BaseModel):
    query: float
    playground: float
    insights: float
    other: float


class TopUser(BaseModel):
    user_phone: str
    total_tokens: int
    total_cost: float
    query_count: int


class CostSummary(BaseModel):
    tokens_today: int
    tokens_week: int
    tokens_month: int
    cost_today: float
    cost_week: float
    cost_month: float
    cost_per_query: float
    projected_monthly: float
    daily_cost_trend: List[DailyCostPoint]
    top_users: List[TopUser]
    feature_breakdown: FeatureBreakdown
    free_tier_usage: float = Field(..., description="Percentage of free tier consumed (0-100)")
    total_queries: int


class CostDetailEntry(BaseModel):
    id: str
    timestamp: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    user_phone: str
    endpoint: str
    input_cost: float
    output_cost: float
    total_cost: float


class CostDetailedResponse(BaseModel):
    entries: List[CostDetailEntry]
    total: int


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _now() -> datetime:
    return datetime.now(timezone.utc)


def _filter_by_window(entries: List[Dict], days: int) -> List[Dict]:
    cutoff = (_now() - timedelta(days=days)).isoformat()
    return [e for e in entries if e.get("timestamp", "") >= cutoff]


def _get_mock_summary() -> CostSummary:
    """Return realistic mock data when no real usage exists."""
    today = _now().date().isoformat()
    daily_trend = []
    for i in range(7):
        d = (_now() - timedelta(days=6 - i)).date().isoformat()
        daily_trend.append(DailyCostPoint(
            date=d,
            cost=round(0.02 + i * 0.005, 4),
            tokens=3500 + i * 800,
        ))

    return CostSummary(
        tokens_today=4200,
        tokens_week=28500,
        tokens_month=112000,
        cost_today=round(4200 * 0.065 / 1_000_000, 6),
        cost_week=round(28500 * 0.065 / 1_000_000, 6),
        cost_month=round(112000 * 0.065 / 1_000_000, 6),
        cost_per_query=round(0.065 * 200 / 1_000_000, 6),
        projected_monthly=round(112000 * 0.065 / 1_000_000 * 2.5, 6),
        daily_cost_trend=daily_trend,
        top_users=[
            TopUser(user_phone="+1234567890", total_tokens=8500, total_cost=0.000553, query_count=42),
            TopUser(user_phone="+0987654321", total_tokens=5200, total_cost=0.000338, query_count=28),
            TopUser(user_phone="+5551234567", total_tokens=3100, total_cost=0.000202, query_count=15),
        ],
        feature_breakdown=FeatureBreakdown(
            query=0.00085,
            playground=0.00035,
            insights=0.00020,
            other=0.00005,
        ),
        free_tier_usage=round(112000 / FREE_TIER_TOKENS * 100, 1),
        total_queries=85,
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/costs/summary", response_model=CostSummary)
async def get_cost_summary(request: Request) -> CostSummary:
    """
    Get a summary of token usage and costs.

    Calculates today/week/month aggregates, projected monthly spend,
    daily cost trend, top users, feature breakdown, and free tier usage.
    Returns realistic mock data if no real usage has been recorded.
    """
    if not _usage_log:
        return _get_mock_summary()

    today_entries = _filter_by_window(_usage_log, 1)
    week_entries = _filter_by_window(_usage_log, 7)
    month_entries = _filter_by_window(_usage_log, 30)

    tokens_today = sum(e["total_tokens"] for e in today_entries)
    tokens_week = sum(e["total_tokens"] for e in week_entries)
    tokens_month = sum(e["total_tokens"] for e in month_entries)

    cost_today = sum(e["total_cost"] for e in today_entries)
    cost_week = sum(e["total_cost"] for e in week_entries)
    cost_month = sum(e["total_cost"] for e in month_entries)

    total_queries = len(month_entries) if month_entries else 1
    cost_per_query = cost_month / total_queries

    # Projected monthly: extrapolate from days elapsed in current month
    day_of_month = _now().day
    if day_of_month > 0:
        projected_monthly = cost_month * (30 / day_of_month)
    else:
        projected_monthly = cost_month

    # Daily cost trend (last 7 days)
    daily_cost_trend: List[DailyCostPoint] = []
    for i in range(7):
        d = (_now() - timedelta(days=6 - i)).date().isoformat()
        day_entries = [e for e in _usage_log if e.get("timestamp", "")[:10] == d]
        daily_cost_trend.append(DailyCostPoint(
            date=d,
            cost=round(sum(e["total_cost"] for e in day_entries), 6),
            tokens=sum(e["total_tokens"] for e in day_entries),
        ))

    # Top users
    user_agg: Dict[str, Dict[str, Any]] = defaultdict(lambda: {"tokens": 0, "cost": 0.0, "count": 0})
    for e in month_entries:
        phone = e.get("user_phone", "unknown")
        user_agg[phone]["tokens"] += e["total_tokens"]
        user_agg[phone]["cost"] += e["total_cost"]
        user_agg[phone]["count"] += 1

    top_users = sorted(
        [TopUser(user_phone=k, total_tokens=v["tokens"], total_cost=round(v["cost"], 6), query_count=v["count"])
         for k, v in user_agg.items()],
        key=lambda x: -x.total_tokens,
    )[:10]

    # Feature breakdown by endpoint
    endpoint_costs: Dict[str, float] = defaultdict(float)
    for e in month_entries:
        ep = e.get("endpoint", "other")
        endpoint_costs[ep] += e["total_cost"]

    feature_breakdown = FeatureBreakdown(
        query=round(endpoint_costs.get("query", 0.0), 6),
        playground=round(endpoint_costs.get("playground", 0.0), 6),
        insights=round(endpoint_costs.get("insights", 0.0), 6),
        other=round(sum(v for k, v in endpoint_costs.items() if k not in ("query", "playground", "insights")), 6),
    )

    free_tier_usage = round(min(tokens_month / FREE_TIER_TOKENS * 100, 100.0), 1)

    return CostSummary(
        tokens_today=tokens_today,
        tokens_week=tokens_week,
        tokens_month=tokens_month,
        cost_today=round(cost_today, 6),
        cost_week=round(cost_week, 6),
        cost_month=round(cost_month, 6),
        cost_per_query=round(cost_per_query, 6),
        projected_monthly=round(projected_monthly, 6),
        daily_cost_trend=daily_cost_trend,
        top_users=top_users,
        feature_breakdown=feature_breakdown,
        free_tier_usage=free_tier_usage,
        total_queries=len(month_entries),
    )


@router.get("/costs/detailed", response_model=CostDetailedResponse)
async def get_cost_detailed(
    limit: int = 50,
    offset: int = 0,
    endpoint: Optional[str] = None,
) -> CostDetailedResponse:
    """
    Get a paginated list of per-query cost breakdowns.

    Query params:
    - limit: Number of entries to return (default 50, max 200)
    - offset: Number of entries to skip (for pagination)
    - endpoint: Filter by endpoint name (optional)
    """
    limit = min(limit, 200)
    entries = _usage_log

    if endpoint:
        entries = [e for e in entries if e.get("endpoint") == endpoint]

    total = len(entries)
    # Return most recent first
    paginated = list(reversed(entries[offset:offset + limit]))

    return CostDetailedResponse(
        entries=[CostDetailEntry(**e) for e in paginated],
        total=total,
    )
