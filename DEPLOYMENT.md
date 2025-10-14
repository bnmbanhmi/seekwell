# SeekWell Deployment Guide

This document describes the current deployment setup for SeekWell on Vercel (frontend) and Render (backend).

## 🏗️ Current Architecture

```
┌─────────────────────────────────────────────┐
│  Frontend (Vercel)                          │
│  https://seekwell.vercel.app                │
│  - React 19 + TypeScript                   │
│  - Auto-deploy from main branch            │
└──────────────┬──────────────────────────────┘
               │ HTTPS
               ▼
┌─────────────────────────────────────────────┐
│  Backend (Render)                           │
│  https://seekwell-backend.onrender.com      │
│  - FastAPI + PostgreSQL                     │
│  - Docker deployment                        │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Database (Cloud PostgreSQL)                │
│  34.171.10.156:5432                         │
└─────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  AI Service (HuggingFace Spaces)            │
│  https://bnmbanhmi-seekwell-skin-cancer     │
│  .hf.space                                  │
└─────────────────────────────────────────────┘
```

## 📦 Frontend Deployment (Vercel)

### Configuration

**Platform**: Vercel  
**Repository**: bnmbanhmi/seekwell  
**Branch**: main (auto-deploy)  
**Build Command**: `npm run build`  
**Output Directory**: `build`  
**Root Directory**: `frontend/`

### Environment Variables (Vercel)

Set these in Vercel Dashboard → Settings → Environment Variables:

```bash
REACT_APP_BACKEND_URL=https://seekwell-backend.onrender.com
REACT_APP_HUGGINGFACE_SPACE_URL=https://bnmbanhmi-seekwell-skin-cancer.hf.space
REACT_APP_AI_CONFIDENCE_THRESHOLD=0.8
REACT_APP_ENVIRONMENT=production
REACT_APP_ENABLE_OFFLINE_MODE=true
REACT_APP_ENABLE_PWA=true
```

### Vercel Configuration File

Located at `frontend/vercel.json`:
```json
{
  "version": 2,
  "framework": "create-react-app",
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Manual Deployment

```bash
# Install Vercel CLI (first time only)
npm i -g vercel

# Deploy from frontend directory
cd frontend
vercel --prod
```

### Deployment Triggers

- **Auto**: Push to `main` branch → triggers automatic deployment
- **Manual**: Use Vercel Dashboard → Deployments → Redeploy
- **CLI**: Run `vercel --prod` from frontend directory

## 🖥️ Backend Deployment (Render)

### Configuration

**Platform**: Render  
**Service Type**: Web Service  
**Repository**: bnmbanhmi/seekwell  
**Branch**: main (auto-deploy)  
**Dockerfile**: `backend/Dockerfile`  
**Region**: Auto (closest to database)

### Environment Variables (Render)

Set these in Render Dashboard → Environment:

```bash
# Database
DATABASE_URL=postgresql://postgres:x{&auk:zx{vrIie4@34.171.10.156:5432/seekwell

# JWT Authentication
SECRET_KEY=your_very_strong_and_secret_key_here_please_change_this_in_production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS (JSON array format - note the quotes!)
ALLOWED_ORIGINS='["https://seekwell.vercel.app", "http://localhost:3000"]'

# Application
ENVIRONMENT=production
DEBUG=false

# Frontend URL (for password reset emails)
FRONTEND_URL=https://seekwell.vercel.app

