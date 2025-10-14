# Local Development Setup Guide

This guide shows you how to set up SeekWell on your local machine for development and testing.

## 🎯 Quick Setup (5 minutes)

### Step 1: Backend Environment Setup

```bash
cd backend

# Copy the template
cp .env.example .env

# Edit .env with your local settings
nano .env  # or use your preferred editor
```

**Required changes in `backend/.env`:**

```bash
# 1. Database - Use your LOCAL PostgreSQL
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/seekwell_db

# 2. Secret Key - Generate a new one for local dev
SECRET_KEY=your-local-secret-key-here

# 3. CORS - Allow local frontend
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# 4. Frontend URL - Point to local
FRONTEND_URL=http://localhost:3000

# 5. Google API Key - Use production key or get a new one
GOOGLE_API_KEY=AIzaSyDeHnctQpsL4xmhgvlYhgbyn-OePwXTlm0

# 6. Environment - Set to development
ENVIRONMENT=development
DEBUG=true

# 7. Token expiration - Longer for convenience
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

**Generate your local SECRET_KEY:**
```bash
openssl rand -hex 32
# Copy the output and paste into .env
```

### Step 2: Frontend Environment Setup

```bash
cd frontend

# Copy the template
cp .env.example .env
```

**Your `frontend/.env` should have:**

```bash
# Point to LOCAL backend (IMPORTANT!)
REACT_APP_BACKEND_URL=http://localhost:8000

# HuggingFace Space (same as production)
REACT_APP_HUGGINGFACE_SPACE_URL=https://bnmbanhmi-seekwell-skin-cancer.hf.space

# AI settings (same as production)
REACT_APP_AI_CONFIDENCE_THRESHOLD=0.8

# Development environment
REACT_APP_ENVIRONMENT=development

# Disable PWA features for easier debugging
REACT_APP_ENABLE_OFFLINE_MODE=false
REACT_APP_ENABLE_PWA=false
```

### Step 3: Create Local Database

```bash
# Start PostgreSQL (if not running)
brew services start postgresql  # macOS
# OR
sudo systemctl start postgresql  # Linux

# Create database
createdb seekwell_db

# Verify connection
psql -d seekwell_db -c "SELECT version();"
```

### Step 4: Initialize Database & Start Services

```bash
# Backend (Terminal 1)
cd backend
source .venv/bin/activate
python setup_seekwell_database.py  # Creates tables + default accounts
uvicorn app.main:app --reload

# Frontend (Terminal 2)
cd frontend
npm start
```

✅ **Backend**: http://localhost:8000  
✅ **Frontend**: http://localhost:3000  
✅ **API Docs**: http://localhost:8000/docs

### Step 5: Test Login

Open http://localhost:3000 and login with:

- **Email**: `admin@seekwell.health`
- **Password**: `SeekWell2025!`

## 🔄 Local vs Production Differences

| Setting | Local Development | Production (Vercel/Render) |
|---------|------------------|----------------------------|
| **Backend URL** | `http://localhost:8000` | `https://seekwell-backend.onrender.com` |
| **Database** | Local PostgreSQL | Cloud PostgreSQL (34.171.10.156) |
| **Token Expiry** | 1440 min (24h) | 30 min |
| **DEBUG** | `true` | `false` |
| **CORS** | `http://localhost:3000` | `https://seekwell.vercel.app` |
| **PWA/Offline** | `false` | `true` |
| **Environment** | `development` | `production` |

## 🧪 Testing Different Scenarios

### Test with Local Backend + Local Frontend
This is the standard development setup:
```bash
# backend/.env
DATABASE_URL=postgresql://postgres:password@localhost:5432/seekwell_db
ALLOWED_ORIGINS=http://localhost:3000

# frontend/.env
REACT_APP_BACKEND_URL=http://localhost:8000
```

### Test Local Frontend with Production Backend
Useful for testing frontend changes without running backend:
```bash
# frontend/.env
REACT_APP_BACKEND_URL=https://seekwell-backend.onrender.com
```

⚠️ **Note**: You'll need to add `http://localhost:3000` to production CORS settings on Render.

### Test with Production Database
If you want to test with real production data locally:
```bash
# backend/.env
DATABASE_URL=postgresql://postgres:x{&auk:zx{vrIie4@34.171.10.156:5432/seekwell
```

⚠️ **Warning**: Be careful! This connects to REAL production data. Changes will affect live users.

## 🚀 Quick Reference Commands

