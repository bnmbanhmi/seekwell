# SeekWell - Development Documentation

**AI-Powered Mobile Web App for Skin Lesion Classification - Developer Guide**

---

## 🎯 Project Overview

### Vision Statement
Transform the existing clinic management system into **SeekWell** - a mobile-first web application that integrates AI for skin lesion classification while maintaining human oversight through local cadres and doctors.

### Key Development Objectives
- ✅ Integrate AI model for classifying skin lesions (skin cancer detection)
- ✅ Create mobile-responsive web application
- ✅ Maintain role of local cadres (replacing clinic staff)
- ✅ Enable remote doctor consultations
- ✅ Store and track skin lesion images over time
- ✅ Provide preliminary health assessments with professional follow-up

---

## 🛠️ Technical Architecture

### **Backend Stack**
- **Core Framework**: Python 3.11+ with FastAPI
- **Database**: PostgreSQL with SQLAlchemy ORM
- **AI/ML Stack**: PyTorch, Transformers, HuggingFace
- **API Documentation**: Automatic OpenAPI/Swagger generation
- **Authentication**: JWT tokens with role-based access
- **Server**: Uvicorn ASGI server

### **AI & Machine Learning**
- **Deep Learning**: PyTorch for model development and inference
- **Model Serving**: HuggingFace Transformers for model deployment
- **Image Processing**: PIL/Pillow for image manipulation
- **Deployment**: Gradio for interactive AI interfaces
- **Live Model**: `bnmbanhmi/seekwell-skin-cancer` on HuggingFace Spaces

### **Frontend Stack**
- **Framework**: React 19.1 with TypeScript
- **Build Tool**: Create React App with modern tooling
- **Styling**: Material-UI 7 and Custom CSS with design system
- **State Management**: React Context and Hooks
- **PWA Features**: Manifest configuration and mobile optimization

### **Infrastructure**
- **Database**: PostgreSQL with comprehensive migrations
- **File Storage**: Local/cloud storage for medical images
- **Monitoring**: Health checks and performance tracking
- **Deployment**: Docker-ready containerization

---

## 🏗️ Database Schema

### **Core Tables**
```sql
-- Users and Authentication
users                 -- Authentication and role management
patients              -- Patient demographics and health data
doctors               -- Doctor profiles and specializations
community_health_centers -- Community health centers/clinics

-- Appointments and EMR
appointments          -- Healthcare scheduling
medical_reports       -- Electronic medical records (includes prescriptions)

-- AI and Skin Lesion Analysis
skin_lesion_images    -- Patient images and metadata
ai_assessments        -- AI analysis results and confidence
cadre_reviews         -- Community health worker reviews
doctor_consultations  -- Professional medical assessments

-- Communication
chat_messages         -- Integrated communication system
```

### **User Roles**
```python
class UserRole(str, Enum):
    ADMIN = "ADMIN"
    DOCTOR = "DOCTOR"
    PATIENT = "PATIENT"
    LOCAL_CADRE = "LOCAL_CADRE"  # Community health workers
```

### **Key Relationships**
```sql
Patient 1:N SkinLesionImages
SkinLesionImage 1:1 AIAssessment
SkinLesionImage 1:N CadreReviews
SkinLesionImage 1:N DoctorConsultations
Patient N:M Doctors (through appointments)
```

---

## 🤖 AI Model Integration

### **HuggingFace Space Integration**

**Official API Documentation Format:**
```python
# Python - Recommended approach
from gradio_client import Client, handle_file

client = Client("bnmbanhmi/seekwell-skin-cancer")
result = client.predict(
    image=handle_file('path/to/image.jpg'),
    api_name="/predict"
)
print(result)
```

**JavaScript/TypeScript Implementation:**
```typescript
// Multiple endpoint fallback strategy
const HUGGINGFACE_SPACE_URL = 'https://bnmbanhmi-seekwell-skin-cancer.hf.space';
const API_ENDPOINTS = [
  '/call/predict',     // Gradio call endpoint (primary)
  '/api/predict',      // Standard API endpoint  
  '/run/predict',      // Alternative run endpoint
  '/predict'           // Direct predict endpoint
];

// Robust implementation with fallbacks
class HuggingFaceAIService {
  async analyzeImageAI(file, analysisData) {
    const attempts = [
      () => this.tryGradioCallAPI(file, analysisData),
      () => this.tryFormDataAPI(file, analysisData), 
      () => this.tryBase64API(file, analysisData)
    ];
    
    for (const attempt of attempts) {
      try {
        return await attempt();
      } catch (error) {
        console.warn('API attempt failed:', error);
      }
    }
    throw new Error('All API methods failed');
  }
}
```