# Google AI (for chatbot)
GOOGLE_API_KEY=AIzaSyDeHnctQpsL4xmhgvlYhgbyn-OePwXTlm0
```

### Docker Configuration

Located at `backend/Dockerfile`:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Manual Deployment

Render auto-deploys from GitHub, but you can also:

1. Go to Render Dashboard → Your Service
2. Click "Manual Deploy" → Deploy latest commit
3. Or trigger via Render API/CLI

### Deployment Triggers

- **Auto**: Push to `main` branch → triggers automatic deployment
- **Manual**: Use Render Dashboard → Manual Deploy
- **Webhook**: Configure GitHub webhook for instant deploys

## 🗄️ Database (PostgreSQL)

### Connection Details

**Host**: 34.171.10.156  
**Port**: 5432  
**Database**: seekwell  
**User**: postgres  
**Password**: `x{&auk:zx{vrIie4` (stored in Render env vars)

### Schema Management

**Philosophy**: No migrations - use drop/recreate approach

```bash
# To update schema in production:
1. Backup production database first!
2. Update models in backend/app/models.py
3. Run setup script (will add missing columns)
4. Or manually ALTER TABLE via psql
```

### Backup Strategy

```bash
# Backup production database
pg_dump -h 34.171.10.156 -U postgres -d seekwell > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -h 34.171.10.156 -U postgres -d seekwell < backup_20251014.sql
```

## 🤖 AI Service (HuggingFace Spaces)

**Space URL**: https://bnmbanhmi-seekwell-skin-cancer.hf.space  
**Model**: bnmbanhmi/seekwell_skincancer_v2  
**API**: Gradio with SSE queue system

### No deployment needed
- HuggingFace Spaces runs continuously
- Frontend calls Gradio API directly
- No backend proxy required

## 🔄 CI/CD Pipeline

### GitHub Actions Workflows

Located in `.github/workflows/`:

#### 1. `deploy-frontend.yml`
```yaml
# Triggers on push to main (frontend changes)
# Vercel handles actual deployment via GitHub integration
```

#### 2. `deploy-backend.yml`
```yaml
# Triggers on push to main (backend changes)
# Render handles actual deployment via GitHub integration
```

#### 3. `ci.yml`
```yaml
# Runs tests and linting on PRs
# (Not currently implemented - manual testing only)
```

### Deployment Flow

```
┌──────────────┐
│  Git Push    │
│  to main     │
└──────┬───────┘
       │
       ├─────────────────┬─────────────────┐
       ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   GitHub     │  │   Vercel     │  │   Render     │
│   Webhook    │  │   Detects    │  │   Detects    │
│   Triggered  │  │   Changes    │  │   Changes    │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       │                 ▼                 ▼
       │          ┌──────────────┐  ┌──────────────┐
       │          │   Build      │  │   Docker     │
       │          │   Frontend   │  │   Build      │
       │          └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       │                 ▼                 ▼
       │          ┌──────────────┐  ┌──────────────┐
       │          │   Deploy to  │  │   Deploy to  │
       │          │   Vercel     │  │   Render     │
       │          └──────────────┘  └──────────────┘
       │
       └─────────────── All Done ──────────────────┘
```

## 🚀 Deploying Updates

### Frontend Updates

```bash
# 1. Make changes in frontend/
git add frontend/
git commit -m "feat: update UI component"
git push origin main

# 2. Vercel auto-deploys (2-3 minutes)
# 3. Check: https://seekwell.vercel.app
```

### Backend Updates

```bash
# 1. Make changes in backend/
git add backend/
git commit -m "feat: add new endpoint"
git push origin main

# 2. Render auto-deploys (5-7 minutes - Docker build)
# 3. Check: https://seekwell-backend.onrender.com/health
```

### Database Schema Updates

```bash
# 1. Update models in backend/app/models.py
# 2. Deploy backend (auto-adds missing columns)
# 3. Or manually via psql:
psql -h 34.171.10.156 -U postgres -d seekwell
ALTER TABLE users ADD COLUMN new_field VARCHAR(255);
\q
```

## 🔍 Monitoring & Debugging

### Check Deployment Status

**Vercel**:
- Dashboard: https://vercel.com/bnmbanhmi/seekwell
- Logs: Real-time in deployment page
- Status: https://seekwell.vercel.app (should load)

**Render**:
- Dashboard: https://dashboard.render.com
- Logs: Real-time logs in service page
- Health: https://seekwell-backend.onrender.com/health

### Common Deployment Issues

#### Frontend not connecting to backend

**Symptom**: Network errors, CORS issues

**Check**:
1. Verify `REACT_APP_BACKEND_URL` in Vercel env vars
2. Check backend is running: `curl https://seekwell-backend.onrender.com/health`
3. Verify CORS in Render env vars includes Vercel URL

#### Backend deployment fails

**Symptom**: Render build fails or crashes

**Check**:
1. Render logs for error messages
2. Verify all env vars are set correctly
3. Check `DATABASE_URL` is accessible
4. Test Dockerfile locally: `docker build -t seekwell-backend backend/`

#### Database connection issues

**Symptom**: "Could not connect to database"

**Check**:
1. Verify `DATABASE_URL` in Render env vars
2. Check database is accessible: `psql -h 34.171.10.156 -U postgres -d seekwell`
3. Verify firewall rules allow Render IP

## 🔐 Security Best Practices

### Current Setup
- ✅ HTTPS only (Vercel + Render enforce SSL)
- ✅ JWT tokens with 30-min expiry
- ✅ CORS restricted to Vercel domain
- ✅ Environment variables in platform dashboards (not in code)
- ✅ Database password protected
- ✅ Secret keys strong and rotated

### Recommendations
- 🔄 Rotate `SECRET_KEY` periodically (requires all users to re-login)
- 🔄 Use database connection pooling (already in SQLAlchemy)
- 🔄 Monitor API rate limiting
- 🔄 Set up database backups (weekly recommended)

## 📊 Deployment Checklist

Before deploying major changes:

- [ ] Test locally with production-like .env
- [ ] Backup production database
- [ ] Check all environment variables are set
- [ ] Verify CORS settings
- [ ] Test API endpoints with Swagger docs
- [ ] Check frontend builds without errors
- [ ] Review Render/Vercel logs after deployment
- [ ] Test login and core features in production
- [ ] Monitor for errors in first 30 minutes

## 🆘 Rollback Procedure

### Frontend Rollback (Vercel)
1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"
4. Confirm rollback

### Backend Rollback (Render)
1. Go to Render Dashboard → Your Service
2. Find previous successful deploy
3. Click "Redeploy" on that commit
4. Or: `git revert` bad commit and push

### Database Rollback
```bash
# Restore from backup
psql -h 34.171.10.156 -U postgres -d seekwell < backup_last_good.sql
```

## 📚 Additional Resources

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **HuggingFace Spaces**: https://huggingface.co/docs/hub/spaces

---

**Questions?** Check [DEVELOPMENT.md](DEVELOPMENT.md) for technical details or [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) for local testing setup.
