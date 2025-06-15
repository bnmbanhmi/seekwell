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

## Frontend Deployment (Vercel)

### 🌐 **Vercel Account Setup**
- [ ] Create Vercel account at [vercel.com](https://vercel.com)
- [ ] Install Vercel CLI: `npm install -g vercel`
- [ ] Login to Vercel: `vercel login`

### 📁 **Project Configuration**
- [ ] Navigate to frontend directory: `cd frontend`
- [ ] Link project: `vercel link`
- [ ] Import project from GitHub in Vercel dashboard
- [ ] Set build command: `npm run build`
- [ ] Set output directory: `build`

### ⚙️ **Environment Variables (Vercel Dashboard)**
```env
REACT_APP_BACKEND_URL=https://seekwell-backend.onrender.com
REACT_APP_AI_CONFIDENCE_THRESHOLD=0.8
REACT_APP_HUGGINGFACE_SPACE_URL=https://bnmbanhmi-seekwell-skin-cancer.hf.space
REACT_APP_ENABLE_OFFLINE_MODE=true
REACT_APP_ENABLE_PWA=true
REACT_APP_ENVIRONMENT=production
```

### 🚀 **Deployment Steps**
- [ ] Deploy manually first: `vercel --prod`
- [ ] Verify deployment at generated URL
- [ ] Test all major user flows
- [ ] Set up custom domain (seekwell.health)
- [ ] Configure DNS records
- [ ] Verify SSL certificate

### ✅ **Verification**
- [ ] Frontend loads correctly
- [ ] PWA installation works
- [ ] API calls reach backend
- [ ] Mobile responsive design works
- [ ] All images and assets load

---

## Backend Deployment (Render)

### 🏗️ **Render Account Setup**
- [ ] Create Render account at [render.com](https://render.com)
- [ ] Connect GitHub account
- [ ] Verify email and enable two-factor authentication

### 🗄️ **Database Setup**
- [ ] Create PostgreSQL database in Render
- [ ] Note database internal URL
- [ ] Configure database region (recommend Oregon)
- [ ] Set database plan (Starter for development)

### 🐳 **Web Service Configuration**
- [ ] Create new Web Service in Render
- [ ] Connect to GitHub repository
- [ ] Set root directory: `backend`
- [ ] Configure build settings:
  ```
  Build Command: pip install -r requirements.txt
  Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```

### ⚙️ **Environment Variables (Render Dashboard)**
```env
DATABASE_URL=<internal_database_url_from_render>
SECRET_KEY=<your_secure_secret_key_32_chars_minimum>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALLOWED_ORIGINS=["https://seekwell.vercel.app","https://seekwell.health"]
HUGGINGFACE_API_KEY=<your_huggingface_api_key>
ENVIRONMENT=production
PORT=$PORT
```

### 🚀 **Deployment Steps**
- [ ] Deploy web service
- [ ] Wait for initial deployment (5-10 minutes)
- [ ] Check deployment logs for errors
- [ ] Run database initialization
- [ ] Set up custom domain (api.seekwell.health)

### ✅ **Verification**
- [ ] Backend API responds: `https://your-service.onrender.com/health`
- [ ] API documentation accessible: `https://your-service.onrender.com/docs`
- [ ] Database connection works
- [ ] Authentication endpoints work
- [ ] AI analysis endpoints work

---

## CI/CD Pipeline Setup

### 🔧 **GitHub Secrets**
Add these secrets in GitHub repository settings:

```
VERCEL_ORG_ID=<team_id_from_vercel>
VERCEL_PROJECT_ID=<project_id_from_vercel>
VERCEL_TOKEN=<vercel_api_token>
RENDER_SERVICE_ID=<service_id_from_render>
RENDER_API_KEY=<render_api_key>
```

### 📝 **Getting Required IDs**

#### Vercel IDs:
```bash
# Install Vercel CLI and login
npm install -g vercel
vercel login

# Get Org ID and Project ID
cd frontend
vercel link
# IDs will be saved in .vercel/project.json

# Create API token in Vercel dashboard:
# Account Settings > Tokens > Create Token
```

#### Render IDs:
```bash
# Service ID: Found in Render dashboard URL
# https://dashboard.render.com/web/srv-xxxxxxxxxxxx
# The srv-xxxxxxxxxxxx part is your SERVICE_ID

# API Key: Account Settings > API Keys > Create Key
```

### 🔄 **Workflow Verification**
- [ ] Push to main branch triggers deployments
- [ ] Pull requests create preview deployments
- [ ] Tests run before deployment
- [ ] Deployment status updates in GitHub
- [ ] Health checks pass after deployment

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
