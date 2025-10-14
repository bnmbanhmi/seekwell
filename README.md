# SeekWell: AI Skin Disease Screening

> Accessible skin disease screening using AI

## Quick Links

- 🚀 [SETUP.md](SETUP.md) - **Start here!** Complete setup guide
- 💻 [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) - Local dev environment setup
- 🌐 [DEPLOYMENT.md](DEPLOYMENT.md) - Vercel/Render deployment guide
- ✅ [TODO.md](TODO.md) - Task tracker
- 📖 [DEVELOPMENT.md](DEVELOPMENT.md) - Technical guide
- 🤖 [.github/copilot-instructions.md](.github/copilot-instructions.md) - AI coding agent guide

## What is SeekWell?

AI platform for early skin disease detection:
- **Patients** upload photos → AI risk assessment
- **Officials** monitor community → identify urgent cases
- **Doctors** review AI predictions → provide diagnosis
- **Admins** manage system

## Quick Start

**New to SeekWell?** → See [SETUP.md](SETUP.md) for detailed setup instructions

### Prerequisites
Python 3.11+, Node.js 16+, PostgreSQL 14+

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Create .env from template (edit with your settings)
cp .env.example .env

# Initialize database with default accounts
python setup_seekwell_database.py

# Start server
uvicorn app.main:app --reload
```
http://localhost:8000

### Frontend
```bash
cd frontend
npm install && npm start
```
http://localhost:3000

**Default Login:** admin@seekwell.health / SeekWell2025!

## Tech Stack

- **Backend:** FastAPI + PostgreSQL
- **Frontend:** React + TypeScript + Material-UI
- **AI:** HuggingFace (bnmbanhmi/seekwell-skin-cancer)
- **Auth:** JWT
- **i18n:** English 🇺🇸 & Vietnamese 🇻🇳 (800+ translations)

## Structure

```
seekwell/
├── backend/app/    # API (routers, models, schemas)
├── backend/ai/     # AI integration
└── frontend/src/   # React app (components, services, i18n)
```

## User Roles

| Role | Access |
|------|--------|
| Patient | Upload photos, view own history |
| Official | Monitor community, urgent alerts |
| Doctor | Review predictions, add diagnosis |
| Admin | Full access |
