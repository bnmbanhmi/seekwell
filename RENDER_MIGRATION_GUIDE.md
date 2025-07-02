# 🚀 Render PostgreSQL Migration Guide

## Quick Migration Steps

### 1. Create Render Database (5 minutes)

1. **Go to [render.com](https://render.com)** and login
2. **Click "New +" → "PostgreSQL"**
3. **Configure:**
   - Name: `seekwell-postgres`
   - Database: `seekwell`
   - User: `seekwell_user`
   - Region: Oregon (or closest to you)
   - Plan: **Starter (FREE)**
4. **Click "Create Database"**

### 2. Get Database URL

After creation, you'll see:
- **Internal Database URL**: `postgresql://seekwell_user:PASSWORD@HOST:5432/seekwell`
- **Copy this URL** - you'll need it next

### 3. Update Environment Files

**Replace the DATABASE_URL in these files:**

**File: `backend/.env`**
```bash
DATABASE_URL=postgresql://seekwell_user:YOUR_PASSWORD@YOUR_HOST:5432/seekwell
```

**File: `backend/.env.production`**
```bash
DATABASE_URL=postgresql://seekwell_user:YOUR_PASSWORD@YOUR_HOST:5432/seekwell
```

### 4. Test Connection

```bash
cd backend
python test_render_connection.py
```

### 5. Initialize Fresh Database

```bash
cd backend
python setup_seekwell_database.py
```

## ✅ What You Get

### Render Free Tier
- **1GB Storage** (plenty for SeekWell)
- **1 CPU Core Shared**
- **90 days retention** (database sleeps after inactivity but data persists)
- **No credit card required**

### Fresh Database With:
- All SeekWell tables and schema
- Initial admin account: `admin@seekwell.health` / `SeekWell2025!`
- 3 specialist doctors
- 4 community health workers (one per ASEAN country)
- 1 regional health center

## 🔧 Troubleshooting

### Connection Issues
- **Use Internal Database URL** (not External)
- **Check Render dashboard** - database should show "Available"
- **Wait 2-3 minutes** after creation for database to be ready

### Database Sleeping
- Free databases sleep after 30 minutes of inactivity
- **First query after sleep** takes 10-15 seconds to wake up
- **This is normal** for free tier

## 💰 Cost Savings

**Before (GCP):** ~$20-50/month
**After (Render Free):** $0/month
**Savings:** 100% reduction in database costs!

## 🚀 Next Steps

After successful migration:
1. **Update frontend** to point to new backend
2. **Test AI analysis** workflow
3. **Deploy to production** with new database
4. **Shut down GCP database** to stop charges

## ⚠️ Important Notes

- **No data migration needed** since you're okay losing mock data
- **Free tier limitations** are perfect for development and demo
- **Upgrade to paid** if you need more storage/performance later
- **Render handles backups** and maintenance automatically
