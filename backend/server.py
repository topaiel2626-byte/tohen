from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import re
import random
import tempfile
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

FOLDERS = [
    {"id": "torah", "name": "תורה", "description": "לשיעורים, תובנות ודברי תורה", "icon": "book-open", "color": "gold"},
    {"id": "business", "name": "עסקים ושיווק", "description": "לאסטרטגיות צמיחה וניהול לקוחות", "icon": "briefcase", "color": "blue"},
    {"id": "mental_snacks", "name": "חטיפי מוטיבציה", "description": "לרעיונות קצרים ומעוררי השראה", "icon": "zap", "color": "green"},
    {"id": "general", "name": "רעיונות כלליים", "description": "לכל דבר אחר שצריך לתעד", "icon": "lightbulb", "color": "white"},
]

# --- Pydantic Models ---
class ContentItemCreate(BaseModel):
    title: str
    content: str
    folder_id: str
    source_type: str = "manual"  # manual, youtube, voice
    youtube_url: Optional[str] = None

class ContentItemResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    content: str
    folder_id: str
    source_type: str
    youtube_url: Optional[str] = None
    strategy: Optional[str] = None
    has_package: bool = False
    created_at: str
    updated_at: str

class ContentPackageResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    content_item_id: str
    article: Optional[str] = None
    social_post: Optional[str] = None
    stories_scripts: Optional[str] = None
    seo_keywords: Optional[str] = None
    video_titles: Optional[str] = None
    created_at: str

class MarketingDNA(BaseModel):
    writing_style: str = "מקצועי, חד, מעצים"
    tone: str = "מבוסס מקורות יהודיים"
    target_audience: str = ""
    brand_values: str = ""
    custom_instructions: str = ""

class YouTubeAnalyzeRequest(BaseModel):
    url: str
    folder_id: str = "general"
    manual_transcript: Optional[str] = None

class ManualContentRequest(BaseModel):
    title: str
    content: str
    folder_id: str = "general"

class ContentItemUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    folder_id: Optional[str] = None
    strategy: Optional[str] = None

# --- Helper: AI Chat ---
async def ai_generate(system_message: str, user_message: str) -> str:
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        chat = LlmChat(
            api_key=api_key,
            session_id=str(uuid.uuid4()),
            system_message=system_message
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        msg = UserMessage(text=user_message)
        response = await chat.send_message(msg)
        return response
    except Exception as e:
        logger.error(f"AI generation error: {e}")
        raise HTTPException(status_code=500, detail=f"שגיאה בייצור תוכן AI: {str(e)}")

# --- Helper: YouTube Transcript ---
def extract_video_id(url: str) -> str:
    patterns = [
        r'(?:v=|\/videos\/|embed\/|youtu.be\/|\/v\/|\/e\/|watch\?v=|&v=)([^#&?\/\s]{11})',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    raise HTTPException(status_code=400, detail="קישור YouTube לא תקין")

async def get_youtube_transcript(url: str) -> str:
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        video_id = extract_video_id(url)
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        try:
            transcript = transcript_list.find_transcript(['iw', 'he'])
        except Exception:
            try:
                transcript = transcript_list.find_transcript(['en'])
            except Exception:
                transcript = next(iter(transcript_list))
        fetched = transcript.fetch()
        full_text = " ".join([item.text for item in fetched])
        return full_text
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"YouTube transcript error: {e}")
        return None

# --- Routes ---

@api_router.get("/")
async def root():
    return {"message": "Orbit360 Engine API"}

# Folders
@api_router.get("/folders")
async def get_folders():
    folder_counts = {}
    for folder in FOLDERS:
        count = await db.content_items.count_documents({"folder_id": folder["id"]})
        folder_counts[folder["id"]] = count
    result = []
    for f in FOLDERS:
        result.append({**f, "count": folder_counts.get(f["id"], 0)})
    return result

# Content Items CRUD
@api_router.post("/content/items")
async def create_content_item(item: ContentItemCreate):
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        "title": item.title,
        "content": item.content,
        "folder_id": item.folder_id,
        "source_type": item.source_type,
        "youtube_url": item.youtube_url,
        "strategy": None,
        "has_package": False,
        "created_at": now,
        "updated_at": now,
    }
    await db.content_items.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/content/items")