**API Input/Output Specification:**
```typescript
// Input format (following official Gradio API documentation)
interface GradioImageInput {
  path: string | null;           // Path to local file
  url: string | null;            // Public URL or base64 encoded image  
  size: number | null;           // Size in bytes
  orig_name: string | null;      // Original filename
  mime_type: string | null;      // MIME type (e.g., 'image/jpeg')
  is_stream: boolean;            // Always false for static images
  meta: object;                  // Additional metadata
}

// Output format  
type GradioOutput = string;      // Plain text classification results

// Supported Classes
const SKIN_LESION_CLASSES = {
  'ACK': 'Actinic keratoses',
  'BCC': 'Basal cell carcinoma', 
  'MEL': 'Melanoma',
  'NEV': 'Nevus/Mole',
  'SCC': 'Squamous cell carcinoma',
  'SEK': 'Seborrheic keratosis'
};
```

**Common API Issues & Solutions:**
- ❌ **404 Error on `/api/predict`**: Try `/call/predict` endpoint instead
- ❌ **CORS Issues**: Use gradio_client library or proxy through backend
- ❌ **Timeout Errors**: Implement polling for queued Gradio responses
- ✅ **Best Practice**: Use multiple endpoint fallbacks for reliability

---

## 📋 Development Phases & Progress

### Phase 1: SeekWell Transformation ✅ COMPLETED
**Complete transformation from clinic management to SeekWell AI Health Assistant**

#### 1.1 Branding Transformation ✅
- ✅ HTML title changed to "SeekWell - AI Health Assistant"
- ✅ Application header rebranded
- ✅ Package.json updated with SeekWell metadata
- ✅ Storage keys changed from clinic to seekwell prefixes
- ✅ Logo alt text updated

#### 1.2 Role Transition ✅
- ✅ Backend UserRole enum: `CLINIC_STAFF` → `LOCAL_CADRE`
- ✅ All frontend TypeScript types updated
- ✅ Permission systems updated throughout codebase

#### 1.3 Mobile-First Design ✅
- ✅ 30+ mobile-specific CSS variables
- ✅ Touch targets (44px minimum), mobile spacing scale
- ✅ PWA configuration with SeekWell branding
- ✅ Responsive typography and dark mode support

#### 1.4 Key Components ✅
- ✅ `PatientDashboardMobile.tsx`
- ✅ `MobileNavigation.tsx`
- ✅ `BodyRegionSelector.tsx`
- ✅ Enhanced authentication

### Phase 2: AI Integration ✅ COMPLETED
**Complete AI model integration with HuggingFace Spaces**

#### 2.1 Database Extensions ✅
```sql
CREATE TABLE skin_lesion_images (
    image_id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(patient_id),
    image_path VARCHAR(500) NOT NULL,
    upload_timestamp TIMESTAMP DEFAULT NOW(),
    body_region VARCHAR(100),
    ai_prediction VARCHAR(200),
    confidence_score FLOAT,
    needs_professional_review BOOLEAN DEFAULT FALSE,
    reviewed_by_cadre INTEGER REFERENCES users(user_id),
    reviewed_by_doctor INTEGER REFERENCES doctors(doctor_id),
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT
);

CREATE TABLE ai_assessments (
    assessment_id SERIAL PRIMARY KEY,
    image_id INTEGER REFERENCES skin_lesion_images(image_id),
    risk_level VARCHAR(50),
    recommendations TEXT,
    follow_up_needed BOOLEAN DEFAULT FALSE,
    follow_up_days INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2.2 API Endpoints ✅
```python
# Core AI Analysis Endpoints
POST /api/skin-lesions/analyze       # Upload and analyze image
GET  /api/skin-lesions/history       # Patient analysis history
POST /api/cadre/review/{image_id}    # Cadre review workflow
POST /api/doctor/consult/{image_id}  # Doctor consultation

