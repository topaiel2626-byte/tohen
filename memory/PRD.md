# מערך AI של אליאב צוף - PRD

## Independence Status: FULLY SELF-HOSTED ✅
- Zero Emergent dependency
- AI via env vars (OPENAI_API_KEY + OPENAI_BASE_URL)
- Runtime frontend config (no rebuild to change domain)
- Docker production-ready

## Files for Self-Hosting
- `docker-compose.yml` - Full stack (backend + frontend + MongoDB)
- `backend/Dockerfile` - Python FastAPI
- `backend/.env.production` - AI keys template
- `frontend/Dockerfile` - Multi-stage React build + Nginx
- `frontend/nginx.conf` - API proxy + SPA routing + CORS
- `frontend/docker-entrypoint.sh` - Runtime URL injection
- `DEPLOY.md` - Complete deployment guide

## AI Provider Priority
1. ENV vars (OPENAI_API_KEY) → highest priority
2. DB settings (/ai-settings page) → fallback
3. Supports: Groq (free), OpenAI, Anthropic, Google, Ollama, any OpenAI-compatible