async def list_content_items(folder_id: Optional[str] = None, search: Optional[str] = None, limit: int = 50, skip: int = 0):
    query = {}
    if folder_id:
        query["folder_id"] = folder_id
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}},
        ]
    items = await db.content_items.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.content_items.count_documents(query)
    return {"items": items, "total": total}

@api_router.get("/content/items/{item_id}")
async def get_content_item(item_id: str):
    item = await db.content_items.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="פריט לא נמצא")
    return item

@api_router.put("/content/items/{item_id}")
async def update_content_item(item_id: str, update: ContentItemUpdate):
    item = await db.content_items.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="פריט לא נמצא")
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="אין שדות לעדכון")
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.content_items.update_one({"id": item_id}, {"$set": update_data})
    updated = await db.content_items.find_one({"id": item_id}, {"_id": 0})
    return updated

@api_router.delete("/content/items/{item_id}")
async def delete_content_item(item_id: str):
    result = await db.content_items.delete_one({"id": item_id})
    await db.content_packages.delete_many({"content_item_id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="פריט לא נמצא")
    return {"status": "deleted"}

# Bulk Export Packages
@api_router.get("/content/bulk-export")
async def bulk_export_packages(folder_id: Optional[str] = None):
    query = {"has_package": True}
    if folder_id:
        query["folder_id"] = folder_id
    items = await db.content_items.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    result = []
    for item in items:
        pkg = await db.content_packages.find_one({"content_item_id": item["id"]}, {"_id": 0})
        if pkg:
            result.append({
                "item_title": item["title"],
                "item_id": item["id"],
                "folder_id": item["folder_id"],
                "article": pkg.get("article", ""),
                "social_post": pkg.get("social_post", ""),
                "stories_scripts": pkg.get("stories_scripts", ""),
                "seo_keywords": pkg.get("seo_keywords", ""),
                "video_titles": pkg.get("video_titles", ""),
            })
    return {"packages": result, "total": len(result)}

@api_router.get("/content/export-package/{item_id}")
async def export_single_package(item_id: str):
    item = await db.content_items.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="פריט לא נמצא")
    pkg = await db.content_packages.find_one({"content_item_id": item_id}, {"_id": 0})
    if not pkg:
        raise HTTPException(status_code=404, detail="חבילת תוכן לא נמצאה")
    sections = [
        f"# {item['title']}\n",
        "## מאמר מקצועי\n" + pkg.get("article", ""),
        "\n---\n## פוסט לרשתות חברתיות\n" + pkg.get("social_post", ""),
        "\n---\n## תסריטי סטוריז\n" + pkg.get("stories_scripts", ""),
        "\n---\n## SEO ומילות מפתח\n" + pkg.get("seo_keywords", ""),
        "\n---\n## כותרות לסרטונים\n" + pkg.get("video_titles", ""),
    ]
    return {"text": "\n".join(sections), "title": item["title"]}

# YouTube Analysis
@api_router.post("/youtube/analyze")
async def analyze_youtube(req: YouTubeAnalyzeRequest):
    transcript = req.manual_transcript
    auto_transcript_success = False
    if not transcript:
        transcript = await get_youtube_transcript(req.url)
        if transcript:
            auto_transcript_success = True
    if not transcript:
        return {
            "status": "need_manual_transcript",
            "message": "לא הצלחנו לשלוף את התמלול אוטומטית. אנא הדבק את הטקסט ידנית.",
            "video_id": extract_video_id(req.url)
        }
    # Get marketing DNA for style
    dna = await db.marketing_dna.find_one({"id": "default"}, {"_id": 0})
    style_instruction = ""
    if dna:
        style_instruction = f"סגנון כתיבה: {dna.get('writing_style', '')}. טון: {dna.get('tone', '')}. {dna.get('custom_instructions', '')}"

    strategy = await ai_generate(
        system_message=f"אתה יועץ אסטרטגי מקצועי. צור אסטרטגיית יישום מפורטת בעברית על בסיס התוכן הבא. כלול צעדים מעשיים ומספרי. {style_instruction}",
        user_message=f"הנה תמלול של סרטון:\n\n{transcript[:8000]}\n\nצור אסטרטגיית יישום מפורטת עם צעדים מעשיים."
    )
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        "title": f"ניתוח YouTube - {req.url[:50]}",
        "content": transcript,
        "folder_id": req.folder_id,
        "source_type": "youtube",
        "youtube_url": req.url,
        "strategy": strategy,
        "has_package": False,
        "created_at": now,
        "updated_at": now,
    }
    await db.content_items.insert_one(doc)
    doc.pop("_id", None)
    return {"status": "success", "auto_transcript": auto_transcript_success, "item": doc}

