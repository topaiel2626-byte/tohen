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
async def ai_chat(system_message: str, user_message: str) -> str:
    try:
        from ai_provider import ai_generate
        return await ai_generate(db, system_message, user_message)
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

    strategy = await ai_chat(
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
        from ai_provider import transcribe_audio
        
        content = await audio.read()
        suffix = ".webm"
        if audio.filename:
            suffix = Path(audio.filename).suffix or ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        
        text = await transcribe_audio(db, tmp_path, language="he")
        os.unlink(tmp_path)
        
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

    result = await ai_chat(system_msg, user_msg)
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

# Full Backup - Export all data as JSON
@api_router.get("/backup/export")
async def export_full_backup():
    content_items = await db.content_items.find({}, {"_id": 0}).to_list(None)
    content_packages = await db.content_packages.find({}, {"_id": 0}).to_list(None)
    marketing_dna = await db.marketing_dna.find_one({"id": "default"}, {"_id": 0})
    return {
        "backup_version": "1.0",
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "data": {
            "content_items": content_items,
            "content_packages": content_packages,
            "marketing_dna": marketing_dna,
        },
        "counts": {
            "content_items": len(content_items),
            "content_packages": len(content_packages),
        }
    }

# Restore from backup JSON
class RestoreBackup(BaseModel):
    data: dict

@api_router.post("/backup/restore")
async def restore_from_backup(backup: RestoreBackup):
    data = backup.data
    restored = {"content_items": 0, "content_packages": 0, "marketing_dna": False}

    if "content_items" in data and data["content_items"]:
        for item in data["content_items"]:
            item.pop("_id", None)
            existing = await db.content_items.find_one({"id": item.get("id")})
            if not existing:
                await db.content_items.insert_one(item)
                restored["content_items"] += 1

    if "content_packages" in data and data["content_packages"]:
        for pkg in data["content_packages"]:
            pkg.pop("_id", None)
            existing = await db.content_packages.find_one({"id": pkg.get("id")})
            if not existing:
                await db.content_packages.insert_one(pkg)
                restored["content_packages"] += 1

    if "marketing_dna" in data and data["marketing_dna"]:
        dna = data["marketing_dna"]
        dna.pop("_id", None)
        dna["id"] = "default"
        await db.marketing_dna.update_one({"id": "default"}, {"$set": dna}, upsert=True)
        restored["marketing_dna"] = True

    return {"message": "גיבוי שוחזר בהצלחה", "restored": restored}

# --- AI Provider Settings ---
class AISettingsUpdate(BaseModel):
    provider: str = "emergent"
    api_key: str = ""
    api_url: str = ""
    model: str = ""
    stt_provider: str = "emergent"
    stt_api_key: str = ""
    stt_api_url: str = ""
    stt_model: str = "whisper-1"

@api_router.get("/settings/ai")
async def get_ai_settings():
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
    # Mask API keys for security
    masked = {**settings}
    if masked.get("api_key"):
        masked["api_key"] = masked["api_key"][:8] + "..." if len(masked["api_key"]) > 8 else "***"
    if masked.get("stt_api_key"):
        masked["stt_api_key"] = masked["stt_api_key"][:8] + "..." if len(masked["stt_api_key"]) > 8 else "***"
    return masked

@api_router.put("/settings/ai")
async def update_ai_settings(settings: AISettingsUpdate):
    data = settings.model_dump()
    data["id"] = "default"
    # Preserve existing keys if masked value sent
    existing = await db.ai_settings.find_one({"id": "default"}, {"_id": 0})
    if existing:
        if data["api_key"].endswith("...") or data["api_key"] == "***":
            data["api_key"] = existing.get("api_key", "")
        if data["stt_api_key"].endswith("...") or data["stt_api_key"] == "***":
            data["stt_api_key"] = existing.get("stt_api_key", "")
    await db.ai_settings.update_one({"id": "default"}, {"$set": data}, upsert=True)
    return {"status": "saved"}

# --- Digital Guide Generator ---
class GuideRequest(BaseModel):
    topic: str
    target_audience: str = ""
    num_chapters: int = 5

@api_router.post("/agents/generate-guide")
async def generate_digital_guide(req: GuideRequest):
    dna = await db.marketing_dna.find_one({"id": "default"}, {"_id": 0})
    style = ""
    if dna:
        style = f"סגנון: {dna.get('writing_style', '')}. טון: {dna.get('tone', '')}. {dna.get('custom_instructions', '')}"

    system_msg = f"""אתה מומחה ליצירת מדריכים דיגיטליים ושיווק שותפים. כתוב בעברית מלאה ומקצועית.
{style}"""

    user_msg = f"""צור מדריך דיגיטלי מלא בנושא: {req.topic}
קהל יעד: {req.target_audience or "כללי"}
מספר פרקים: {req.num_chapters}

צור את כל הפלטים הבאים (הפרד ביניהם עם ===SEPARATOR===):

1. מבנה המדריך - כותרת ראשית, תקציר מוכר, ורשימת פרקים עם תיאור קצר לכל פרק
===SEPARATOR===
2. דף נחיתה - כותרת מושכת, 5 נקודות מכירה (bullets), קריאה לפעולה, וטקסט תחתון שכנועי
===SEPARATOR===
3. רצף מיילים שיווקי - 3 מיילים: (א) מייל חימום, (ב) מייל ערך+הצעה, (ג) מייל דחיפות/סגירה. לכל מייל: נושא, גוף, CTA
===SEPARATOR===
4. פוסטים לשיווק שותפים - 3 פוסטים מוכנים לפרסום עם מקום ל-[קישור שותפים]. מותאמים לפייסבוק, אינסטגרם, ולינקדאין
===SEPARATOR===
5. Bio + CTA - טקסט ביו קצר + קריאה לפעולה מותאמים לכל פלטפורמה (פייסבוק, אינסטגרם, לינקדאין, טיקטוק)"""

    result = await ai_chat(system_msg, user_msg)
    parts = result.split("===SEPARATOR===")

    now = datetime.now(timezone.utc).isoformat()
    guide = {
        "id": str(uuid.uuid4()),
        "topic": req.topic,
        "target_audience": req.target_audience,
        "guide_structure": parts[0].strip() if len(parts) > 0 else "",
        "landing_page": parts[1].strip() if len(parts) > 1 else "",
        "email_sequence": parts[2].strip() if len(parts) > 2 else "",
        "affiliate_posts": parts[3].strip() if len(parts) > 3 else "",
        "bio_cta": parts[4].strip() if len(parts) > 4 else "",
        "created_at": now,
    }
    await db.digital_guides.insert_one(guide)
    guide.pop("_id", None)
    return guide

@api_router.get("/agents/guides")
async def list_guides(limit: int = 20):
    guides = await db.digital_guides.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return {"guides": guides, "total": len(guides)}

@api_router.get("/agents/guides/{guide_id}")
async def get_guide(guide_id: str):
    guide = await db.digital_guides.find_one({"id": guide_id}, {"_id": 0})
    if not guide:
        raise HTTPException(status_code=404, detail="מדריך לא נמצא")
    return guide

@api_router.delete("/agents/guides/{guide_id}")
async def delete_guide(guide_id: str):
    result = await db.digital_guides.delete_one({"id": guide_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="מדריך לא נמצא")
    return {"status": "deleted"}

# --- Affiliate Deal Finder ---
class AffiliateSearchRequest(BaseModel):
    niche: str
    keywords: str = ""
    region: str = "ישראל"

@api_router.post("/agents/find-affiliates")
async def find_affiliate_deals(req: AffiliateSearchRequest):
    system_msg = """אתה מומחה בשיווק שותפים (Affiliate Marketing) עם ידע נרחב בתוכניות שותפים גלובליות וישראליות.
ענה בעברית. תן מידע מעשי ומדויק."""

    user_msg = f"""חפש והצע תוכניות שיווק שותפים בנישה: {req.niche}
מילות מפתח: {req.keywords or req.niche}
אזור: {req.region}

צור את הפלטים הבאים (הפרד עם ===SEPARATOR===):

1. רשימת 5-8 תוכניות שותפים רלוונטיות. לכל תוכנית:
   - שם התוכנית/חברה
   - אחוז עמלה משוער
   - סוג (CPA/CPS/CPL)
   - קישור להרשמה (אם ידוע)
   - רמת קושי (קל/בינוני/מתקדם)
===SEPARATOR===
2. אסטרטגיית קידום - 3 שיטות מומלצות לקדם את המוצרים בנישה הזו, עם דוגמאות מעשיות
===SEPARATOR===
3. רעיונות לתוכן - 5 כותרות למאמרים/סרטונים שימשכו תנועה ויכללו קישורי שותפים בצורה טבעית
===SEPARATOR===
4. דוגמת פוסט מכירתי - פוסט מוכן לפרסום עם [קישור שותפים] שמוכר בלי להרגיש מכירתי"""

    result = await ai_chat(system_msg, user_msg)
    parts = result.split("===SEPARATOR===")

    now = datetime.now(timezone.utc).isoformat()
    deal = {
        "id": str(uuid.uuid4()),
        "niche": req.niche,
        "keywords": req.keywords,
        "region": req.region,
        "programs": parts[0].strip() if len(parts) > 0 else "",
        "strategy": parts[1].strip() if len(parts) > 1 else "",
        "content_ideas": parts[2].strip() if len(parts) > 2 else "",
        "sample_post": parts[3].strip() if len(parts) > 3 else "",
        "created_at": now,
    }
    await db.affiliate_searches.insert_one(deal)
    deal.pop("_id", None)
    return deal

@api_router.get("/agents/affiliates")
async def list_affiliate_searches(limit: int = 20):
    searches = await db.affiliate_searches.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return {"searches": searches, "total": len(searches)}

@api_router.delete("/agents/affiliates/{search_id}")
async def delete_affiliate_search(search_id: str):
    result = await db.affiliate_searches.delete_one({"id": search_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="חיפוש לא נמצא")
    return {"status": "deleted"}

# Include router

# --- Scheduled Posts ---
class ScheduledPostCreate(BaseModel):
    content_item_id: Optional[str] = None
    scheduled_date: str
    note: str = ""
    title: str = ""

@api_router.post("/calendar/schedule")
async def create_scheduled_post(post: ScheduledPostCreate):
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        "content_item_id": post.content_item_id,
        "scheduled_date": post.scheduled_date,
        "note": post.note,
        "title": post.title,
        "status": "pending",
        "created_at": now,
    }
    await db.scheduled_posts.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/calendar/schedule")
async def list_scheduled_posts(month: Optional[str] = None):
    query = {}
    if month:
        query["scheduled_date"] = {"$regex": f"^{month}"}
    posts = await db.scheduled_posts.find(query, {"_id": 0}).sort("scheduled_date", 1).to_list(200)
    return {"posts": posts}

@api_router.delete("/calendar/schedule/{post_id}")
async def delete_scheduled_post(post_id: str):
    result = await db.scheduled_posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="פרסום מתוזמן לא נמצא")
    return {"status": "deleted"}

@api_router.put("/calendar/schedule/{post_id}/done")
async def mark_scheduled_done(post_id: str):
    await db.scheduled_posts.update_one({"id": post_id}, {"$set": {"status": "done"}})
    return {"status": "updated"}

# --- Push Notifications ---
class PushSubscription(BaseModel):
    endpoint: str
    keys: dict

@api_router.get("/push/vapid-key")
async def get_vapid_key():
    return {"publicKey": os.environ.get("VAPID_PUBLIC_KEY", "")}

@api_router.post("/push/subscribe")
async def push_subscribe(sub: PushSubscription):
    doc = sub.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.push_subscriptions.update_one(
        {"endpoint": doc["endpoint"]},
        {"$set": doc},
        upsert=True
    )
    return {"status": "subscribed"}

@api_router.post("/push/send-test")
async def send_test_push():
    from pywebpush import webpush, WebPushException
    import json
    subs = await db.push_subscriptions.find({}, {"_id": 0}).to_list(50)
    sent = 0
    for sub in subs:
        try:
            webpush(
                subscription_info={"endpoint": sub["endpoint"], "keys": sub["keys"]},
                data=json.dumps({"title": "Orbit360", "body": "התזכורת שלך מ-Orbit360! 🚀", "url": "/calendar"}),
                vapid_private_key=os.environ.get("VAPID_PRIVATE_KEY", ""),
                vapid_claims={"sub": "mailto:orbit360@example.com"}
            )
            sent += 1
        except Exception as e:
            logger.error(f"Push send error: {e}")
    return {"sent": sent, "total": len(subs)}

@api_router.post("/push/notify-scheduled")
async def notify_scheduled_posts():
    from pywebpush import webpush
    import json
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    posts = await db.scheduled_posts.find({"scheduled_date": today, "status": "pending"}, {"_id": 0}).to_list(50)
    if not posts:
        return {"notified": 0}
    subs = await db.push_subscriptions.find({}, {"_id": 0}).to_list(50)
    notified = 0
    for post in posts:
        title = post.get("title") or post.get("note") or "פרסום מתוזמן"
        for sub in subs:
            try:
                webpush(
                    subscription_info={"endpoint": sub["endpoint"], "keys": sub["keys"]},
                    data=json.dumps({"title": "Orbit360 - הגיע הזמן לפרסם!", "body": title, "url": "/calendar"}),
                    vapid_private_key=os.environ.get("VAPID_PRIVATE_KEY", ""),
                    vapid_claims={"sub": "mailto:orbit360@example.com"}
                )
                notified += 1
            except Exception:
                pass
    return {"notified": notified}

# --- Trend Finder Agent ---
class TrendSearchRequest(BaseModel):
    niche: str
    platform: str = "כללי"

@api_router.post("/agents/find-trends")
async def find_trends(req: TrendSearchRequest):
    system_msg = """אתה מומחה בזיהוי טרנדים ויצירת כסף מהאינטרנט. יש לך ידע עמוק בשיווק דיגיטלי, מסחר אלקטרוני, שיווק שותפים, יצירת תוכן, ומונטיזציה.
ענה בעברית. תן מידע מעשי, ספציפי וממוקד ברווחים."""

    user_msg = f"""חפש טרנדים חמים בנישה: {req.niche}
פלטפורמה: {req.platform}

צור את הפלטים הבאים (הפרד עם ===SEPARATOR===):

1. 5 טרנדים חמים עכשיו - לכל טרנד:
   - שם הטרנד
   - למה הוא חם
   - פוטנציאל הכנסה (נמוך/בינוני/גבוה)
   - רמת תחרות
===SEPARATOR===
2. 3 דרכים לעשות כסף מכל טרנד - תוכנית פעולה מעשית עם:
   - שיטת מונטיזציה (שיווק שותפים, מוצר דיגיטלי, ייעוץ, פרסום)
   - הכנסה פוטנציאלית חודשית
   - זמן עד לתוצאות
   - השקעה נדרשת
===SEPARATOR===
3. רעיונות לתוכן ויראלי - 5 כותרות/רעיונות לתוכן שיכולים להפוך ויראליים בנישה הזו, עם טיפ לכל אחד
===SEPARATOR===
4. תוכנית פעולה ל-30 יום - צעדים מעשיים יום-יומיים להתחיל לייצר הכנסה מהטרנד הכי חם"""

    result = await ai_chat(system_msg, user_msg)
    parts = result.split("===SEPARATOR===")

    now = datetime.now(timezone.utc).isoformat()
    trend = {
        "id": str(uuid.uuid4()),
        "niche": req.niche,
        "platform": req.platform,
        "trends": parts[0].strip() if len(parts) > 0 else "",
        "monetization": parts[1].strip() if len(parts) > 1 else "",
        "viral_content": parts[2].strip() if len(parts) > 2 else "",
        "action_plan": parts[3].strip() if len(parts) > 3 else "",
        "created_at": now,
    }
    await db.trend_searches.insert_one(trend)
    trend.pop("_id", None)
    return trend

@api_router.get("/agents/trends")
async def list_trend_searches(limit: int = 20):
    searches = await db.trend_searches.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return {"searches": searches, "total": len(searches)}

@api_router.delete("/agents/trends/{search_id}")
async def delete_trend_search(search_id: str):
    result = await db.trend_searches.delete_one({"id": search_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="חיפוש לא נמצא")
    return {"status": "deleted"}

# --- Smart Import ---
class SmartImportRequest(BaseModel):
    text: str

@api_router.post("/import/smart")
async def smart_import(req: SmartImportRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="טקסט ריק")
    
    text_preview = req.text[:4000]
    system_msg = """אתה מומחה בסיווג תוכן בעברית. קיבלת טקסט שהודבק מגוגל דוקס.
ענה אך ורק בפורמט JSON הבא (בלי markdown, בלי backticks):
{"title": "כותרת קצרה וברורה", "folder_id": "אחד מ: torah, business, mental_snacks, general", "summary": "תקציר של משפט אחד"}

כללי סיווג:
- torah: תוכן תורני, שיעורים, פרשת שבוע, יהדות
- business: עסקים, שיווק, מכירות, יזמות, אסטרטגיה
- mental_snacks: מוטיבציה, השראה, פיתוח אישי, מנטליות
- general: כל דבר אחר"""

    result = await ai_chat(system_msg, f"סווג את הטקסט הזה:\n\n{text_preview}")
    
    import json as json_module
    try:
        clean = result.strip()
        if clean.startswith("```"):
            clean = clean.split("\n", 1)[1].rsplit("```", 1)[0]
        parsed = json_module.loads(clean)
    except Exception:
        parsed = {"title": req.text[:50].strip(), "folder_id": "general", "summary": ""}

    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        "title": parsed.get("title", req.text[:50]),
        "content": req.text,
        "folder_id": parsed.get("folder_id", "general"),
        "source_type": "import",
        "youtube_url": None,
        "strategy": None,
        "has_package": False,
        "created_at": now,
        "updated_at": now,
    }
    await db.content_items.insert_one(doc)
    doc.pop("_id", None)
    return {"item": doc, "detected": parsed}

# --- Chief Strategist Agent ---
class StrategistMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

@api_router.post("/agents/strategist/chat")
async def strategist_chat(req: StrategistMessage):
    all_content = await db.content_items.find({}, {"_id": 0, "title": 1, "content": 1, "folder_id": 1}).sort("created_at", -1).limit(30).to_list(30)
    
    knowledge_base = ""
    for item in all_content:
        knowledge_base += f"\n--- {item.get('title', '')} [{item.get('folder_id', '')}] ---\n{item.get('content', '')[:500]}\n"

    dna = await db.marketing_dna.find_one({"id": "default"}, {"_id": 0})
    dna_context = ""
    if dna:
        dna_context = f"סגנון המשתמש: {dna.get('writing_style', '')}. טון: {dna.get('tone', '')}. קהל יעד: {dna.get('target_audience', '')}."

    session_id = req.session_id or str(uuid.uuid4())
    
    history = await db.strategist_chats.find(
        {"session_id": session_id}, {"_id": 0}
    ).sort("created_at", 1).limit(10).to_list(10)
    
    history_text = ""
    for h in history:
        history_text += f"\nמשתמש: {h.get('user_message', '')}\nאסטרטג: {h.get('assistant_message', '')}\n"

    system_msg = f"""אתה "האסטרטג הראשי" — יועץ אסטרטגי עסקי ברמה הגבוהה ביותר. אתה מנטור מקצועי, חד, ישיר ומעצים.

הסגנון שלך:
- מדבר בגובה העיניים, בלי בולשיט
- מאתגר את המשתמש לחשוב גדול
- נותן צעדים מעשיים ומדידים
- משתמש בידע העסקי שלך + בידע של המשתמש
- לא מהסס להגיד "אתה טועה" אם צריך, אבל תמיד עם כבוד

{dna_context}

גוף הידע של המשתמש (תכנים שכתב):
{knowledge_base[:6000]}

היסטוריית שיחה:
{history_text}

ענה בעברית. תהיה ספציפי ומעשי."""

    response = await ai_chat(system_msg, req.message)
    
    now = datetime.now(timezone.utc).isoformat()
    chat_doc = {
        "id": str(uuid.uuid4()),
        "session_id": session_id,
        "user_message": req.message,
        "assistant_message": response,
        "created_at": now,
    }
    await db.strategist_chats.insert_one(chat_doc)
    chat_doc.pop("_id", None)
    
    return {"response": response, "session_id": session_id, "chat_id": chat_doc["id"]}

@api_router.get("/agents/strategist/sessions")
async def list_strategist_sessions():
    pipeline = [
        {"$group": {"_id": "$session_id", "last_message": {"$last": "$user_message"}, "created_at": {"$first": "$created_at"}, "count": {"$sum": 1}}},
        {"$sort": {"created_at": -1}},
        {"$limit": 20}
    ]
    sessions = await db.strategist_chats.aggregate(pipeline).to_list(20)
    return {"sessions": [{"session_id": s["_id"], "preview": s["last_message"][:60], "messages": s["count"], "created_at": s["created_at"]} for s in sessions]}

@api_router.get("/agents/strategist/chat/{session_id}")
async def get_strategist_chat(session_id: str):
    messages = await db.strategist_chats.find({"session_id": session_id}, {"_id": 0}).sort("created_at", 1).to_list(100)
    return {"messages": messages}

@api_router.delete("/agents/strategist/session/{session_id}")
async def delete_strategist_session(session_id: str):
    await db.strategist_chats.delete_many({"session_id": session_id})
    return {"status": "deleted"}

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
