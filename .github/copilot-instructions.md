# SeekWell AI Coding Agent Instructions

## Project Overview
SeekWell is an AI-powered skin lesion detection platform for community health workers. The system enables patients to upload skin images, receive AI risk assessments, and connect with medical professionals for review.

**Architecture**: FastAPI backend + React/TypeScript frontend + HuggingFace AI model
**Deployment**: Backend on Render, Frontend on Vercel

## Critical Developer Knowledge

### 1. HuggingFace AI Integration (⚠️ CRITICAL)
The AI model uses **Gradio's queue-based SSE protocol**, not standard HTTP. This requires a specific implementation pattern:

**Correct Implementation** (`frontend/src/services/HuggingFaceAIService.ts`):
```typescript
// 1. Upload file first to Gradio space
const uploadedFiles = await this.uploadFile(file);

// 2. Create proper ImageData object with required metadata
const imageData = {
  path: uploadedFiles[0],
  url: null,
  size: file.size,
  orig_name: file.name,
  mime_type: file.type,
  is_stream: false,
  meta: { _type: "gradio.FileData" }  // REQUIRED for validation
};

// 3. Join queue with fn_index: 2 (from Gradio config)
const queueData = await this.joinQueue(imageData);

// 4. Poll results via SSE endpoint
const result = await this.waitForQueueResults(queueData.event_id, queueData.session_hash);
```

**Key Requirements**:
- Use `/gradio_api` prefix (not `/api`)
- Set `fn_index: 2` for the predict function
- Include `meta: { _type: "gradio.FileData" }` in image data
- Poll results at `/gradio_api/queue/data?session_hash=...`

See `ai/deployment/README.md` for official API documentation.

### 2. Database Setup & Initialization
**Command**: `python setup_seekwell_database.py` (from `backend/` directory)

This unified script handles:
- Schema creation/updates with SQLAlchemy models
- Initial user accounts (admin, doctors, community health workers)
- Missing column fixes and foreign key constraints
- Sample data population

**Default Admin**: `admin@seekwell.health` / `SeekWell2025!`

**Database Schema** (`backend/app/models.py`):
- `users`: Core authentication (email, hashed_password, role enum)
- `patients`: Extended user profile (FK to users.user_id)
- `analysis_results`: AI predictions with doctor review workflow
- `chat_messages`: User-AI conversation history

### 3. Authentication & Authorization Flow
**JWT-based with role-based access control**

**Login Flow** (`backend/app/routers/auth.py`):
1. User submits email/password via OAuth2PasswordRequestForm
2. Backend validates credentials and generates JWT with `{"sub": email, "role": role.value}`
3. Token returned with `role` and `user_id` in response body
4. Frontend stores in localStorage and includes in Authorization header

**Role Hierarchy** (defined in `backend/app/database.py`):
- `PATIENT`: Own data only
- `OFFICIAL`: Monitor community health, view urgent cases
- `DOCTOR`: Review all predictions, add diagnosis
- `ADMIN`: Full system access

**Middleware** (`backend/app/dependencies.py`):
- `get_current_user()`: Validates JWT and extracts user
- `get_current_active_admin()`, `get_current_active_doctor()`, etc.: Role-specific guards
- Use `Depends(get_current_active_doctor)` in route decorators for protection

### 4. i18n Implementation (English 🇺🇸 & Vietnamese 🇻🇳)
**Status**: ✅ Complete with 800+ translations across 15 components

**Configuration** (`frontend/src/i18n/config.ts`):
```typescript
// i18next with browser language detection
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();

// Usage in components
<h1>{t('login.title')}</h1>
```

**Translation Files**: `frontend/src/i18n/locales/{en,vi}.json`
**Language Switcher**: `frontend/src/components/common/LanguageSwitcher.tsx` (flag icons 🇺🇸 🇻🇳)

**TypeScript Workaround**: Due to TypeScript 4.9.5 module resolution issues with react-i18next, use `@ts-ignore` for `.use()` calls (see config.ts comments).

### 5. Development Workflow

**Backend Setup** (Python 3.11+):
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Copy template and edit with your settings
python setup_seekwell_database.py  # First time only
uvicorn app.main:app --reload      # http://localhost:8000
```

**Frontend Setup** (Node 16+):
```bash
cd frontend
npm install
cp .env.example .env  # Optional - defaults work for local dev
npm start  # http://localhost:3000
```

**Environment Variables**: Create `backend/.env` with these required settings:
```bash
# Database (PostgreSQL required)
DATABASE_URL=postgresql://user:password@localhost:5432/seekwell_db

# JWT Authentication
SECRET_KEY=your-secret-key-here-use-openssl-rand-hex-32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS (comma-separated origins)
ALLOWED_ORIGINS=http://localhost:3000,https://seekwell.vercel.app

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:3000

# Email Configuration (optional - for password reset)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_USE_TLS=True
MAIL_USE_SSL=False
MAIL_FROM=noreply@seekwell.health

# HuggingFace API (optional - backend AI prediction)
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxx

