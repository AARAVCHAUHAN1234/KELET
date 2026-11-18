import json
import re
from typing import Dict, Any, Optional
import google.generativeai as genai
from app.config import settings

class GeminiService:
    def __init__(self, api_key: Optional[str] = None, model_name: str = "gemini-1.5-flash"):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model_name
        self.is_available = False
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.is_available = True
            except Exception as e:
                print(f"[GeminiService] Failed to configure Gemini API: {e}")
                self.is_available = False

    async def call_json(self, prompt: str, system_instruction: str = "") -> Optional[Dict[str, Any]]:
        if not self.is_available:
            return None
        try:
            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=system_instruction,
                generation_config={"response_mime_type": "application/json"}
            )
            response = await model.generate_content_async(prompt)
            if response and response.text:
                return json.loads(response.text)
        except Exception as e:
            print(f"[GeminiService] Error calling Gemini: {e}")
            # Try cleaning markdown json wrap if any
            try:
                match = re.search(r"\{.*\}", response.text, re.DOTALL)
                if match:
                    return json.loads(match.group(0))
            except Exception:
                pass
        return None

    async def call_text(self, prompt: str, system_instruction: str = "") -> Optional[str]:
        if not self.is_available:
            return None
        try:
            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=system_instruction
            )
            response = await model.generate_content_async(prompt)
            if response and response.text:
                return response.text
        except Exception as e:
            print(f"[GeminiService] Error calling Gemini text: {e}")
        return None
