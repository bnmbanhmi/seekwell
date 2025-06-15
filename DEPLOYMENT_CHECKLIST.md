# 🚀 SeekWell Deployment Checklist

## Pre-Deployment Setup

### 📋 **GitHub Repository Setup**
- [ ] Repository is public or accessible to deployment services
- [ ] All code is committed and pushed to main branch
- [ ] `.gitignore` excludes sensitive files (.env, node_modules, etc.)
- [ ] Repository has clear README.md and DEVELOPMENT.md

### 🔐 **Secrets & Environment Variables**
- [ ] Generate secure SECRET_KEY (minimum 32 characters)
- [ ] Create production database credentials
- [ ] Obtain HuggingFace API key (if needed)
- [ ] Set up domain names (seekwell.health, api.seekwell.health)

---

## Frontend Deployment (Vercel) - Web Dashboard Setup

### 🌐 **Vercel Dashboard Setup**
- [ ] Go to [vercel.com](https://vercel.com) and sign up/login
- [ ] Click "New Project" button
- [ ] Connect your GitHub account if not already connected
- [ ] Import your SeekWell repository

### 📁 **Project Configuration in Vercel Dashboard**
- [ ] **Framework Preset**: Select "Create React App"
- [ ] **Root Directory**: Leave empty (will auto-detect frontend folder)
- [ ] **Build Command**: `cd frontend && npm run build` 
- [ ] **Output Directory**: `frontend/build`
- [ ] **Install Command**: `cd frontend && npm ci`
- [ ] **Development Command**: `cd frontend && npm start`

### ⚙️ **Environment Variables (Vercel Dashboard)**
Go to Project Settings > Environment Variables and add:

**Production Environment Variables:**
```
Name: REACT_APP_BACKEND_URL
Value: https://seekwell-backend.onrender.com
Environments: Production ✓

Name: REACT_APP_AI_CONFIDENCE_THRESHOLD  
Value: 0.8
Environments: Production ✓

Name: REACT_APP_HUGGINGFACE_SPACE_URL
Value: https://bnmbanhmi-seekwell-skin-cancer.hf.space
Environments: Production ✓

Name: REACT_APP_ENABLE_OFFLINE_MODE
Value: true
Environments: Production ✓

Name: REACT_APP_ENABLE_PWA
Value: true
Environments: Production ✓

Name: REACT_APP_ENVIRONMENT
Value: production
Environments: Production ✓
```

**Preview Environment Variables:**
```
Name: REACT_APP_BACKEND_URL
Value: https://seekwell-backend.onrender.com
Environments: Preview ✓

Name: REACT_APP_ENVIRONMENT
Value: staging
Environments: Preview ✓

(Copy other variables with same values)
```

### 🔄 **Auto-Deploy Configuration**
- [ ] In Project Settings > Git, ensure:
  - **Production Branch**: `main` ✓
  - **Auto-deploy**: Enabled ✓
  - **Deploy Hooks**: Can be set up for manual triggers if needed

### 🌐 **Custom Domain Setup (Optional)**
- [ ] Go to Project Settings > Domains
- [ ] Add your custom domain: `seekwell.health`
- [ ] Add www redirect: `www.seekwell.health` → `seekwell.health`
- [ ] Configure DNS records as shown in Vercel dashboard

### ✅ **Verification Steps**
- [ ] Push a commit to main branch
- [ ] Check Deployments tab for automatic deployment
- [ ] Visit your deployment URL to verify it works
- [ ] Test that environment variables are loaded correctly

---

## Backend Deployment (Render) - Web Dashboard Setup

### 🏗️ **Render Dashboard Setup**
- [ ] Go to [render.com](https://render.com) and sign up/login
- [ ] Connect your GitHub account in Account Settings
- [ ] Verify email and enable 2FA for security

### 🗄️ **Database Setup (First!)**
- [ ] Click "New +" → "PostgreSQL"
- [ ] **Name**: `seekwell-postgres`
- [ ] **Database**: `seekwell`
- [ ] **User**: `seekwell_user`
- [ ] **Region**: Oregon (US West)
- [ ] **Plan**: Starter ($7/month)
- [ ] **PostgreSQL Version**: 15
- [ ] Click "Create Database"
- [ ] **Important**: Copy the "Internal Database URL" for later

### 🐳 **Web Service Setup**
- [ ] Click "New +" → "Web Service"
- [ ] Connect your GitHub repository
- [ ] **Name**: `seekwell-backend`
- [ ] **Region**: Oregon (US West)
- [ ] **Branch**: `main`
- [ ] **Root Directory**: `backend`
- [ ] **Runtime**: Python 3.11
- [ ] **Build Command**: `pip install -r requirements.txt`
- [ ] **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] **Plan**: Starter ($7/month)

### ⚙️ **Environment Variables (Render Dashboard)**
In Web Service Settings > Environment, add these variables:

**Required Variables:**
```
Key: DATABASE_URL
Value: [Paste the Internal Database URL from your PostgreSQL service]

Key: SECRET_KEY  
Value: [Generate a secure 32+ character secret key]

Key: ALGORITHM
Value: HS256

Key: ACCESS_TOKEN_EXPIRE_MINUTES
Value: 30

Key: ALLOWED_ORIGINS
Value: ["https://seekwell.vercel.app", "https://seekwell-frontend.vercel.app", "http://localhost:3000"]

Key: ENVIRONMENT
Value: production

Key: DEBUG
Value: false
```

**Optional Variables:**
```
Key: HUGGINGFACE_API_KEY
Value: [Your HuggingFace API key if you have one]

Key: OPENAI_API_KEY  
Value: [Your OpenAI API key if using chat features]
```

### 🔄 **Auto-Deploy Configuration**
- [ ] In Service Settings > Build & Deploy:
  - **Auto-Deploy**: Yes ✓
  - **Branch**: main ✓
- [ ] In Service Settings > Health Check:
  - **Health Check Path**: `/health` ✓

### 🚀 **Initial Deployment**
- [ ] Click "Manual Deploy" → "Deploy latest commit"
- [ ] Wait for deployment (5-10 minutes)
- [ ] Check logs for any errors
- [ ] Once deployed, run database initialization

### 🗄️ **Database Initialization**
After successful deployment, initialize the database:
- [ ] Go to your Web Service → Shell tab
- [ ] Run: `python app/create_initial_admin.py`
- [ ] Verify admin user was created successfully

### 🌐 **Custom Domain Setup (Optional)**
- [ ] In Service Settings > Custom Domains
- [ ] Add: `api.seekwell.health`
- [ ] Configure DNS: CNAME `api.seekwell.health` → `your-service.onrender.com`
- [ ] Wait for SSL certificate provisioning

### ✅ **Verification Steps**
- [ ] Visit `https://your-service.onrender.com/health`
- [ ] Should return: `{"status": "healthy", ...}`
- [ ] Visit `https://your-service.onrender.com/docs`
- [ ] API documentation should load
- [ ] Test authentication endpoints work

---

## Automatic Deployment Setup

### � **How Auto-Deployment Works**
Once configured, your deployment process will be completely automated:

```
1. You commit changes to GitHub main branch
2. Vercel automatically detects frontend changes and deploys
3. Render automatically detects backend changes and deploys  
4. Both services run health checks
5. Your live application is updated automatically
```

### � **Testing Auto-Deployment**

#### **Test Frontend Auto-Deploy:**
- [ ] Make a small change to any file in `frontend/` folder
- [ ] Commit and push to GitHub:
  ```bash
  git add .
  git commit -m "test: frontend auto-deploy"
  git push origin main
  ```
- [ ] Go to Vercel dashboard → Your project → Deployments
- [ ] Should see new deployment starting automatically
- [ ] Wait for deployment to complete (~2-3 minutes)
- [ ] Visit your site to see changes

#### **Test Backend Auto-Deploy:**
- [ ] Make a small change to any file in `backend/` folder  
- [ ] Commit and push to GitHub:
  ```bash
  git add .
  git commit -m "test: backend auto-deploy"
  git push origin main
  ```
- [ ] Go to Render dashboard → Your service → Events
- [ ] Should see new deployment starting automatically
- [ ] Wait for deployment to complete (~5-8 minutes)
- [ ] Check `/health` endpoint to verify changes

### � **Deployment Monitoring**
- [ ] **Vercel**: Monitor deployments at vercel.com → Your Project → Deployments
- [ ] **Render**: Monitor deployments at render.com → Your Service → Events
- [ ] Set up email notifications in both platforms
- [ ] Bookmark health check URLs for quick status verification

### 🔔 **Notification Setup**
- [ ] **Vercel**: Project Settings → Notifications → Deploy Hooks
- [ ] **Render**: Service Settings → Notifications → Deploy notifications
- [ ] Configure Slack/email notifications for deployment status

---

## Post-Deployment Configuration

### 🌐 **Custom Domains**
- [ ] Purchase domain (seekwell.health)
- [ ] Configure DNS records:
  ```
  A record: seekwell.health → Vercel IP
  CNAME: api.seekwell.health → your-service.onrender.com
  CNAME: www.seekwell.health → seekwell.health
  ```
- [ ] Verify SSL certificates auto-generated
- [ ] Test all domain variants work

### 📊 **Monitoring Setup**
- [ ] Set up uptime monitoring (UptimeRobot/Pingdom)
- [ ] Configure error tracking (Sentry)
- [ ] Set up analytics (Google Analytics/Mixpanel)
- [ ] Create status page for users

### 🔒 **Security Hardening**
- [ ] Verify HTTPS enforcement
- [ ] Check CORS configuration
- [ ] Audit exposed endpoints
- [ ] Test authentication flows
- [ ] Verify no sensitive data in logs

### 🗄️ **Database Management**
- [ ] Run initial admin creation script
- [ ] Set up automated backups
- [ ] Test database restore procedure
- [ ] Create read-only user for analytics

---

## Testing & Validation

### 🧪 **Functional Testing**
- [ ] User registration and login
- [ ] Image upload and AI analysis
- [ ] Community cadre workflow
- [ ] Doctor consultation features
- [ ] Mobile PWA functionality

### 📱 **Mobile Testing**
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Verify PWA installation
- [ ] Test offline functionality
- [ ] Check camera integration

### 🚀 **Performance Testing**
- [ ] Page load speeds < 3 seconds
- [ ] API response times < 500ms
- [ ] Image upload performance
- [ ] Database query optimization
- [ ] CDN asset delivery

### 🔒 **Security Testing**
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF token validation
- [ ] JWT token security
- [ ] File upload restrictions

---

## Go-Live Checklist

### 📢 **Communication**
- [ ] Notify team of deployment schedule
- [ ] Prepare rollback plan
- [ ] Document deployment process
- [ ] Create incident response plan

### 🎯 **Final Steps**
- [ ] Switch DNS to production
- [ ] Monitor error rates and performance
- [ ] Test all critical user paths
- [ ] Verify analytics tracking
- [ ] Update documentation

### 📈 **Post-Launch Monitoring**
- [ ] Monitor server resources
- [ ] Check error logs hourly (first day)
- [ ] Verify user registrations work
- [ ] Monitor AI analysis success rates
- [ ] Track performance metrics

---

## Rollback Procedures

### 🔄 **Emergency Rollback**
1. **Frontend**: Revert to previous Vercel deployment
2. **Backend**: Rollback Render service or redeploy previous version
3. **Database**: Restore from latest backup if needed
4. **DNS**: Switch back to staging if domain issues

### 📞 **Emergency Contacts**
- [ ] Team lead contact information
- [ ] Vercel support (if Pro plan)
- [ ] Render support
- [ ] Domain registrar support

---

## Success Metrics

### 📊 **Key Performance Indicators**
- [ ] 99% uptime in first month
- [ ] < 3 second page load times
- [ ] < 500ms API response times
- [ ] 0 critical security vulnerabilities
- [ ] Successful AI analysis completion rate > 95%

### 🎯 **User Experience Metrics**
- [ ] Mobile user engagement
- [ ] PWA installation rates
- [ ] Community cadre adoption
- [ ] Healthcare provider feedback
- [ ] Patient satisfaction scores

---

**🎉 Deployment Complete! SeekWell is now live and ready to transform healthcare access across ASEAN communities.**

*Last updated: June 15, 2025*
