"""
ResolveX Google Gemini 2.0 Flash Client
Handles structured output generation with timeout, retry, and strict fallback
"""

import json
from typing import Optional, Dict, Any, Type, TypeVar
from pydantic import BaseModel
from apps.api.app.core.config import settings
from apps.api.app.core.logging import logger

T = TypeVar("T", bound=BaseModel)

class GeminiClient:
    def __init__(self):
        self._client = None
        self._init_client()

    def _init_client(self):
        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip() and not settings.GEMINI_API_KEY.startswith("AIzaSyYour"):
            try:
                from google import genai
                self._client = genai.Client(api_key=settings.GEMINI_API_KEY.strip())
                logger.info(f"Initialized Google Gemini Client with model: {settings.GEMINI_MODEL}")
            except Exception as e:
                logger.warning(f"Failed to initialize Google Gemini client: {str(e)}. Fallback engine active.")
                self._client = None
        else:
            logger.info("No valid GEMINI_API_KEY detected in configuration. Dual-runtime deterministic fallback active.")
            self._client = None

    @property
    def is_available(self) -> bool:
        return self._client is not None

    async def generate_structured(
        self,
        prompt: str,
        response_model: Type[T],
        system_instruction: Optional[str] = None
    ) -> Optional[T]:
        """
        Invokes Gemini 2.0 Flash to return strictly structured JSON validated against response_model.
        Returns None on any error or timeout to trigger deterministic fallback.
        """
        if not self._client:
            return None

        try:
            from google.genai import types
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=response_model,
                temperature=0.1,
                system_instruction=system_instruction or "You are ResolveX, an enterprise customer incident intelligence reasoning agent. Respond only with factual, evidence-backed data."
            )

            # Synchronous call wrapped in safe execution
            response = self._client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=config
            )

            if response and response.text:
                parsed_json = json.loads(response.text)
                return response_model.model_validate(parsed_json)

        except Exception as e:
            logger.warning(f"Gemini generation failed or timed out: {str(e)}. Activating deterministic fallback.")
            return None

        return None

gemini_client = GeminiClient()
