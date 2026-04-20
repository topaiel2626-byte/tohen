# Self-Hosting Guide — מערך AI של אליאב צוף

## Quick Start (5 דקות)

### 1. Clone + Configure
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# Edit AI keys
nano backend/.env.production
```

Set your Groq key:
```
OPENAI_API_KEY=gsk_your_groq_key_here
OPENAI_BASE_URL=https://api.groq.com/openai/v1
AI_MODEL=llama-3.3-70b-versatile
STT_MODEL=whisper-large-v3
```

### 2. Launch
```bash
docker compose up -d --build
```

### 3. Done!
Open `http://YOUR_SERVER_IP` in browser.

---

## Custom Domain (Hostinger)

### With domain:
```bash
# In docker-compose.yml, set BACKEND_URL for the frontend:
environment:
  - BACKEND_URL=https://yourdomain.com

# Add HTTPS:
sudo apt install certbot -y
sudo certbot certonly --standalone -d yourdomain.com
```

### Change domain later:
Just change `BACKEND_URL` in docker-compose.yml and restart:
```bash
docker compose down && docker compose up -d
```
No rebuild needed!

---

## Architecture

```
Browser → Nginx (port 80)
            ├─ /api/* → Backend (FastAPI :8001)
            └─ /*     → Frontend (React SPA)
                         ↓
                    Backend → MongoDB (:27017)
                         ↓
                    AI Provider (Groq/OpenAI/Anthropic)
```

## AI Provider Options

| Provider | Base URL | Model | Cost |
|----------|----------|-------|------|
| Groq | https://api.groq.com/openai/v1 | llama-3.3-70b-versatile | Free |
| OpenAI | (empty) | gpt-4o | $$ |
| Together | https://api.together.xyz/v1 | meta-llama/Llama-3-70b | $ |
| Ollama (local) | http://localhost:11434/v1 | llama3 | Free |

Change via `.env.production` OR in-app at `/ai-settings`.

## Useful Commands
```bash
docker compose logs -f          # View logs
docker compose restart backend  # Restart backend
docker compose down             # Stop all
docker compose up -d --build    # Rebuild + start

# Backup MongoDB
docker exec strategic-inbox-mongo mongodump --out /data/backup
docker cp strategic-inbox-mongo:/data/backup ./backup

# Restore MongoDB
docker cp ./backup strategic-inbox-mongo:/data/backup
docker exec strategic-inbox-mongo mongorestore /data/backup
```