# Community Health Endpoints
GET  /api/community/stats            # Community health metrics
GET  /api/cadre/pending-reviews      # Pending reviews queue
GET  /api/cadre/urgent-reviews       # Urgent cases
```

### Phase 3: Frontend Integration ✅ COMPLETED
**Complete React components with AI analysis workflow**

#### 3.1 AI Analysis Components ✅
- ✅ `AISkinAnalysisDashboard.tsx` - Main analysis interface
- ✅ `ImageUpload.tsx` - Camera integration and file upload
- ✅ `AnalysisResults.tsx` - AI results display
- ✅ `AnalysisHistory.tsx` - Patient history tracking
- ✅ `HuggingFaceAIService.ts` - Live API integration

#### 3.2 Community Health Workflow ✅
- ✅ `CadreDashboard.tsx` - Community health worker interface
- ✅ `SkinLesionWorkflow.tsx` - Complete guided workflow
- ✅ `SeekWellLanding.tsx` - Project landing page

#### 3.3 Internationalization ✅
- ✅ Medical terminology standardization
- ✅ Global accessibility improvements

---

## 🚀 Development Environment Setup

### Prerequisites
```bash
# System Requirements
Python 3.11+
Node.js 18+
PostgreSQL 13+
Git

# Optional
Docker & Docker Compose
```

### Backend Setup
```bash
# 1. Navigate to backend directory
cd backend

# 2. Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On macOS/Linux
.venv\Scripts\activate     # On Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Environment configuration
cp .env.example .env
# Edit .env with your database credentials and secrets

# 5. Database initialization
python setup_seekwell_database.py
```

### Frontend Setup
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Environment configuration
cp .env.example .env.local
# Edit with your backend URL and configuration
```

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://username:password@localhost/seekwell"

# Security
SECRET_KEY="your-super-secret-key-here"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI Integration
HUGGINGFACE_API_KEY="your-huggingface-api-key"  # Optional
OPENAI_API_KEY="your-openai-api-key"            # Optional for chat

# CORS
ALLOWED_ORIGINS=["http://localhost:3000", "https://yourdomain.com"]
```

#### Frontend (.env.local)
```env
# Backend API
REACT_APP_BACKEND_URL=http://localhost:8000

# AI Configuration
REACT_APP_AI_CONFIDENCE_THRESHOLD=0.8
REACT_APP_HUGGINGFACE_SPACE_URL=https://bnmbanhmi-seekwell-skin-cancer.hf.space

# Feature Flags
REACT_APP_ENABLE_OFFLINE_MODE=true
REACT_APP_ENABLE_PWA=true
```

---

## 🏃‍♂️ Running the Application

### Development Mode
```bash
# Terminal 1: Start Backend
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Start Frontend
cd frontend
npm start

# Access points
Frontend: http://localhost:3000
Backend API: http://localhost:8000
API Docs: http://localhost:8000/docs
```

### Production Build
```bash
# Build frontend for production
cd frontend
npm run build

# Serve with backend
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## 📡 API Reference

### Authentication Endpoints
```bash
# Login
POST /auth/token
Content-Type: application/x-www-form-urlencoded
Body: username=user@example.com&password=password

# Register
POST /auth/register/
Content-Type: application/json
Body: {
  "email": "user@example.com",
  "password": "password",
  "full_name": "John Doe",
  "role": "PATIENT"
}

# Get current user
GET /users/me/
Authorization: Bearer <token>
```

### AI Analysis Endpoints
```bash
# Analyze skin lesion
POST /api/skin-lesions/analyze
Authorization: Bearer <token>
Content-Type: multipart/form-data
Body: 
  - image: [image file]
  - body_region: "face"
  - notes: "Patient concerned about mole changes"

# Get analysis history
GET /api/skin-lesions/history/{patient_id}
Authorization: Bearer <token>

# Get specific analysis
GET /api/skin-lesions/{image_id}
Authorization: Bearer <token>
```

### Community Health Endpoints
```bash
# Cadre: Get pending reviews
GET /api/cadre/pending-reviews
Authorization: Bearer <token> (LOCAL_CADRE role)

# Cadre: Submit review
POST /api/cadre/review/{image_id}
Authorization: Bearer <token> (LOCAL_CADRE role)
Content-Type: application/json
Body: {
  "review_notes": "Recommend follow-up",
  "agrees_with_ai": true,
  "escalate_to_doctor": false,
  "local_recommendations": "Monitor for changes"
}

# Get community statistics
GET /api/community/stats
Authorization: Bearer <token>
```

