# 🚀 Simple Auto-Deployment Guide

**Set up once, deploy automatically forever!**

This guide shows you how to configure automatic deployment so that every time you commit to GitHub, both your frontend and backend automatically update.

---

## 🎯 **Quick Overview**

After setup, your workflow will be:
1. **Make changes** to your code
2. **Commit to GitHub** main branch  
3. **Everything deploys automatically** ✨
4. **Your live app is updated** in minutes

No CLI commands, no manual deployment - just pure automation!

---

## 📋 **Step 1: Frontend Auto-Deploy (Vercel)**

### **Setup (One-time only)**

1. **Go to [vercel.com](https://vercel.com)**
   - Sign up with your GitHub account
   - Click "New Project"

2. **Import Your Repository**
   - Find your SeekWell repository
   - Click "Import"

3. **Configure Build Settings**
   ```
   Framework Preset: Create React App
   Root Directory: frontend
   Build Command: npm run build  
   Output Directory: build
   Install Command: npm ci
   ```

4. **Add Environment Variables**
   Go to Project Settings → Environment Variables:
   ```
   REACT_APP_BACKEND_URL = https://seekwell-backend.onrender.com
   REACT_APP_AI_CONFIDENCE_THRESHOLD = 0.8
   REACT_APP_HUGGINGFACE_SPACE_URL = https://bnmbanhmi-seekwell-skin-cancer.hf.space
   REACT_APP_ENABLE_OFFLINE_MODE = true
   REACT_APP_ENABLE_PWA = true
   REACT_APP_ENVIRONMENT = production
   ```

5. **Deploy First Time**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your frontend is live! 🎉

### **Auto-Deploy is Now Active**
- Every commit to `main` branch → Automatic deployment
- Every pull request → Preview deployment
- Monitor at: Vercel Dashboard → Your Project → Deployments

---

## 🛠️ **Step 2: Backend Auto-Deploy (Render)**

### **Setup (One-time only)**

1. **Go to [render.com](https://render.com)**
   - Sign up with your GitHub account
   - Connect your GitHub

2. **Create Database First**
   - Click "New +" → "PostgreSQL"
   - Name: `seekwell-postgres`
   - Database: `seekwell`
   - User: `seekwell_user`
   - Region: Oregon
   - Plan: Starter
   - Click "Create Database"
   - **Save the Internal Database URL**

3. **Create Web Service**
   - Click "New +" → "Web Service"
   - Select your repository
   - Name: `seekwell-backend`
   - Region: Oregon
   - Branch: `main`
   - Root Directory: `backend`
   - Runtime: Python 3.11
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Plan: Starter

4. **Add Environment Variables**
   In Service Settings → Environment:
   ```
   DATABASE_URL = [Your database internal URL]
   SECRET_KEY = [Generate 32+ character secret]
   ALGORITHM = HS256
   ACCESS_TOKEN_EXPIRE_MINUTES = 30
   ALLOWED_ORIGINS = ["https://seekwell.vercel.app", "http://localhost:3000"]
   ENVIRONMENT = production
   DEBUG = false
   ```

5. **Deploy First Time**
   - Click "Manual Deploy"
   - Wait 5-8 minutes
   - Your backend is live! 🎉

6. **Initialize Database**
   - Go to Service → Shell
   - Run: `python app/create_initial_admin.py`

### **Auto-Deploy is Now Active**
- Every commit to `main` branch → Automatic deployment
- Monitor at: Render Dashboard → Your Service → Events

---

## ✅ **Step 3: Test Auto-Deployment**

### **Test Frontend Auto-Deploy**
```bash
# Make a small change to frontend
echo "/* Auto-deploy test */" >> frontend/src/App.css

# Commit and push
git add .
git commit -m "test: frontend auto-deploy"
git push origin main

# Check Vercel dashboard - should see new deployment!
```

### **Test Backend Auto-Deploy**  
```bash
# Make a small change to backend
echo "# Auto-deploy test" >> backend/app/main.py

# Commit and push  
git add .
git commit -m "test: backend auto-deploy"
git push origin main

# Check Render dashboard - should see new deployment!
```

---

## 🎉 **You're Done!**

Your deployment is now fully automated:

### **What Happens When You Commit:**
1. **GitHub receives your commit**
2. **Vercel detects frontend changes** → Builds and deploys React app
3. **Render detects backend changes** → Builds and deploys FastAPI server
4. **Both run health checks** → Verify everything works
5. **Your live app is updated** → Users see changes immediately

### **Monitor Your Deployments:**
- **Vercel**: [vercel.com](https://vercel.com) → Your Project → Deployments
- **Render**: [render.com](https://render.com) → Your Service → Events
- **Live URLs**: 
  - Frontend: `https://seekwell.vercel.app`
  - Backend: `https://seekwell-backend.onrender.com`
  - Health: `https://seekwell-backend.onrender.com/health`

### **Development Workflow:**
```bash
# 1. Make changes
git add .
git commit -m "feat: add new feature"

# 2. Push to GitHub  
git push origin main

# 3. Grab coffee ☕
# Everything deploys automatically!

# 4. Check your live app
# Changes are live in 3-5 minutes
```

---

## 🚨 **Troubleshooting**

### **Frontend Not Deploying?**
- Check Vercel dashboard for build errors
- Verify environment variables are set
- Ensure `frontend/` folder structure is correct

### **Backend Not Deploying?**
- Check Render logs for Python errors
- Verify database connection string
- Ensure all required environment variables are set

### **Need Help?**
- Vercel docs: [vercel.com/docs](https://vercel.com/docs)
- Render docs: [render.com/docs](https://render.com/docs)
- GitHub issues: Create issue in your repository

---

**🎯 Pro Tip**: Bookmark your deployment dashboards for quick monitoring!

*Now you can focus on building amazing features instead of worrying about deployment! 🚀*
