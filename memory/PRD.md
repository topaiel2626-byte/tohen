# Orbit360 Engine - PRD

## Original Problem Statement
Build a full-stack Mobile-First Hebrew RTL web app named "Orbit360 Engine". AI-powered content management system with persistent database.

## Tech Stack
- Frontend: React, TailwindCSS, Shadcn UI, RTL Hebrew, @hebcal/core
- Backend: FastAPI, Motor (Async MongoDB), openai SDK, anthropic SDK, google-generativeai, pywebpush
- AI: Flexible provider system (Emergent/OpenAI/Anthropic/Google/OpenAI-Compatible)
- External: youtube-transcript-api

## Architecture
```
/app
├── backend/
│   ├── server.py (All API endpoints)
│   ├── ai_provider.py (Flexible AI abstraction layer)
│   └── tests/
├── frontend/
│   ├── public/ (manifest.json, sw.js with push support, icons)
│   └── src/
│       ├── App.js, App.css, index.css
│       ├── hooks/usePwaInstall.js
│       ├── components/ (Sidebar, DailySnack, ui/)
│       ├── lib/api.js
│       └── pages/
│           ├── Dashboard.jsx (with quick actions for all features)
│           ├── YouTubeAnalyzer.jsx, VoiceRecorder.jsx
│           ├── Library.jsx, ContentItem.jsx
│           ├── Settings.jsx (Marketing DNA + Backup/Restore)
│           ├── History.jsx
│           ├── AISettings.jsx (Flexible AI provider config)
│           ├── HebrewCalendar.jsx (Calendar + scheduling + push + Google Cal)
│           ├── DigitalGuides.jsx (Guide generation agent)
│           ├── AffiliateFinder.jsx (Affiliate deal finder agent)
│           └── TrendFinder.jsx (Trend + monetization agent)
```

## DB Collections
- content_items, content_packages, marketing_dna, ai_settings
- digital_guides, affiliate_searches, trend_searches
- scheduled_posts, push_subscriptions

## Completed Features
- [x] Base (React + FastAPI + MongoDB, RTL, Dark mode, Glassmorphism)
- [x] YouTube Analyzer + Voice Recorder + Library + Content Generation
- [x] Marketing DNA + Smart search + History + Daily Snack
- [x] Content editing + Bulk export
- [x] PWA (manifest, service worker, install button)
- [x] Full data backup & restore
- [x] Flexible AI provider (Emergent/OpenAI/Anthropic/Google/OpenAI-Compatible)
- [x] Hebrew + Gregorian calendar with holidays
- [x] Digital Guides agent
- [x] Affiliate Deal Finder agent
- [x] Calendar scheduling (assign content to dates, mark done)
- [x] Push notifications via PWA
- [x] Google Calendar export links
- [x] Trend Finder + monetization agent
- [x] UI refresh with vibrant colors and glow effects

## Backlog
- [ ] P2: "Regenerate section" feature