### Medical Endpoints
```bash
# Doctor: Get consultation queue
GET /api/doctor/consultations
Authorization: Bearer <token> (DOCTOR role)

# Doctor: Submit consultation
POST /api/doctor/consult/{image_id}
Authorization: Bearer <token> (DOCTOR role)
Content-Type: application/json
Body: {
  "diagnosis": "Benign nevus",
  "treatment_plan": "Monitor annually",
  "follow_up_needed": true,
  "follow_up_days": 365
}
```

---

## 🔒 Security Considerations

### Authentication & Authorization
```python
# JWT token configuration
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Role-based access control
def require_role(required_role: UserRole):
    def decorator(func):
        # Implementation
        pass
    return decorator

# Usage
@require_role(UserRole.LOCAL_CADRE)
async def cadre_review_endpoint():
    pass
```

---

## 📱 Mobile Development Guidelines

### Progressive Web App (PWA)
```json
// public/manifest.json
{
  "name": "SeekWell - AI Health Assistant",
  "short_name": "SeekWell",
  "description": "AI-powered skin lesion assessment",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3498db",
  "orientation": "portrait-primary",
  "categories": ["health", "medical", "lifestyle"],
  "icons": [
    {
      "src": "logo192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

### Camera Integration
```typescript
// Camera access for skin lesion capture
const captureImage = async (): Promise<File> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',  // Back camera
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });
    // Implementation details
  } catch (error) {
    // Fallback to file upload
  }
};
```

---

## 🔧 Git Workflow

### Branch Strategy
```bash
# Main branches
main        # Production-ready code
develop     # Integration branch

# Feature branches
feature/patient-dashboard
feature/ai-analysis-workflow
feature/cadre-review-system

# Bugfix branches
bugfix/login-validation
bugfix/image-upload-error

# Release branches
release/v1.0.0
```

### Development Workflow
```bash
# 1. Create feature branch
git checkout develop
git pull origin develop
git checkout -b feature/new-feature

# 2. Development
# Make changes, commit frequently
git add .
git commit -m "feat: implement new feature"

# 3. Push and create PR
git push origin feature/new-feature
# Create Pull Request to develop branch

# 4. After review and merge
git checkout develop
git pull origin develop
git branch -d feature/new-feature
```

### Commit Convention
```bash
# Format: type(scope): description

# Types
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation
style:    # Formatting, no code change
refactor: # Code refactoring
test:     # Adding tests
chore:    # Maintenance

# Examples
feat(ai): integrate HuggingFace skin cancer model
fix(auth): resolve JWT token expiration issue
docs(api): update endpoint documentation
```

---

## 🚀 Deployment Guide

### Production Environment Variables
```env
# Production backend .env
DATABASE_URL=postgresql://prod_user:prod_pass@prod_host:5432/seekwell_prod
SECRET_KEY=production-secret-key-very-secure
ALLOWED_ORIGINS=["https://seekwell.vercel.app","https://seekwell.health"]
ENVIRONMENT=production

# Security headers
SECURE_SSL_REDIRECT=True
SECURE_PROXY_SSL_HEADER=("HTTP_X_FORWARDED_PROTO", "https")
```

### Deployment Steps
```bash
# 1. Build frontend
cd frontend
npm run build

# 2. Prepare backend
cd backend
pip install -r requirements.txt
python setup_seekwell_database.py  # Only first deployment

# 3. Database migrations
python -m alembic upgrade head

# 4. Start production server
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Health Checks
```python
# app/health.py
@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0",
        "services": {
            "database": await check_database(),
            "ai_model": await check_ai_service(),
            "storage": await check_file_storage()
        }
    }
```

---

##  Troubleshooting

### Common Issues

#### Database Connection Error
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Reset database
dropdb seekwell && createdb seekwell
python setup_seekwell_database.py
```

#### AI Model Integration Issues
```python
# Test HuggingFace connection
import requests
response = requests.get("https://bnmbanhmi-seekwell-skin-cancer.hf.space/")
print(response.status_code)

# Check model availability
from transformers import pipeline
classifier = pipeline("image-classification", 
                     model="bnmbanhmi/seekwell-skin-cancer")
```

#### Frontend Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run type-check

# Update dependencies
npm audit fix
```

---

## 📚 Additional Resources