# Voice Transcription
@api_router.post("/voice/transcribe")
async def transcribe_voice(audio: UploadFile = File(...), folder_id: str = Form("general")):
    try:
        from emergentintegrations.llm.openai import OpenAISpeechToText
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        stt = OpenAISpeechToText(api_key=api_key)
        
        # Save to temp file
        content = await audio.read()
        suffix = ".webm"
        if audio.filename:
            suffix = Path(audio.filename).suffix or ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        
        with open(tmp_path, "rb") as audio_file:
            response = await stt.transcribe(
                file=audio_file,
                model="whisper-1",
                language="he",
                response_format="json"
            )
        os.unlink(tmp_path)
        text = response.text
        now = datetime.now(timezone.utc).isoformat()
        doc = {
            "id": str(uuid.uuid4()),
            "title": f"הקלטה קולית - {datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M')}",
            "content": text,
            "folder_id": folder_id,
            "source_type": "voice",
            "youtube_url": None,
            "strategy": None,
            "has_package": False,
            "created_at": now,
            "updated_at": now,
        }
        await db.content_items.insert_one(doc)
        doc.pop("_id", None)
        return {"status": "success", "item": doc}
    except Exception as e:
        logger.error(f"Voice transcription error: {e}")
        raise HTTPException(status_code=500, detail=f"שגיאה בתמלול: {str(e)}")

# Content Package Generation
@api_router.post("/content/generate-package/{item_id}")
async def generate_content_package(item_id: str):
    item = await db.content_items.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="פריט לא נמצא")
    
    dna = await db.marketing_dna.find_one({"id": "default"}, {"_id": 0})
    style_instruction = ""
    if dna:
        style_instruction = f"""
סגנון כתיבה: {dna.get('writing_style', 'מקצועי')}
טון: {dna.get('tone', 'מעצים')}
קהל יעד: {dna.get('target_audience', '')}
ערכי מותג: {dna.get('brand_values', '')}
הנחיות נוספות: {dna.get('custom_instructions', '')}
"""
    content_text = item.get("content", "")[:8000]
    strategy_text = item.get("strategy", "") or ""

    system_msg = f"""אתה מומחה לשיווק דיגיטלי ויצירת תוכן בעברית. הנה ה-DNA השיווקי שלי:
{style_instruction}
היצמד לסגנון זה בכל הפלטים. כתוב בעברית מלאה."""

    user_msg = f"""על בסיס התוכן הבא, צור חבילת הפצה מלאה:

תוכן מקור:
{content_text}

{f"אסטרטגיה:{strategy_text[:2000]}" if strategy_text else ""}

צור את הפלטים הבאים (הפרד ביניהם עם === כמפריד):

1. מאמר מקצועי (עמוק ומקיף, לפחות 5 פסקאות)
===SEPARATOR===
2. פוסט לרשתות חברתיות (מותאם לפייסבוק ולינקדאין, עם אימוג'ים וקריאה לפעולה)
===SEPARATOR===
3. תסריטים לסטוריז (3 רעיונות קצרים ודינמיים לאינסטגרם/טיקטוק)
===SEPARATOR===
4. מילות מפתח ו-SEO (האשטאגים וכותרות לקידום אורגני)
===SEPARATOR===
5. כותרות לסרטונים (3 הצעות לכותרות מושכות Click-worthy)"""

    result = await ai_generate(system_msg, user_msg)
    parts = result.split("===SEPARATOR===")
    
    now = datetime.now(timezone.utc).isoformat()
    package_doc = {
        "id": str(uuid.uuid4()),
        "content_item_id": item_id,
        "article": parts[0].strip() if len(parts) > 0 else "",
        "social_post": parts[1].strip() if len(parts) > 1 else "",
        "stories_scripts": parts[2].strip() if len(parts) > 2 else "",
        "seo_keywords": parts[3].strip() if len(parts) > 3 else "",
        "video_titles": parts[4].strip() if len(parts) > 4 else "",
        "created_at": now,
    }
    await db.content_packages.insert_one(package_doc)
    package_doc.pop("_id", None)
    await db.content_items.update_one({"id": item_id}, {"$set": {"has_package": True, "updated_at": now}})
    return package_doc

