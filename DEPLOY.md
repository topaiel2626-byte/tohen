# מדריך התקנה — מערך AI של אליאב צוף

## דרישות מינימום
- שרת VPS עם Docker (Hostinger VPS / כל שרת לינוקס)
- דומיין (אופציונלי אבל מומלץ)

## התקנה מהירה (5 דקות)

### 1. התחבר לשרת
```bash
ssh root@YOUR_SERVER_IP
```

### 2. התקן Docker
```bash
curl -fsSL https://get.docker.com | sh
sudo systemctl enable docker
```

### 3. שלוף את הקוד
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

### 4. העתק את קובץ ה-Environment
```bash
cp .env.docker .env
```

### 5. הפעל!
```bash
docker compose up -d --build
```

### 6. זהו! האפליקציה רצה
פתח בדפדפן: `http://YOUR_SERVER_IP`

## הגדרת AI (Groq - חינם)
1. היכנס לאפליקציה
2. לחץ על תפריט → "הגדרות AI"
3. בחר "OpenAI-Compatible"
4. API URL: `https://api.groq.com/openai/v1`
5. API Key: המפתח שלך מ-Groq
6. Model: `llama-3.3-70b-versatile`
7. שמור

## הוספת HTTPS (מומלץ)
```bash
sudo apt install certbot -y
sudo certbot certonly --standalone -d yourdomain.com
```
ואז עדכן את nginx.conf בfrontend.

## פקודות שימושיות
```bash
# צפה בלוגים
docker compose logs -f

# עצור הכל
docker compose down

# עדכון קוד
git pull && docker compose up -d --build

# גיבוי MongoDB
docker exec orbit360-mongo mongodump --out /data/backup
docker cp orbit360-mongo:/data/backup ./backup
```