### Development Tools
- **API Testing**: Postman collections in `/docs/postman/`
- **Database Tools**: pgAdmin, DBeaver for PostgreSQL management
- **Code Quality**: ESLint, Prettier, Black, mypy configurations
- **Documentation**: Swagger UI at `/docs`, ReDoc at `/redoc`

### External Dependencies
- **HuggingFace Spaces**: Model hosting and inference
- **Material-UI**: React component library
- **FastAPI**: Modern Python web framework
- **PostgreSQL**: Relational database
- **JWT**: Authentication tokens

### Learning Resources
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React TypeScript Guide](https://react-typescript-cheatsheet.netlify.app/)
- [HuggingFace Transformers](https://huggingface.co/docs/transformers)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PWA Development Guide](https://web.dev/progressive-web-apps/)

---

## 🤝 Contributing

### Development Setup for Contributors
1. Fork the repository
2. Create a feature branch
3. Set up development environment
4. Make changes and test thoroughly
5. Submit pull request with detailed description

### Code Style Guidelines
- **Python**: Follow PEP 8, use Black formatter
- **TypeScript**: Use ESLint + Prettier configuration
- **Commits**: Follow conventional commit format
- **Documentation**: Update docs for new features
- **Testing**: Maintain test coverage above 80%

### Review Process
1. Automated tests must pass
2. Code review by maintainers
3. Security review for sensitive changes
4. Documentation review
5. Final approval and merge

---

## 🚀 Production Deployment & CI/CD

### **Deployment Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub Repo   │    │   Vercel CDN    │    │  Render Cloud   │
│                 │    │                 │    │                 │
│  Frontend Code  ├────┤  React App      │    │  FastAPI Server │
│  Backend Code   │    │  Static Assets  │    │  PostgreSQL DB  │
│  CI/CD Workflows│    │  PWA Features   │    │  File Storage   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────┤   End Users     ├──────────────┘
                        │                 │
                        │  📱 Mobile PWA  │
                        │  💻 Web App     │
                        │  🏥 Healthcare  │
                        └─────────────────┘
```

### **Frontend Deployment (Vercel)**

#### **1. Vercel Setup**
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link your project
cd frontend
vercel link

# Set environment variables
vercel env add REACT_APP_BACKEND_URL production
vercel env add REACT_APP_AI_CONFIDENCE_THRESHOLD production
vercel env add REACT_APP_HUGGINGFACE_SPACE_URL production
```

#### **2. Environment Variables in Vercel Dashboard**
```env
REACT_APP_BACKEND_URL=https://seekwell-backend.onrender.com
REACT_APP_AI_CONFIDENCE_THRESHOLD=0.8
REACT_APP_HUGGINGFACE_SPACE_URL=https://bnmbanhmi-seekwell-skin-cancer.hf.space
REACT_APP_ENABLE_OFFLINE_MODE=true
REACT_APP_ENABLE_PWA=true
REACT_APP_ENVIRONMENT=production
```

#### **3. Manual Deployment**
```bash
# Deploy to production
cd frontend
vercel --prod

# Deploy preview
vercel
```

#### **4. Custom Domain Setup**
```bash
# Add custom domain in Vercel dashboard
# seekwell.health -> Production
# staging.seekwell.health -> Preview

# Configure DNS records
# A record: 76.76.19.61
# CNAME: cname.vercel-dns.com
```

### **Backend Deployment (Render)**

#### **1. Render Setup**
1. **Create Render Account**: Sign up at [render.com](https://render.com)
2. **Connect GitHub**: Link your GitHub repository
3. **Create Web Service**: Select your backend directory
4. **Configure Build Settings**:
   ```
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

#### **2. Environment Variables in Render Dashboard**
```env
DATABASE_URL=postgresql://user:pass@host:port/db
SECRET_KEY=your-super-secret-production-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALLOWED_ORIGINS=["https://seekwell.vercel.app","https://seekwell.health"]
HUGGINGFACE_API_KEY=your-huggingface-key
ENVIRONMENT=production
PORT=8000
```

#### **3. Database Setup**
```bash
# Create PostgreSQL database in Render
# Copy internal database URL to DATABASE_URL env var

# Run initial migration
python setup_seekwell_database.py
```

#### **4. Custom Domain & SSL**
```bash
# Add custom domain in Render dashboard
# api.seekwell.health -> Backend service
# Automatic SSL certificate provisioning
```

### **Database Deployment (Render PostgreSQL)**

#### **1. Database Creation**
```yaml
# render.yaml configuration
databases:
  - name: seekwell-postgres
    databaseName: seekwell
    user: seekwell_user
    region: oregon
    plan: starter  # $7/month
```

#### **2. Database Migration**
```bash
# Connect to production database
export DATABASE_URL="postgresql://user:pass@host:port/db"

# Run migrations
cd backend
python setup_seekwell_database.py

# Verify connection
python -c "
import asyncio
from app.database import engine
from sqlalchemy import text

async def test_connection():
    async with engine.begin() as conn:
        result = await conn.execute(text('SELECT version()'))
        print(result.fetchone())

asyncio.run(test_connection())
"
```

### **CI/CD Pipeline Setup**

#### **1. GitHub Secrets Configuration**
```bash
# Required secrets in GitHub repository settings
VERCEL_ORG_ID=team_xxxxxxxxxxxx
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxx
VERCEL_TOKEN=xxxxxxxxxxxxxxxxxx
RENDER_SERVICE_ID=srv-xxxxxxxxxxxx
RENDER_API_KEY=rnd_xxxxxxxxxxxx
```

#### **2. Automatic Deployment Triggers**
```yaml
# Frontend triggers (.github/workflows/deploy-frontend.yml)
on:
  push:
    branches: [main]
    paths: ['frontend/**']
  pull_request:
    branches: [main]
    paths: ['frontend/**']

# Backend triggers (.github/workflows/deploy-backend.yml)
on:
  push:
    branches: [main]
    paths: ['backend/**', 'requirements.txt']
  pull_request:
    branches: [main]
    paths: ['backend/**']
```

#### **3. Deployment Workflow Overview**
```
1. Code Push to GitHub
   ├── Frontend changes → Vercel deployment
   ├── Backend changes → Render deployment
   └── Both changes → Full stack deployment

2. Pull Request
   ├── Run tests and linting
   ├── Deploy preview environments
   └── Generate deployment URLs

3. Merge to Main
   ├── Deploy to production
   ├── Run health checks
   └── Notify team of deployment status
```

### **Monitoring & Health Checks**

#### **1. Application Health Endpoints**
```python
# Backend health check (app/routers/health.py)
@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0",
        "services": {
            "database": await check_database_health(),
            "ai_model": await check_huggingface_health(),
            "storage": await check_storage_health()
        }
    }

# Database health check
async def check_database_health():
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "healthy", "response_time": "< 50ms"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
```

#### **2. Uptime Monitoring**
```bash
# Add uptime monitoring services
# UptimeRobot, Pingdom, or StatusPage

# Monitor these endpoints:
# https://seekwell.health (Frontend)
# https://api.seekwell.health/health (Backend)
# https://api.seekwell.health/docs (API Documentation)
```

### **Performance Optimization**

#### **1. Frontend Optimization**
```json
// Build optimization
{
  "scripts": {
    "build:analyze": "npm run build && npx webpack-bundle-analyzer build/static/js/*.js",
    "build:prod": "GENERATE_SOURCEMAP=false npm run build"
  }
}
```

#### **2. Backend Optimization**
```python
# Production optimizations
from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="SeekWell API",
    docs_url="/docs" if settings.environment != "production" else None,
    redoc_url="/redoc" if settings.environment != "production" else None,
)

# Add compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Configure CORS for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

### **Security Configuration**

#### **1. Environment Security**
```env
# Production security checklist
SSL_REDIRECT=true
SECURE_PROXY_SSL_HEADER=HTTP_X_FORWARDED_PROTO,https
SECURE_SSL_REDIRECT=true
SESSION_COOKIE_SECURE=true
CSRF_COOKIE_SECURE=true

# API security
CORS_ORIGINS=["https://seekwell.health"]
JWT_SECRET_KEY=minimum-32-character-secret-key
PASSWORD_SALT_ROUNDS=12
```

#### **2. Database Security**
```python
# Connection security
DATABASE_URL=postgresql://user:password@host:5432/db?sslmode=require

# Query security (SQLAlchemy with parameterized queries)
from sqlalchemy import text

# Safe query
result = await session.execute(
    text("SELECT * FROM patients WHERE id = :patient_id"),
    {"patient_id": patient_id}
)
```