### Backend Commands
```bash
cd backend
source .venv/bin/activate

# Start server
uvicorn app.main:app --reload

# Reset database (destroys all data!)
python setup_seekwell_database.py --reset

# Fix database schema only
python setup_seekwell_database.py --skip-users

# Check database connection
python -c "from app.database import engine; print(engine.connect())"
```

### Frontend Commands
```bash
cd frontend

# Start development server
npm start

# Build for production (test production build)
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check
```

### Database Commands
```bash
# Connect to local database
psql -d seekwell_db

# List all tables
\dt

# Check users
SELECT user_id, email, role FROM users;

# Check analysis results
SELECT result_id, patient_id, prediction, risk_level FROM analysis_results;

# Exit psql
\q
```

## 🔧 Troubleshooting

### Frontend can't connect to backend

**Symptom**: CORS errors or "Network Error" in browser console

**Solutions**:
1. Check `REACT_APP_BACKEND_URL` in `frontend/.env` matches your backend URL
2. Verify backend is running: `curl http://localhost:8000/health`
3. Check CORS in `backend/.env`: `ALLOWED_ORIGINS=http://localhost:3000`
4. Restart both services after changing .env files

### Database connection failed

**Symptom**: `sqlalchemy.exc.OperationalError`

**Solutions**:
1. Check PostgreSQL is running: `brew services list` (macOS)
2. Verify DATABASE_URL in `backend/.env`
3. Test connection: `psql -d seekwell_db`
4. Create database if missing: `createdb seekwell_db`

### JWT token issues

**Symptom**: "Could not validate credentials" errors

**Solutions**:
1. Generate new SECRET_KEY: `openssl rand -hex 32`
2. Update SECRET_KEY in `backend/.env`
3. Restart backend server
4. Clear browser localStorage and login again

### Changes not reflected

**Solution**: Restart the service after changing .env files
```bash
# Frontend: Ctrl+C then npm start
# Backend: Ctrl+C then uvicorn app.main:app --reload
```

### Port already in use

**Symptom**: `Address already in use` error

**Solutions**:
```bash
# Find and kill process on port 8000 (backend)
lsof -ti:8000 | xargs kill -9

# Find and kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

## 📊 Checking Your Setup

Run these commands to verify everything is configured correctly:

### Backend Health Check
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy", ...}
```

### Frontend Environment
```bash
cd frontend
cat .env
# Should show REACT_APP_BACKEND_URL=http://localhost:8000
```

### Database Connection
```bash
cd backend
source .venv/bin/activate
python -c "
from app.database import SessionLocal
from app.models import User
db = SessionLocal()
users = db.query(User).count()
print(f'✅ Database connected. Users: {users}')
db.close()
"
```

## 🔐 Environment Variables Cheat Sheet

### Backend (.env)
```bash
# Required
DATABASE_URL=postgresql://postgres:password@localhost:5432/seekwell_db
SECRET_KEY=<openssl rand -hex 32>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ALLOWED_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Optional
GOOGLE_API_KEY=AIzaSyDeHnctQpsL4xmhgvlYhgbyn-OePwXTlm0
ENVIRONMENT=development
DEBUG=true
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

### Frontend (.env)
```bash
# Required for local dev
REACT_APP_BACKEND_URL=http://localhost:8000

# Optional (have working defaults)
REACT_APP_HUGGINGFACE_SPACE_URL=https://bnmbanhmi-seekwell-skin-cancer.hf.space
REACT_APP_AI_CONFIDENCE_THRESHOLD=0.8
REACT_APP_ENVIRONMENT=development
REACT_APP_ENABLE_OFFLINE_MODE=false
REACT_APP_ENABLE_PWA=false
```

## 🔄 Syncing with Production

If you want to test with production data/settings:

### Option 1: Use Production Backend
```bash
# frontend/.env
REACT_APP_BACKEND_URL=https://seekwell-backend.onrender.com
```

### Option 2: Use Production Database
```bash
# backend/.env
DATABASE_URL=postgresql://postgres:x{&auk:zx{vrIie4@34.171.10.156:5432/seekwell
```

⚠️ **Always backup production database before testing!**

## 📝 Next Steps

- ✅ Test user flows: Login → Upload image → View results
- ✅ Test all user roles: Admin, Doctor, Official, Patient
- ✅ Check API docs: http://localhost:8000/docs
- ✅ Test i18n: Switch between English 🇺🇸 and Vietnamese 🇻🇳

---

**Need help?** Check [SETUP.md](SETUP.md) for initial setup or [DEVELOPMENT.md](DEVELOPMENT.md) for technical details.