# Google AI (optional - chatbot features)
GOOGLE_API_KEY=your-google-api-key
```

**Generate SECRET_KEY**: `openssl rand -hex 32`

**Frontend Environment**: Create `frontend/.env` (optional):
```bash
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_HUGGINGFACE_SPACE_URL=https://bnmbanhmi-seekwell-skin-cancer.hf.space
REACT_APP_AI_CONFIDENCE_THRESHOLD=0.8
REACT_APP_ENVIRONMENT=development
```

**CORS Configuration** (`backend/app/main.py`):
- Reads from `ALLOWED_ORIGINS` env var (comma-separated)
- Defaults include: `http://localhost:3000`, `https://seekwell.vercel.app`

### 6. API Router Patterns
**Structure**: `backend/app/routers/{auth,users,patients,ai_prediction,reports}.py`

**Example Pattern**:
```python
from fastapi import APIRouter, Depends
from app.dependencies import get_current_active_doctor
from app.database import get_db

router = APIRouter()

@router.get("/patients/{patient_id}", tags=["Patients"])
async def get_patient(
    patient_id: int,
    current_user: models.User = Depends(get_current_active_doctor),
    db: Session = Depends(get_db)
):
    # Doctor-only endpoint with DB session
    ...
```

**Tags** for OpenAPI docs: Authentication, Users, Patients, AI Prediction, Reports & Analytics

### 7. Frontend Service Layer
**Structure**: `frontend/src/services/{HuggingFaceAIService,AIAnalysisService}.ts`

**Pattern**: Centralize API calls in services, not components
```typescript
// services/AIAnalysisService.ts
export async function submitAnalysis(data: SkinLesionAnalysisRequest): Promise<AIAnalysisResult> {
  const token = localStorage.getItem('accessToken');
  const response = await axios.post(`${API_CONFIG.BACKEND_URL}/ai/analyze`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}
```

**API Config**: `frontend/src/config/api.ts` centralizes backend URL and feature flags

### 8. TypeScript Conventions
- **React 19** with TypeScript 4.9.5
- **Material-UI v7** for components
- **Strict typing** for API responses (see `frontend/src/types/AIAnalysisTypes.ts`)
- Use `interface` for data shapes, `type` for unions/utilities

### 9. Common Pitfalls & Solutions

**Problem**: "ImageData validation error" in HuggingFace API
**Solution**: Must include `meta: { _type: "gradio.FileData" }` in image upload object

**Problem**: JWT "Could not validate credentials"
**Solution**: Ensure token payload includes both `sub` (email) and `role` fields. Check token expiry (default 1440 minutes).

**Problem**: CORS errors in development
**Solution**: Add origin to `ALLOWED_ORIGINS` in backend `.env`, or check CORS middleware in `main.py`

**Problem**: Database "column does not exist"
**Solution**: Run `python update_database_schema.py` or re-run `setup_seekwell_database.py`

**Problem**: i18next TypeScript errors
**Solution**: Use `@ts-ignore` directive before `.use()` calls (known issue with TS 4.9.5)

## File Navigation Cheat Sheet
- **API Routes**: `backend/app/routers/` (7 routers: auth, users, patients, ai_prediction, chat, password, reports)
- **Data Models**: `backend/app/models.py` (SQLAlchemy ORM)
- **Schemas/DTOs**: `backend/app/schemas.py` (Pydantic validation)
- **DB Operations**: `backend/app/crud.py` (CRUD operations)
- **Frontend Pages**: `frontend/src/pages/` + `frontend/src/components/` (dashboards per role)
- **i18n Translations**: `frontend/src/i18n/locales/{en,vi}.json`
- **AI Integration**: `frontend/src/services/HuggingFaceAIService.ts`, `backend/app/routers/ai_prediction.py`

## Testing & Quality

**Philosophy**: Manual testing via UI - verify each user flow works correctly

**Manual Testing Workflow**:
1. **Start services**: Backend (`uvicorn app.main:app --reload`) + Frontend (`npm start`)
2. **Test by role**: Login as different users to verify role-based access
3. **Core flows to test**:
   - Patient: Register → Upload image → View results → Check history
   - Doctor: Login → Review pending cases → Add diagnosis → View analytics
   - Official: Monitor community → Check urgent alerts → View reports
   - Admin: User management → System analytics

**Default Test Accounts** (after running `setup_seekwell_database.py`):
```
Admin:    admin@seekwell.health / SeekWell2025!
Doctor:   dermatologist@seekwell.health / DermExpert2025
Official: cadre.thailand@seekwell.health / CadreThailand2025
```

**API Testing**: Use Swagger UI at `http://localhost:8000/docs` to test endpoints directly

**Common Test Scenarios**:
- Image upload with various file types/sizes (max 10MB)
- JWT token expiry (default 24 hours)
- CORS from different origins
- Role-based access restrictions
- i18n language switching (English 🇺🇸 ↔️ Vietnamese 🇻🇳)

**Test Suite**: Not implemented - all testing is manual UI verification

## Deployment
- **Backend**: Render (Docker with `backend/Dockerfile`)
- **Frontend**: Vercel (CRA build, config in `frontend/vercel.json`)
- **CI/CD**: GitHub Actions (`.github/workflows/` for backend/frontend deployment)

## Additional Context
- **SETUP.md** - First-time setup guide with troubleshooting
- **LOCAL_DEVELOPMENT.md** - Local environment configuration with production values
- **DEPLOYMENT.md** - Vercel/Render deployment details and CI/CD
- **TODO.md** tracks active development priorities (i18n complete, username-only login next)
- **DEVELOPMENT.md** contains extended technical documentation
- **DATABASE_SETUP.md** explains database initialization process in detail
