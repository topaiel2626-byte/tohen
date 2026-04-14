import os
import logging
import uuid
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic

logger = logging.getLogger(__name__)


async def get_ai_settings(db):
    settings = await db.ai_settings.find_one({"id": "default"}, {"_id": 0})
    if not settings:
        return {
            "id": "default",
            "provider": "emergent",
            "api_key": "",
            "api_url": "",
            "model": "",
            "stt_provider": "emergent",
            "stt_api_key": "",
            "stt_api_url": "",
            "stt_model": "whisper-1",
        }
    return settings


async def ai_generate(db, system_message: str, user_message: str) -> str:
    settings = await get_ai_settings(db)
    provider = settings.get("provider", "emergent")

    if provider == "emergent":
        return await _generate_emergent(system_message, user_message)
    elif provider == "anthropic":
        return await _generate_anthropic(settings, system_message, user_message)
    elif provider == "google":
        return await _generate_google(settings, system_message, user_message)
    else:
        return await _generate_openai_compatible(settings, system_message, user_message)


async def transcribe_audio(db, audio_path: str, language: str = "he") -> str:
    settings = await get_ai_settings(db)
    stt_provider = settings.get("stt_provider", "emergent")

    if stt_provider == "emergent":
        return await _transcribe_emergent(audio_path, language)
    else:
        return await _transcribe_openai_compatible(settings, audio_path, language)


# --- Emergent (default) ---

async def _generate_emergent(system_message: str, user_message: str) -> str:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    chat = LlmChat(
        api_key=api_key,
        session_id=str(uuid.uuid4()),
        system_message=system_message
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")
    msg = UserMessage(text=user_message)
    return await chat.send_message(msg)


async def _transcribe_emergent(audio_path: str, language: str) -> str:
    from emergentintegrations.llm.openai import OpenAISpeechToText
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    stt = OpenAISpeechToText(api_key=api_key)
    with open(audio_path, "rb") as f:
        response = await stt.transcribe(file=f, model="whisper-1", language=language, response_format="json")
    return response.text


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
    api_key = settings.get("stt_api_key", "")
    base_url = settings.get("stt_api_url", "") or None
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
