import csv
import io
import json
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from app.utils.logger import logger


class SheetsLogger:
    """Logs conversations to Google Sheets with local CSV fallback."""

    def __init__(self, sheets_id: Optional[str] = None, creds_json: Optional[str] = None) -> None:
        self.available = False
        self._client = None
        self._sheet = None
        self._csv_path = "conversation_log.csv"

        if not creds_json or not sheets_id:
            logger.warning("Google Sheets not configured - using local CSV fallback")
            return

        try:
            import gspread
            from google.oauth2.service_account import Credentials
            creds_dict = json.loads(creds_json)
            scopes = ["https://www.googleapis.com/auth/spreadsheets"]
            creds = Credentials.from_service_account_info(creds_dict, scopes=scopes)
            self._client = gspread.authorize(creds)
            self._sheet = self._client.open_by_key(sheets_id).sheet1
            self._ensure_headers()
            self.available = True
            logger.info("Google Sheets logger initialized")
        except Exception as exc:
            logger.warning(f"Google Sheets init failed: {exc} - using local CSV fallback")

    def _ensure_headers(self) -> None:
        if self._sheet is None:
            return
        try:
            existing = self._sheet.row_values(1)
            if not existing:
                self._sheet.append_row([
                    "timestamp", "user_phone", "question",
                    "answer", "confidence", "sources",
                    "escalated", "response_time_ms",
                ])
        except Exception as exc:
            logger.warning(f"Failed to ensure sheet headers: {exc}")

    def _write_csv(self, data: Dict[str, Any]) -> None:
        try:
            file_exists = os.path.exists(self._csv_path)
            with open(self._csv_path, "a", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                if not file_exists:
                    writer.writerow([
                        "timestamp", "user_phone", "question",
                        "answer", "confidence", "sources",
                        "escalated", "response_time_ms",
                    ])
                writer.writerow([
                    data.get("timestamp", ""),
                    data.get("user_phone", ""),
                    data.get("question", ""),
                    data.get("answer", ""),
                    data.get("confidence", ""),
                    json.dumps(data.get("sources", [])),
                    data.get("escalated", ""),
                    data.get("response_time_ms", ""),
                ])
        except Exception as exc:
            logger.error(f"CSV write failed: {exc}")

    def log_conversation(self, data: Dict[str, Any]) -> None:
        if self.available and self._sheet:
            try:
                self._sheet.append_row([
                    data.get("timestamp", ""),
                    data.get("user_phone", ""),
                    data.get("question", ""),
                    data.get("answer", ""),
                    data.get("confidence", ""),
                    json.dumps(data.get("sources", [])),
                    data.get("escalated", ""),
                    data.get("response_time_ms", ""),
                ])
                return
            except Exception as exc:
                logger.warning(f"Sheets write failed: {exc}, falling back to CSV")
        self._write_csv(data)

    def get_recent_conversations(self, limit: int = 50) -> List[Dict[str, Any]]:
        if not self.available or self._sheet is None:
            return self._read_csv(limit)
        try:
            rows = self._sheet.get_all_values()
            if len(rows) <= 1:
                return []
            header = rows[0]
            results = []
            for row in reversed(rows[1:limit + 1]):
                record = dict(zip(header, row))
                try:
                    record["sources"] = json.loads(record.get("sources", "[]"))
                except (json.JSONDecodeError, TypeError):
                    record["sources"] = []
                results.append(record)
            return results
        except Exception as exc:
            logger.warning(f"Failed to read from Sheets: {exc}")
            return self._read_csv(limit)

    def _read_csv(self, limit: int = 50) -> List[Dict[str, Any]]:
        if not os.path.exists(self._csv_path):
            return []
        try:
            with open(self._csv_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                rows = list(reader)
            results = []
            for row in reversed(rows[-limit:]):
                try:
                    row["sources"] = json.loads(row.get("sources", "[]"))
                except (json.JSONDecodeError, TypeError):
                    row["sources"] = []
                results.append(row)
            return results
        except Exception as exc:
            logger.error(f"CSV read failed: {exc}")
            return []

    def get_stats(self, days: int = 7) -> Dict[str, Any]:
        if not self.available or self._sheet is None:
            return self._csv_stats(days)
        try:
            rows = self._sheet.get_all_values()
            if len(rows) <= 1:
                return self._empty_stats()
            header = rows[0]
            records = [dict(zip(header, r)) for r in rows[1:]]
            return self._compute_stats(records, days)
        except Exception as exc:
            logger.warning(f"Sheets stats failed: {exc}")
            return self._csv_stats(days)

    def _csv_stats(self, days: int) -> Dict[str, Any]:
        if not os.path.exists(self._csv_path):
            return self._empty_stats()
        try:
            with open(self._csv_path, "r", encoding="utf-8") as f:
                records = list(csv.DictReader(f))
            return self._compute_stats(records, days)
        except Exception as exc:
            logger.error(f"CSV stats failed: {exc}")
            return self._empty_stats()

    def _compute_stats(self, records: List[Dict], days: int) -> Dict[str, Any]:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        filtered = [r for r in records if r.get("timestamp", "") >= cutoff]
        total = len(filtered)
        if total == 0:
            return self._empty_stats()
        confidences = []
        escalations = 0
        response_times = []
        question_counts: Dict[str, int] = {}
        daily_counts: Dict[str, int] = {}
        for r in filtered:
            try:
                confidences.append(float(r.get("confidence", 0)))
            except (ValueError, TypeError):
                pass
            if str(r.get("escalated", "")).lower() in ("true", "1", "yes"):
                escalations += 1
            try:
                response_times.append(float(r.get("response_time_ms", 0)))
            except (ValueError, TypeError):
                pass
            q = r.get("question", "")
            question_counts[q] = question_counts.get(q, 0) + 1
            ts = r.get("timestamp", "")[:10]
            if ts:
                daily_counts[ts] = daily_counts.get(ts, 0) + 1
        popular = sorted(question_counts.items(), key=lambda x: -x[1])[:10]
        daily = [{"date": k, "count": v} for k, v in sorted(daily_counts.items())]
        return {
            "total_queries": total,
            "avg_confidence": round(sum(confidences) / len(confidences), 4) if confidences else 0.0,
            "escalation_rate": round(escalations / total, 4),
            "popular_questions": [q for q, _ in popular],
            "daily_query_count": daily,
            "avg_response_time": round(sum(response_times) / len(response_times), 2) if response_times else 0.0,
        }

    @staticmethod
    def _empty_stats() -> Dict[str, Any]:
        return {
            "total_queries": 0,
            "avg_confidence": 0.0,
            "escalation_rate": 0.0,
            "popular_questions": [],
            "daily_query_count": [],
            "avg_response_time": 0.0,
        }
