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
- Frontend: React, TailwindCSS, Shadcn UI, RTL Hebrew, @hebcal/core
- Backend: FastAPI, Motor (Async MongoDB), openai SDK, anthropic SDK, google-generativeai SDK
- AI: Flexible provider system (Emergent/OpenAI/Anthropic/Google/OpenAI-Compatible)
- External: youtube-transcript-api

## Architecture
```
/app
├── backend/
│   ├── server.py (All API endpoints)
│   ├── ai_provider.py (Flexible AI abstraction layer)
│   ├── .env
│   └── tests/
├── frontend/
│   ├── public/ (manifest.json, sw.js, icons)
│   └── src/
│       ├── App.js (Router + Layout)
│       ├── hooks/usePwaInstall.js
│       ├── components/ (Sidebar, DailySnack, ui/)
│       ├── lib/api.js
│       └── pages/
│           ├── Dashboard.jsx
│           ├── YouTubeAnalyzer.jsx
│           ├── VoiceRecorder.jsx
│           ├── Library.jsx
│           ├── ContentItem.jsx
│           ├── Settings.jsx (Marketing DNA + Backup/Restore)
│           ├── History.jsx
│           ├── AISettings.jsx (Flexible AI provider config)
│           ├── HebrewCalendar.jsx (Hebrew + Gregorian calendar)
│           ├── DigitalGuides.jsx (Guide generation agent)
│           └── AffiliateFinder.jsx (Affiliate deal finder agent)
```

## DB Collections
- `content_items`: {id, title, content, folder_id, source_type, youtube_url, strategy, has_package, created_at, updated_at}
- `content_packages`: {id, content_item_id, article, social_post, stories_scripts, seo_keywords, video_titles, created_at}
- `marketing_dna`: {id, writing_style, tone, target_audience, brand_values, custom_instructions}
- `ai_settings`: {id, provider, api_key, api_url, model, stt_provider, stt_api_key, stt_api_url, stt_model}
- `digital_guides`: {id, topic, target_audience, guide_structure, landing_page, email_sequence, affiliate_posts, bio_cta, created_at}
- `affiliate_searches`: {id, niche, keywords, region, programs, strategy, content_ideas, sample_post, created_at}

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
- [x] Flexible AI provider system (Emergent, OpenAI, Anthropic, Google, OpenAI-Compatible)
- [x] Hebrew + Gregorian calendar with holidays
- [x] Digital Guides agent (guide structure, landing page, emails, affiliate posts, bio+CTA)
- [x] Affiliate Deal Finder agent (programs, strategy, content ideas, sample posts)

## Backlog
- [ ] P2: "Regenerate section" feature (regenerate specific part of content package)
