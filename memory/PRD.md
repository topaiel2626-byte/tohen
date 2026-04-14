# Orbit360 Engine - PRD

## Original Problem Statement
Build a full-stack Mobile-First Hebrew RTL web app named "Orbit360 Engine". AI-powered content management system with persistent database.

## Core Requirements
1. **Data Management**: Save content/transcripts in DB, history page with search/filter, mobile-first UI with sidebar
2. **AI Input**: YouTube link analyzer (auto-transcribe + strategy), Voice recording (speech-to-text)
3. **Library Folders**: 4 fixed folders (Torah, Business & Marketing, Motivation Snacks, General Ideas)
4. **Content Generation**: Multi-channel packages (Article, LinkedIn/FB post, TikTok/Insta scripts, SEO/Hashtags, 3 video titles)
5. **Advanced Features**: Marketing DNA (tone settings), Smart search, "Daily Snack" (random motivation idea)
6. **UI/UX**: Premium SaaS design, Dark Mode, Glassmorphism, 100% RTL, PWA capability

## Tech Stack
- Frontend: React, TailwindCSS, Shadcn UI, RTL Hebrew
- Backend: FastAPI, Motor (Async MongoDB)
- AI: Claude Sonnet 4.5 (via Emergent LLM Key), OpenAI Whisper (via Emergent LLM Key)
- External: youtube-transcript-api

## Architecture
```
/app
├── backend/
│   ├── server.py (All API endpoints)
│   ├── .env (MONGO_URL, DB_NAME, EMERGENT_API_KEY)
│   └── tests/
├── frontend/
│   ├── public/ (manifest.json, sw.js, icons)
│   └── src/
│       ├── App.js (Router + Layout)
│       ├── hooks/usePwaInstall.js
│       ├── components/ (Sidebar, DailySnack, ui/)
│       ├── lib/api.js
│       └── pages/ (Dashboard, YouTubeAnalyzer, VoiceRecorder, Library, ContentItem, Settings, History)
```

## DB Schema
- `content_items`: {id, title, content, folder_id, source_type, youtube_url, marketing_dna, created_at, updated_at}
- `content_packages`: {id, item_id, content: {article, social_post, stories, seo, video_titles}, created_at}
- `marketing_dna`: {id, tone}

## Completed Features
- [x] Base project setup (React + FastAPI + MongoDB, RTL, Dark mode, Glassmorphism)
- [x] YouTube Analyzer (auto-transcribe + strategy generation)
- [x] Voice Recorder (Whisper speech-to-text)
- [x] Library with 4 fixed folders
- [x] Content generation (multi-channel packages)
- [x] Marketing DNA settings
- [x] Smart search & History
- [x] Daily Snack
- [x] Content editing capability
- [x] Bulk export for content packages
- [x] PWA / "Add to Home Screen" (manifest.json, service worker, install button)
- [x] Full data backup & restore (export all data as JSON, restore from file)

## Backlog
- [ ] P2: "Regenerate section" feature (regenerate specific part of content package)
