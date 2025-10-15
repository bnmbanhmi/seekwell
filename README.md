# SeekWell

AI-powered skin lesion detection platform for community health workers.

## Architecture

**Backend:** FastAPI + PostgreSQL + SQLAlchemy + JWT  
**Frontend:** React 19 + TypeScript + Material-UI v7  
**AI:** HuggingFace Gradio (bnmbanhmi/seekwell-skin-cancer)  
**Deployment:** Backend on Render, Frontend on Vercel  
**i18n:** English & Vietnamese (react-i18next)

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 16+
- PostgreSQL 14+

### Backend Setup
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env: Set DATABASE_URL and generate SECRET_KEY with: openssl rand -hex 32
python setup_seekwell_database.py
uvicorn app.main:app --reload
```
Server: http://localhost:8000  
API Docs: http://localhost:8000/docs

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env  # Optional - defaults work for local dev
npm start
```
App: http://localhost:3000

### Default Login
```
Admin:    admin@seekwell.health / SeekWell2025!
Doctor:   dermatologist@seekwell.health / DermExpert2025
Official: cadre.thailand@seekwell.health / CadreThailand2025
```

## Database Setup

### Create Database
```bash
# macOS (Homebrew)
brew services start postgresql
createdb seekwell_db

# Or via psql
psql postgres -c "CREATE DATABASE seekwell_db;"
```

### Initialize Schema & Users
```bash
cd backend
python setup_seekwell_database.py
```

**Creates:**
- Tables: users, patients, analysis_results, chat_messages
- Admin account + 3 specialist doctors + 4 community health workers
- Regional health center with proper relationships

**Options:**
- `--skip-users` - Schema only, no user creation
- `--verbose` - Detailed output
- `--reset` - Drop all tables (requires "YES" confirmation)

### Connection String Format
```
postgresql://username:password@localhost:5432/seekwell_db
```

## Environment Configuration

### Backend (.env)
```bash
# Required
DATABASE_URL=postgresql://postgres:password@localhost:5432/seekwell_db
SECRET_KEY=<generate with: openssl rand -hex 32>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ALLOWED_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Optional
ENVIRONMENT=development
DEBUG=true
GOOGLE_API_KEY=<for chatbot>
HUGGINGFACE_API_KEY=<for backend AI endpoint>
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=<gmail>
MAIL_PASSWORD=<app password>
MAIL_FROM=noreply@seekwell.health
```

### Frontend (.env)
```bash
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_HUGGINGFACE_SPACE_URL=https://bnmbanhmi-seekwell-skin-cancer.hf.space
REACT_APP_AI_CONFIDENCE_THRESHOLD=0.8
REACT_APP_ENVIRONMENT=development
REACT_APP_ENABLE_OFFLINE_MODE=false
REACT_APP_ENABLE_PWA=false
```

## Deployment

### Vercel (Frontend)
**Repository:** bnmbanhmi/seekwell  
**Branch:** main (auto-deploy)  
**Root Directory:** frontend/  
**Build Command:** npm run build  
**Output Directory:** build

**Environment Variables:**
```bash
REACT_APP_BACKEND_URL=https://seekwell-backend.onrender.com
REACT_APP_HUGGINGFACE_SPACE_URL=https://bnmbanhmi-seekwell-skin-cancer.hf.space
REACT_APP_AI_CONFIDENCE_THRESHOLD=0.8
REACT_APP_ENVIRONMENT=production
REACT_APP_ENABLE_OFFLINE_MODE=true
REACT_APP_ENABLE_PWA=true
```

**Config:** See `frontend/vercel.json`

### Render (Backend)
**Repository:** bnmbanhmi/seekwell  
**Branch:** main (auto-deploy)  
**Root Directory:** backend/  
**Docker:** Uses `backend/Dockerfile`  
**Start Command:** uvicorn app.main:app --host 0.0.0.0 --port $PORT

**Environment Variables:**
```bash
DATABASE_URL=<cloud PostgreSQL connection string>
SECRET_KEY=<production secret>
ALLOWED_ORIGINS='["https://seekwell.vercel.app"]'
FRONTEND_URL=https://seekwell.vercel.app
ENVIRONMENT=production
DEBUG=false
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Production URLs
- Frontend: https://seekwell.vercel.app
- Backend: https://seekwell-backend.onrender.com
- AI Service: https://bnmbanhmi-seekwell-skin-cancer.hf.space

## API Structure

### Endpoints
**Auth:** `/auth/register`, `/auth/token`  
**Users:** `/users/me`, `/users` (admin), `/users/{id}` (admin)  
**Patients:** `/patients/search`, `/patients/{id}`, `/patients/{id}/analysis-history`  
**AI:** `/ai/analyze`, `/ai/predict`  
**Chat:** `/chat/send`  
**Password:** `/password/forgot`, `/password/reset`  
**Reports:** `/reports/urgent-cases`, `/reports/analytics`

### User Roles
- **PATIENT:** Own data only
- **OFFICIAL:** Monitor community, view urgent cases
- **DOCTOR:** Review predictions, add diagnosis
- **ADMIN:** Full system access

### Authentication
JWT-based with role-based access control. Token includes `{"sub": email, "role": role}`.

## AI Integration (Critical)

HuggingFace Gradio uses queue-based SSE protocol. Required pattern:

```typescript
// 1. Upload file to Gradio space
const uploadedFiles = await uploadFile(file);

// 2. Create ImageData with required metadata
const imageData = {
  path: uploadedFiles[0],
  url: null,
  size: file.size,
  orig_name: file.name,
  mime_type: file.type,
  is_stream: false,
  meta: { _type: "gradio.FileData" }  // REQUIRED
};

// 3. Join queue with fn_index: 2
const queueData = await fetch(`${HF_URL}/gradio_api/run/predict`, {
  method: 'POST',
  body: JSON.stringify({
    fn_index: 2,  // REQUIRED
    session_hash: sessionHash,
    data: [imageData]
  })
});

// 4. Poll results via SSE
const result = await pollResults(sessionHash);
```

**Key Requirements:**
- Use `/gradio_api` prefix (not `/api`)
- Set `fn_index: 2`
- Include `meta: { _type: "gradio.FileData" }`
- Poll at `/gradio_api/queue/data?session_hash=...`

**Implementation:** `frontend/src/services/HuggingFaceAIService.ts`

## Project Structure

```
backend/
├── app/
│   ├── routers/     # API endpoints
│   ├── models.py    # SQLAlchemy ORM
│   ├── schemas.py   # Pydantic validation
│   ├── crud.py      # Database operations
│   └── dependencies.py  # Auth middleware
├── setup_seekwell_database.py
└── .env

frontend/
├── src/
│   ├── components/  # React components
│   ├── services/    # API clients
│   ├── i18n/        # Translations (en.json, vi.json)
│   └── pages/       # Route pages
└── .env

ai/
├── deployment/      # Gradio app
└── models/          # AI model code
```

## TODO

### Active
- Simplify login: Username-only, email optional (backend/frontend changes needed)

### Backlog
- Rate limiting, input validation, DB indexes, caching, logging
- PDF export, email notifications, dark mode, mobile app, multi-image upload
- Unit tests, E2E tests, load testing

### Completed
- MVP deployed, JWT auth, role-based dashboards, AI integration, analysis history, urgent alerts, Vietnamese i18n (800+ translations)