@api_router.get("/content/package/{item_id}")
async def get_content_package(item_id: str):
    package = await db.content_packages.find_one({"content_item_id": item_id}, {"_id": 0})
    if not package:
        raise HTTPException(status_code=404, detail="חבילת תוכן לא נמצאה")
    return package

# Marketing DNA Settings
@api_router.get("/settings/marketing-dna")
async def get_marketing_dna():
    dna = await db.marketing_dna.find_one({"id": "default"}, {"_id": 0})
    if not dna:
        default_dna = {
            "id": "default",
            "writing_style": "מקצועי, חד, מעצים",
            "tone": "מבוסס מקורות יהודיים",
            "target_audience": "",
            "brand_values": "",
            "custom_instructions": "",
        }
        await db.marketing_dna.insert_one(default_dna)
        default_dna.pop("_id", None)
        return default_dna
    return dna

@api_router.put("/settings/marketing-dna")
async def update_marketing_dna(dna: MarketingDNA):
    update_data = dna.model_dump()
    update_data["id"] = "default"
    await db.marketing_dna.update_one(
        {"id": "default"},
        {"$set": update_data},
        upsert=True
    )
    return {**update_data}

# Smart Search
@api_router.get("/search")
async def smart_search(q: str, limit: int = 20):
    if not q:
        return {"items": [], "total": 0}
    query = {
        "$or": [
            {"title": {"$regex": q, "$options": "i"}},
            {"content": {"$regex": q, "$options": "i"}},
            {"strategy": {"$regex": q, "$options": "i"}},
        ]
    }
    items = await db.content_items.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    total = await db.content_items.count_documents(query)
    return {"items": items, "total": total}

# Daily Snack
@api_router.get("/daily-snack")
async def get_daily_snack():
    count = await db.content_items.count_documents({"folder_id": "mental_snacks"})
    if count == 0:
        # Fallback to any content
        count = await db.content_items.count_documents({})
        if count == 0:
            return {"snack": None, "message": "אין עדיין תכנים. התחל להוסיף רעיונות!"}
        skip = random.randint(0, max(0, count - 1))
        item = await db.content_items.find({}, {"_id": 0}).skip(skip).limit(1).to_list(1)
    else:
        skip = random.randint(0, max(0, count - 1))
        item = await db.content_items.find({"folder_id": "mental_snacks"}, {"_id": 0}).skip(skip).limit(1).to_list(1)
    if item:
        return {"snack": item[0]}
    return {"snack": None, "message": "אין עדיין תכנים בתיקיית חטיפי מוטיבציה"}

# History
@api_router.get("/history")
async def get_history(search: Optional[str] = None, folder_id: Optional[str] = None, source_type: Optional[str] = None, limit: int = 50, skip: int = 0):
    query = {}
    if folder_id:
        query["folder_id"] = folder_id
    if source_type:
        query["source_type"] = source_type
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}},
        ]
    items = await db.content_items.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.content_items.count_documents(query)
    return {"items": items, "total": total}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
