"""
Notification endpoints.
Manages in-app notifications for the FlowMind AI dashboard.
Uses in-memory storage with seed data for demo purposes.
"""

import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.utils.logger import logger

router = APIRouter()


# ---------------------------------------------------------------------------
# In-memory storage
# ---------------------------------------------------------------------------
_notifications: List[Dict[str, Any]] = []


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class NotificationCreate(BaseModel):
    type: str = Field(default="info", description="Notification type: info, warning, success, error")
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., max_length=2000)
    action: Optional[str] = Field(default=None, description="URL or action identifier")
    actionLabel: Optional[str] = Field(default=None, description="Button label for the action")
    priority: int = Field(default=0, ge=0, le=10, description="Higher = more important")


class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: str
    action: Optional[str]
    actionLabel: Optional[str]
    priority: int
    read: bool
    created_at: str


class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    total: int
    unread_count: int


# ---------------------------------------------------------------------------
# Seed sample notifications
# ---------------------------------------------------------------------------

def _seed_notifications() -> None:
    """Create sample notifications on startup."""
    if _notifications:
        return

    samples = [
        {
            "type": "success",
            "title": "System Online",
            "message": "FlowMind AI backend is running. All services are healthy.",
            "priority": 3,
        },
        {
            "type": "info",
            "title": "New Document Uploaded",
            "message": "pricing-guide.pdf was processed and indexed with 12 chunks.",
            "action": "/documents",
            "actionLabel": "View Documents",
            "priority": 5,
        },
        {
            "type": "warning",
            "title": "High Escalation Rate",
            "message": "Escalation rate exceeded 15% today. Consider adding more documentation for common queries.",
            "action": "/analytics",
            "actionLabel": "View Analytics",
            "priority": 7,
        },
        {
            "type": "info",
            "title": "Daily Summary Available",
            "message": "Yesterday's summary: 45 queries answered, avg confidence 87%, 3 escalations.",
            "action": "/analytics",
            "actionLabel": "View Report",
            "priority": 4,
        },
        {
            "type": "error",
            "title": "Rate Limit Warning",
            "message": "API rate limit was reached briefly at 2:15 PM. Monitoring has been adjusted.",
            "priority": 6,
        },
    ]

    now = datetime.now(timezone.utc).isoformat()
    for sample in samples:
        _notifications.append({
            "id": str(uuid.uuid4()),
            "type": sample["type"],
            "title": sample["title"],
            "message": sample["message"],
            "action": sample.get("action"),
            "actionLabel": sample.get("actionLabel"),
            "priority": sample.get("priority", 0),
            "read": False,
            "created_at": now,
        })

    logger.info(f"Seeded {len(samples)} sample notifications")


_seed_notifications()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _to_response(n: Dict[str, Any]) -> NotificationResponse:
    return NotificationResponse(**n)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/notifications", response_model=NotificationListResponse)
async def list_notifications(
    type: Optional[str] = Query(default=None, description="Filter by type: info, warning, success, error"),
    unread_only: bool = Query(default=False, description="Only return unread notifications"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> NotificationListResponse:
    """
    List notifications with optional filtering and pagination.

    Query params:
    - type: Filter by notification type (info, warning, success, error)
    - unread_only: Only return unread notifications
    - limit: Max number to return (default 50)
    - offset: Number to skip for pagination
    """
    filtered = _notifications.copy()

    if type:
        filtered = [n for n in filtered if n["type"] == type]

    if unread_only:
        filtered = [n for n in filtered if not n["read"]]

    # Sort by priority (desc) then by created_at (desc, most recent first)
    filtered.sort(key=lambda n: (-n.get("priority", 0), n.get("created_at", "")), reverse=False)
    # Re-sort: primary by priority desc, secondary by created_at desc
    filtered.sort(key=lambda n: (-n.get("priority", 0), n.get("created_at", "")))

    total = len(filtered)
    unread_count = sum(1 for n in _notifications if not n["read"])
    paginated = filtered[offset:offset + limit]

    return NotificationListResponse(
        notifications=[_to_response(n) for n in paginated],
        total=total,
        unread_count=unread_count,
    )


@router.get("/notifications/{notification_id}", response_model=NotificationResponse)
async def get_notification(notification_id: str) -> NotificationResponse:
    """
    Get a single notification by ID.
    """
    for n in _notifications:
        if n["id"] == notification_id:
            return _to_response(n)
    raise HTTPException(status_code=404, detail=f"Notification '{notification_id}' not found")


@router.put("/notifications/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(notification_id: str) -> NotificationResponse:
    """
    Mark a single notification as read.
    """
    for n in _notifications:
        if n["id"] == notification_id:
            n["read"] = True
            logger.debug(f"Notification marked as read: {notification_id}")
            return _to_response(n)
    raise HTTPException(status_code=404, detail=f"Notification '{notification_id}' not found")


@router.put("/notifications/read-all")
async def mark_all_read() -> Dict[str, Any]:
    """
    Mark all notifications as read.
    """
    count = 0
    for n in _notifications:
        if not n["read"]:
            n["read"] = True
            count += 1
    logger.info(f"Marked {count} notifications as read")
    return {"status": "success", "marked_read": count}


@router.post("/notifications", response_model=NotificationResponse, status_code=201)
async def create_notification(body: NotificationCreate) -> NotificationResponse:
    """
    Create a new notification. Primarily for internal/backend use
    (e.g., from other routes or services).

    The notification is immediately available via GET /notifications.
    """
    now = datetime.now(timezone.utc).isoformat()
    notification = {
        "id": str(uuid.uuid4()),
        "type": body.type,
        "title": body.title,
        "message": body.message,
        "action": body.action,
        "actionLabel": body.actionLabel,
        "priority": body.priority,
        "read": False,
        "created_at": now,
    }
    _notifications.append(notification)
    logger.info(f"Notification created: {notification['id']} ({body.title})")

    # Broadcast via WebSocket if available
    try:
        from app.routes.websocket import broadcast_event
        await broadcast_event("notification", {
            "id": notification["id"],
            "type": notification["type"],
            "title": notification["title"],
            "message": notification["message"],
        })
    except Exception as exc:
        logger.debug(f"WebSocket broadcast failed for notification: {exc}")

    return _to_response(notification)
