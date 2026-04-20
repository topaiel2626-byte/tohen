"""
AI Provider - Self-hosted, zero platform dependency.
Reads config from environment variables OR from DB settings.
Supports: OpenAI, Groq, Anthropic, Google, any OpenAI-compatible API.

Environment variables (take priority over DB):
  OPENAI_API_KEY    - API key for text generation
  OPENAI_BASE_URL   - Base URL (default: https://api.openai.com/v1)
  AI_MODEL          - Model name (default: gpt-4o)
  STT_API_KEY       - API key for speech-to-text (falls back to OPENAI_API_KEY)
  STT_BASE_URL      - STT base URL (falls back to OPENAI_BASE_URL)
  STT_MODEL         - STT model (default: whisper-1)
"""
import os
import logging
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic

logger = logging.getLogger(__name__)


def _get_env_config():
    """Read AI config from environment variables."""
    api_key = os.environ.get("OPENAI_API_KEY", "")
    base_url = os.environ.get("OPENAI_BASE_URL", "")
    model = os.environ.get("AI_MODEL", "")
    if api_key:
        return {
            "provider": "openai_compatible",
            "api_key": api_key,
            "api_url": base_url,
            "model": model or "gpt-4o",
            "stt_provider": "openai_compatible",
            "stt_api_key": os.environ.get("STT_API_KEY", api_key),
            "stt_api_url": os.environ.get("STT_BASE_URL", base_url),
            "stt_model": os.environ.get("STT_MODEL", "whisper-1"),
        }
    return None


async def get_ai_settings(db):
    """Priority: ENV vars > DB settings > defaults."""
    env_config = _get_env_config()
    if env_config:
        return env_config

    settings = await db.ai_settings.find_one({"id": "default"}, {"_id": 0})
    if settings and settings.get("api_key"):
        return settings

    return {
        "id": "default",
        "provider": "openai_compatible",
        "api_key": "",
        "api_url": "",
        "model": "gpt-4o",
        "stt_provider": "openai_compatible",
        "stt_api_key": "",
        "stt_api_url": "",
        "stt_model": "whisper-1",
    }


async def ai_generate(db, system_message: str, user_message: str) -> str:
    settings = await get_ai_settings(db)
    provider = settings.get("provider", "openai_compatible")

    if provider == "anthropic":
        return await _generate_anthropic(settings, system_message, user_message)
    elif provider == "google":
        return await _generate_google(settings, system_message, user_message)
    else:
        return await _generate_openai_compatible(settings, system_message, user_message)


async def transcribe_audio(db, audio_path: str, language: str = "he") -> str:
    settings = await get_ai_settings(db)
    return await _transcribe_openai_compatible(settings, audio_path, language)


# --- OpenAI / OpenAI-Compatible (Groq, Together, Ollama, OpenRouter, etc.) ---

async def _generate_openai_compatible(settings: dict, system_message: str, user_message: str) -> str:
    api_key = settings.get("api_key", "")
    base_url = settings.get("api_url", "") or None
    model = settings.get("model", "gpt-4o")

    client = AsyncOpenAI(api_key=api_key, base_url=base_url)
    response = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message},
        ],
        temperature=0.7,
    )
    return response.choices[0].message.content


async def _transcribe_openai_compatible(settings: dict, audio_path: str, language: str) -> str:
    api_key = settings.get("stt_api_key") or settings.get("api_key", "")
    base_url = settings.get("stt_api_url") or settings.get("api_url", "") or None
    model = settings.get("stt_model", "whisper-1")

    client = AsyncOpenAI(api_key=api_key, base_url=base_url)
    with open(audio_path, "rb") as f:
        response = await client.audio.transcriptions.create(model=model, file=f, language=language)
    return response.text


# --- Anthropic ---

async def _generate_anthropic(settings: dict, system_message: str, user_message: str) -> str:
    api_key = settings.get("api_key", "")
    model = settings.get("model", "claude-sonnet-4-5-20250929")

    client = AsyncAnthropic(api_key=api_key)
    response = await client.messages.create(
        model=model,
        max_tokens=4096,
        system=system_message,
        messages=[{"role": "user", "content": user_message}],
    )
    return response.content[0].text


# --- Google Gemini ---

async def _generate_google(settings: dict, system_message: str, user_message: str) -> str:
    from google import genai

    api_key = settings.get("api_key", "")
    model = settings.get("model", "gemini-2.0-flash")

    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=model,
        contents=f"{system_message}\n\n{user_message}",
    )
    return response.text
