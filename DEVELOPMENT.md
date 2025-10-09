# Development Guide

## Architecture

**Backend:** FastAPI + PostgreSQL + SQLAlchemy + JWT  
**Frontend:** React 19 + TypeScript + Material-UI  
**AI:** HuggingFace Gradio (bnmbanhmi/seekwell-skin-cancer)

## Setup

### Backend
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python3 setup_seekwell_database.py  # Creates DB + admin
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install && npm start
```

**DB:** seekwell_db with tables: users, patients, analysis_results, chat_messages  
**Admin:** admin@seekwell.com / admin123

## Database Schema

**users:** id, username, email, hashed_password, role (PATIENT/DOCTOR/OFFICIAL/ADMIN), full_name, created_at

**patients:** user_id FK, date_of_birth, gender, phone_number, address, emr_summary

**analysis_results:** id, patient_id FK, image_url, ai_prediction JSON, risk_level (LOW/MEDIUM/HIGH/URGENT), doctor_notes, reviewed_by FK, created_at

## API Endpoints

**Auth:** POST /auth/register, POST /auth/token

**Users:** GET /users/me, GET /users (Admin), PUT /users/{id} (Admin)

**Patients:** GET /patients/search (Doctor/Official), GET /patients/{id}, POST /patients/{id}/ai-prediction, GET /patients/{id}/analysis-history

**AI:** POST /ai/predict

**Reports:** GET /reports/urgent-cases (Doctor/Official), GET /reports/analytics (Admin)

## AI Integration (Critical)

HuggingFace Gradio requires specific config:

```typescript
const HF_URL = "https://bnmbanhmi-seekwell-skin-cancer.hf.space";
const sessionHash = Math.random().toString(36).substring(2);

// Step 1: Send prediction
await fetch(`${HF_URL}/gradio_api/run/predict`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fn_index: 2,  // CRITICAL
    session_hash: sessionHash,
    data: [{
      path: null,
      url: `data:${file.type};base64,${base64}`,
      size: file.size,
      orig_name: file.name,
      mime_type: file.type,
      is_stream: false,
      meta: { _type: "gradio.FileData" }  // CRITICAL
    }]
  })
});

// Step 2: Poll result
const pollUrl = `${HF_URL}/gradio_api/queue/data?session_hash=${sessionHash}`;
```

**Why:** `/gradio_api` prefix + `fn_index: 2` + `gradio.FileData` format required  
**Files:** frontend/src/services/HuggingFaceAIService.ts, backend/app/routers/ai_prediction.py

## Auth Flow

1. User → POST /auth/token
2. Backend validates → JWT (user_id + role)
3. Frontend stores in localStorage
4. Requests → Authorization: Bearer <token>
5. Middleware validates → extracts user

**Roles:** Patient (own data), Doctor/Official (all patients + notes), Admin (full access)

## i18n Implementation

**Status:** ✅ Complete (12 components support English 🇺🇸 and Vietnamese 🇻🇳)

**Structure:**
```
frontend/src/i18n/
├── config.ts              # i18next initialization
└── locales/
    ├── en.json           # English translations (800+ keys)
    └── vi.json           # Vietnamese translations (800+ keys)
```

**Dependencies:**
- `i18next@23.15.1` (v24 incompatible with TS 4.9.5)
- `react-i18next@14.1.2`
- `i18next-browser-languagedetector@8.0.2`

**Converted Components:**
1. LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage
2. PatientDashboard, DoctorDashboard, OfficialDashboard, AdminDashboard
3. Profile, AISkinAnalysisPage, MobileNavigation, PatientSearch

**Usage Pattern:**
```typescript
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../common/LanguageSwitcher';

const Component = () => {
  const { t } = useTranslation();
  return (
    <div>
      <LanguageSwitcher /> {/* 🇺🇸 🇻🇳 flag buttons */}
      <h1>{t('dashboard.title')}</h1>
    </div>
  );
};
```

**Features:**
- Persistent language selection (localStorage)
- Auto-detection from browser language
- LanguageSwitcher component with flag icons
- 800+ translation keys organized by namespace

**Key Namespaces:** common, login, register, dashboard.*, profile, aiAnalysis, mobileNav, patientSearch

## Deployment

**Frontend (Vercel):** Auto-deploy on push, env: REACT_APP_API_URL

**Backend (Railway/Render):** Env: DATABASE_URL, SECRET_KEY, ALGORITHM (HS256), ACCESS_TOKEN_EXPIRE_MINUTES (30)

**DB:** Managed PostgreSQL, run setup script once, enable backups

## Testing

**Backend:** `cd backend && pytest`  
**Frontend:** `cd frontend && npm test`

**Manual:**
- Login/logout all roles
- Image upload & prediction
- Analysis history
- Urgent cases
- User management (Admin)
- Language switching (post-i18n)

## Common Issues

**npm not found:** Install Node.js  
**DB connection:** `pg_isready`  
**AI fails:** Check HF Space online, fn_index: 2, gradio.FileData format  
**JWT expired:** 30min default, re-login  
**CORS:** Update main.py for production

## Key Dependencies

**Backend:** fastapi 0.115.12, sqlalchemy 2.0.36, psycopg2-binary 2.9.10, python-jose 3.3.0, passlib 1.7.4

**Frontend:** react 19.1.0, typescript 4.9.5, @mui/material 7.1.1, axios 1.7.9, i18next 23.15.1, react-i18next 14.1.2

## Resources

- FastAPI: https://fastapi.tiangolo.com
- React: https://react.dev
- Material-UI: https://mui.com
- HuggingFace: https://huggingface.co/spaces
- PostgreSQL: https://postgresql.org/docs
