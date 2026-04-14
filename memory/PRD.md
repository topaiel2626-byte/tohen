# Orbit360 Engine - PRD

## Problem Statement
Full-stack mobile-first Hebrew RTL web app for AI content management. YouTube analysis, voice recording, 4 folder organization, multi-channel content factory, marketing DNA settings, smart search, daily snack.

## Architecture
- **Backend**: FastAPI + MongoDB + emergentintegrations (Claude Sonnet 4.5, Whisper)
- **Frontend**: React + Tailwind + Shadcn UI, RTL Dark Glassmorphism
- **Database**: MongoDB (content_items, content_packages, marketing_dna)

## What's Been Implemented (Feb 2026)
- Dashboard with folder overview, quick actions, daily snack
- YouTube analyzer with auto transcript + manual fallback
- Voice recorder with microphone + manual text input
- Content library with 4 folders (Torah, Business, Mental Snacks, General)
- Content item detail view with strategy display
- Multi-channel content package generation (article, social, stories, SEO, titles)
- Marketing DNA settings page
- Smart search across all content
- History page with filters
- Mobile sidebar navigation
- Full RTL Hebrew support
- Dark mode glassmorphism design

## User Personas
- Hebrew-speaking content creators
- Business owners managing multi-channel content
- Torah educators and speakers

## Prioritized Backlog
### P0 (Done)
- Core CRUD, folders, search, history, settings, AI generation

### P1 (Next)
- Add content item editing
- Bulk export content packages
- Folder management (custom folders)

### P2 (Future)
- Analytics dashboard for content performance
- Team collaboration features
- Scheduled content publishing
