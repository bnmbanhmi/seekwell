# SeekWell: AI Skin Disease Screening

> Accessible skin disease screening using AI

## Quick Links

- [TODO.md](TODO.md) - Task tracker
- [DEVELOPMENT.md](DEVELOPMENT.md) - Technical guide

## What is SeekWell?

AI platform for early skin disease detection:
- **Patients** upload photos → AI risk assessment
- **Officials** monitor community → identify urgent cases
- **Doctors** review AI predictions → provide diagnosis
- **Admins** manage system

## Quick Start

### Prerequisites
Python 3.11+, Node.js 16+, PostgreSQL 14+

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python setup_seekwell_database.py
uvicorn app.main:app --reload
```
http://localhost:8000

### Frontend
```bash
cd frontend
npm install && npm start
```
http://localhost:3000

**Login:** admin@seekwell.com / admin123

## Tech Stack

- **Backend:** FastAPI + PostgreSQL
- **Frontend:** React + TypeScript + Material-UI
- **AI:** HuggingFace (bnmbanhmi/seekwell-skin-cancer)
- **Auth:** JWT

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
