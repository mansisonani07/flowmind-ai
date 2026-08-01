import time
from typing import Any, Dict, List

from groq import Groq

from app.utils.logger import logger


class GroqClient:
    """Wrapper around the Groq LLM API."""

    def __init__(self, api_key: str, model: str = "llama-3.3-70b-versatile") -> None:
        self._client = Groq(api_key=api_key)
        self._model = model
        logger.info(f"GroqClient initialized with model={model}")

    def generate_answer(self, question: str, context_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate an answer using context from the knowledge base."""
        context_parts = []
        for chunk in context_chunks:
            fname = chunk.get("filename", "unknown")
            page = chunk.get("page", "?")
            text = chunk.get("text", "")
            context_parts.append(f"[Source: {fname}, Page {page}]\n{text}")
        context = "\n\n---\n\n".join(context_parts)

        system_prompt = f"""You are FlowMind AI, a helpful business assistant. Answer the customer's question using ONLY the provided context from the business documents.

RULES:
1. Answer in a friendly, professional tone
2. Keep answers concise (2-4 sentences max)
3. ALWAYS cite sources like: [Source: filename.pdf, Page X]
4. If the context doesn't contain the answer, say: "I don't have that information in my knowledge base. Let me connect you with a human."
5. Never make up information not in the context
6. If multiple sources are relevant, cite all of them
7. Format prices, timings, and lists clearly

CONTEXT:
{context}

CUSTOMER QUESTION:
{question}

ANSWER:"""

        max_retries = 3
        delays = [1, 2, 4]
        for attempt in range(max_retries):
            try:
                response = self._client.chat.completions.create(
                    model=self._model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": question},
                    ],
                    temperature=0.3,
                    max_tokens=512,
                )
                answer = response.choices[0].message.content.strip() if response.choices else ""
                tokens_used = response.usage.total_tokens if response.usage else 0
                return {
                    "answer": answer,
                    "tokens_used": tokens_used,
                    "model": self._model,
                }
            except Exception as exc:
                status = getattr(exc, "status_code", None)
                if status == 429 and attempt < max_retries - 1:
                    wait = delays[attempt]
                    logger.warning(f"Groq rate limited, retrying in {wait}s (attempt {attempt + 1})")
                    time.sleep(wait)
                    continue
                logger.error(f"Groq API error: {exc}")
                return {
                    "answer": "I'm currently experiencing high demand. Please try again in a moment.",
                    "tokens_used": 0,
                    "model": self._model,
                }
        return {
            "answer": "I'm currently experiencing high demand. Please try again in a moment.",
            "tokens_used": 0,
            "model": self._model,
        }
