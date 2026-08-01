"""
WebSocket endpoint for real-time communication.
Maintains a set of connected clients and supports broadcasting events.
"""

import asyncio
import json
import time
from typing import Any, Dict, Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.utils.logger import logger

router = APIRouter()

# Module-level set of all connected WebSocket clients
connected_clients: Set[WebSocket] = set()

# Lock for thread-safe client set mutations
_clients_lock = asyncio.Lock()


async def broadcast_event(event_type: str, data: Any = None) -> int:
    """
    Broadcast a JSON event to all connected WebSocket clients.
    Can be called from any route or service.

    Args:
        event_type: The type of event (e.g. "document_uploaded", "stats_update")
        data: Optional payload for the event

    Returns:
        Number of clients the event was sent to
    """
    if data is None:
        data = {}

    message = json.dumps({
        "type": event_type,
        "data": data,
        "timestamp": time.time(),
    })

    sent_count = 0
    disconnected: list = []

    async with _clients_lock:
        for client in connected_clients:
            try:
                await client.send_text(message)
                sent_count += 1
            except Exception:
                disconnected.append(client)

        # Clean up disconnected clients
        for client in disconnected:
            connected_clients.discard(client)

    if disconnected:
        logger.info(f"Cleaned up {len(disconnected)} disconnected WebSocket clients")

    logger.debug(f"Broadcast '{event_type}' to {sent_count} clients")
    return sent_count


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    """
    WebSocket endpoint for real-time client communication.

    - On connect: sends a welcome message
    - On receive: echoes the message back with an acknowledgment
    - On disconnect: removes the client from the active set
    """
    await websocket.accept()

    async with _clients_lock:
        connected_clients.add(websocket)

    client_id = id(websocket)
    logger.info(f"WebSocket client connected: {client_id} (total: {len(connected_clients)})")

    # Send welcome message
    try:
        await websocket.send_text(json.dumps({
            "type": "connected",
            "message": "FlowMind AI WebSocket connected",
            "timestamp": time.time(),
        }))
    except Exception:
        async with _clients_lock:
            connected_clients.discard(websocket)
        return

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                payload = json.loads(raw)
                logger.debug(f"WebSocket message from {client_id}: {payload}")
            except json.JSONDecodeError:
                payload = {"raw": raw}

            # Echo back with acknowledgment
            await websocket.send_text(json.dumps({
                "type": "acknowledgment",
                "message": "Message received",
                "original": payload,
                "timestamp": time.time(),
            }))

    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected: {client_id}")
    except Exception as exc:
        logger.warning(f"WebSocket error for client {client_id}: {exc}")
    finally:
        async with _clients_lock:
            connected_clients.discard(websocket)
        logger.info(f"WebSocket client removed: {client_id} (total: {len(connected_clients)})")
