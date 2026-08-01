import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from app.utils.logger import logger


class TelegramNotifier:
    """Sends notifications via Telegram."""

    def __init__(self, bot_token: Optional[str] = None, admin_chat_id: Optional[str] = None) -> None:
        self.available = False
        self._bot = None
        self._admin_chat_id = admin_chat_id

        if not bot_token or not admin_chat_id:
            logger.warning("Telegram not configured - notifications disabled")
            return

        try:
            from telegram import Bot
            self._bot = Bot(token=bot_token)
            self.available = True
            logger.info("Telegram notifier initialized")
        except Exception as exc:
            logger.warning(f"Telegram init failed: {exc}")

    async def send_escalation_alert(self, question: str, user_phone: str, confidence: float) -> None:
        if not self.available or self._bot is None:
            return
        try:
            ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
            msg = (
                f"\U0001f6a8 *ESCALATION ALERT*\n\n"
                f"\U0001f4de *Phone:* `{user_phone}`\n"
                f"\U0001f4ac *Question:* {question}\n"
                f"\U0001f4ca *Confidence:* {confidence:.2%}\n"
                f"\U0001f552 *Time:* {ts}\n\n"
                f"_Please respond promptly._"
            )
            await self._bot.send_message(
                chat_id=self._admin_chat_id,
                text=msg,
                parse_mode="Markdown",
            )
            logger.info("Escalation alert sent to Telegram")
        except Exception as exc:
            logger.warning(f"Failed to send escalation alert: {exc}")

    async def send_daily_summary(self, stats: Dict[str, Any]) -> None:
        if not self.available or self._bot is None:
            return
        try:
            total = stats.get("total_queries", 0)
            avg_conf = stats.get("avg_confidence", 0)
            esc_rate = stats.get("escalation_rate", 0)
            msg = (
                f"\U0001f4ca *FlowMind Daily Summary*\n\n"
                f"\U0001f4c8 *Total Queries:* {total}\n"
                f"\U0001f4ca *Avg Confidence:* {avg_conf:.2%}\n"
                f"\U0001f6a8 *Escalation Rate:* {esc_rate:.2%}\n\n"
                f"_Generated automatically._"
            )
            await self._bot.send_message(
                chat_id=self._admin_chat_id,
                text=msg,
                parse_mode="Markdown",
            )
            logger.info("Daily summary sent to Telegram")
        except Exception as exc:
            logger.warning(f"Failed to send daily summary: {exc}")

    async def send_document_uploaded(self, filename: str, chunks: int) -> None:
        if not self.available or self._bot is None:
            return
        try:
            msg = (
                f"\U0001f4c4 *New Document Uploaded*\n\n"
                f"\U0001f4c1 *File:* `{filename}`\n"
                f"\U0001f4d0 *Chunks:* {chunks}\n\n"
                f"_Document indexed successfully._"
            )
            await self._bot.send_message(
                chat_id=self._admin_chat_id,
                text=msg,
                parse_mode="Markdown",
            )
            logger.info(f"Document upload notification sent for {filename}")
        except Exception as exc:
            logger.warning(f"Failed to send document upload notification: {exc}")
