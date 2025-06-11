# SeekWell - ADSE Competition Project Plan

**AI-Powered Mobile Web App for Skin Lesion Classification**

---

## 🎯 Project Overview

### Vision Statement
Transform the existing clinic management system into **SeekWell** - a mobile-first web application that integrates AI for skin lesion classification while maintaining human oversight through local cadres and doctors.

### Key Objectives
- ✅ Integrate AI model for classifying skin lesions (skin cancer detection)
- ✅ Create mobile-responsive web application
- ✅ Maintain role of local cadres (replacing clinic staff)
- ✅ Enable remote doctor consultations
- ✅ Store and track skin lesion images over time
- ✅ Provide preliminary health assessments with professional follow-up

### Current Status - Phase 1 Complete! 🎉
- **Base System**: Clinic management web app (Complete)
- **Tech Stack**: FastAPI + React + PostgreSQL
- **Users**: Admin, Doctor, Patient roles + NEW Local Cadre role
- **Features**: Authentication, appointments, EMR, chat functionality
- **NEW**: Complete mobile-first UI transformation with SeekWell branding

#### Phase 1 Implementation Summary ✅
**Mobile-First Design System**: 
- Enhanced design-system.css with 30+ mobile-specific CSS variables
- Touch targets (44px minimum), mobile spacing scale, responsive typography
- SeekWell color palette with skin lesion risk indicators
- Dark mode support, reduced motion preferences, safe area handling

**PWA Transformation**:
- Updated manifest.json with SeekWell branding and health category
- Mobile-first orientation (portrait), proper icon setup
- Enhanced service worker capabilities for offline functionality

**Key Components Built**:
- `PatientDashboardMobile.tsx`: Comprehensive dashboard with skin assessment tracking
- `MobileNavigation.tsx`: Role-based bottom navigation with featured actions
- `SkinLesionCapture.tsx`: Full camera integration with multi-step capture flow
- `BodyRegionSelector.tsx`: Anatomical region selection with visual body map
- Enhanced `LoginPage.tsx` and `RegisterPage.tsx` with mobile-first design

**Mobile UX Features**:
- Progressive disclosure for complex forms
- Haptic feedback simulation
- Touch-friendly gesture support  
- Responsive grid layouts with mobile breakpoints
- Accessibility compliance (WCAG 2.1 AA)

---

## 📋 Development Phases

### Phase 1: Mobile-First UI Transformation (Week 1-2) ✅ COMPLETED
**Goal**: Convert existing React components to mobile-first responsive design

#### 1.1 Responsive Design Overhaul ✅ COMPLETED
- ✅ Convert existing React components to mobile-first responsive design
- ✅ Implement touch-friendly interfaces  
- ✅ Add PWA (Progressive Web App) capabilities
- ✅ Optimize for various screen sizes (320px to tablet)

#### 1.2 User Role Adaptation ✅ COMPLETED
- ✅ **Patients**: Primary users for skin lesion self-assessment
- ✅ **Local Cadres**: Replace "clinic staff" - provide initial screening and guidance
- ✅ **Doctors**: Remote consultation and final diagnosis
- ✅ **Admin**: System oversight and AI model management

#### Key Components Completed ✅
```typescript
// ✅ COMPLETED - Mobile-optimized components:
✅ PatientDashboardMobile.tsx → Mobile skin lesion capture interface
✅ MobileNavigation.tsx → Role-based bottom navigation
✅ LoginPage.tsx → Touch-friendly authentication with SeekWell branding
✅ RegisterPage.tsx → Mobile-first multi-step registration
✅ SkinLesionCapture.tsx → Complete camera integration and UI
✅ BodyRegionSelector.tsx → Touch-friendly body region selection
✅ Design system CSS → Mobile variables and utility classes
✅ PWA manifest.json → SeekWell branding and mobile configuration
```

#### Phase 1 Deliverables Completed ✅
- ✅ **Mobile-First Design System**: Comprehensive CSS variables for mobile spacing, typography, colors, and touch targets
- ✅ **PWA Configuration**: Updated manifest.json with SeekWell branding, mobile-first settings, health category
- ✅ **Touch-Friendly Navigation**: Role-based mobile navigation with haptic feedback simulation
- ✅ **Enhanced Authentication**: Mobile-optimized login/register pages with multi-step forms and password validation
- ✅ **Medical Components**: SkinLesionCapture with camera integration and BodyRegionSelector for anatomical selection
- ✅ **Responsive Dashboards**: Mobile-first patient dashboard with skin assessment tracking and AI chat integration
- ✅ **Accessibility Features**: WCAG compliance, safe area support, reduced motion preferences, dark mode support

---

### Phase 2: AI Integration Architecture (Week 2-3)
**Goal**: Integrate AI model for skin lesion classification

#### 2.1 Database Schema Extensions

```sql
-- New tables to add to PostgreSQL
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
    risk_level VARCHAR(50), -- LOW, MEDIUM, HIGH, URGENT
    recommendations TEXT,
    follow_up_needed BOOLEAN DEFAULT FALSE,
    follow_up_days INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE body_regions (
    region_id SERIAL PRIMARY KEY,
    region_name VARCHAR(100) NOT NULL,
    region_description TEXT
);

-- Modify existing user roles
ALTER TYPE userrole ADD VALUE 'LOCAL_CADRE';
```

#### 2.2 New SQLAlchemy Models

```python
# Add to backend/app/models.py
class SkinLesionImage(Base):
    __tablename__ = "skin_lesion_images"
    image_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id", ondelete="CASCADE"))
    image_path = Column(String(500), nullable=False)
    upload_timestamp = Column(DateTime, default=datetime.utcnow)
    body_region = Column(String(100))
    ai_prediction = Column(String(200))
    confidence_score = Column(Float)
    needs_professional_review = Column(Boolean, default=False)
    reviewed_by_cadre = Column(Integer, ForeignKey("users.user_id"))
    reviewed_by_doctor = Column(Integer, ForeignKey("doctors.doctor_id"))
    status = Column(String(50), default='pending')
    notes = Column(Text)
    
    # Relationships
    patient = relationship("Patient", back_populates="skin_lesion_images")
    cadre_reviewer = relationship("User", foreign_keys=[reviewed_by_cadre])
    doctor_reviewer = relationship("Doctor", foreign_keys=[reviewed_by_doctor])
    ai_assessment = relationship("AIAssessment", back_populates="lesion_image", uselist=False)

class AIAssessment(Base):
    __tablename__ = "ai_assessments"
    assessment_id = Column(Integer, primary_key=True, autoincrement=True)
    image_id = Column(Integer, ForeignKey("skin_lesion_images.image_id", ondelete="CASCADE"))
    risk_level = Column(String(50))
    recommendations = Column(Text)
    follow_up_needed = Column(Boolean, default=False)
    follow_up_days = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    lesion_image = relationship("SkinLesionImage", back_populates="ai_assessment")
```

#### 2.3 AI Model Integration Options

**Option A: Cloud-based AI (Recommended)**
```python
# Use Google Cloud Vision AI or AWS Rekognition
import google.cloud.vision
# or
import boto3

async def classify_skin_lesion(image_data: bytes) -> dict:
    # Implementation for cloud-based classification
    pass
```

**Option B: Local Model**
```python
# TensorFlow/PyTorch model integration
import tensorflow as tf

async def classify_skin_lesion_local(image_data: bytes) -> dict:
    # Load pre-trained model and classify
    pass
```

#### 2.4 New API Endpoints

```python
# Add to backend/app/routers/skin_lesions.py
@router.post("/upload-skin-image")
async def upload_skin_image(
    image: UploadFile,
    body_region: str,
    patient_id: int,
    current_user: User = Depends(get_current_user)
):
    """Upload and analyze skin lesion image"""
    pass

@router.get("/skin-assessments/{patient_id}")
async def get_patient_assessments(patient_id: int):
    """Retrieve patient's skin lesion history"""
    pass

@router.post("/cadre-review/{image_id}")
async def cadre_review_image(
    image_id: int,
    review_data: CadreReviewSchema,
    current_user: User = Depends(get_current_cadre)
):
    """Local cadre reviews skin lesion assessment"""
    pass

@router.post("/doctor-consultation/{image_id}")
async def doctor_consultation(
    image_id: int,
    consultation_data: DoctorConsultationSchema,
    current_user: User = Depends(get_current_doctor)
):
    """Doctor provides remote consultation"""
    pass
```

---

### Phase 3: Enhanced Database Schema (Week 3)
**Goal**: Implement all database changes and migrations

#### 3.1 Database Migration Files
```python
# Create: backend/database/migrations/add_skin_lesion_tables.py
def upgrade():
    # Create new tables
    op.create_table('skin_lesion_images', ...)
    op.create_table('ai_assessments', ...)
    # Add new user role
    op.execute("ALTER TYPE userrole ADD VALUE 'LOCAL_CADRE'")

def downgrade():
    # Rollback changes
    pass
```

#### 3.2 Update Existing Models
```python
# Modify Patient model to add relationship
class Patient(Base):
    # ...existing code...
    skin_lesion_images = relationship("SkinLesionImage", back_populates="patient", cascade="all, delete-orphan")
```

---

### Phase 4: Mobile UI Components (Week 4-5)
**Goal**: Create mobile-optimized React components

#### 4.1 Core New Components

```typescript
// 1. SkinLesionCapture.tsx - Camera integration
interface SkinLesionCaptureProps {
  onImageCapture: (image: File, bodyRegion: string) => void;
  onCancel: () => void;
}

// 2. BodyRegionSelector.tsx - Interactive body map
interface BodyRegionSelectorProps {
  selectedRegion: string;
  onRegionSelect: (region: string) => void;
}

// 3. AIAssessmentResults.tsx - Display AI predictions
interface AIAssessmentResultsProps {
  assessment: AIAssessment;
  onReviewRequest: () => void;
}

// 4. LesionTimeline.tsx - Track lesion changes over time
interface LesionTimelineProps {
  patientId: number;
  bodyRegion?: string;
}

// 5. CadreReviewDashboard.tsx - Local cadre workflow
interface CadreReviewDashboardProps {
  pendingReviews: SkinLesionImage[];
  onReviewComplete: (imageId: number, review: CadreReview) => void;
}

// 6. RemoteConsultation.tsx - Doctor review interface
interface RemoteConsultationProps {
  consultationData: ConsultationData;
  onConsultationSubmit: (consultation: DoctorConsultation) => void;
}
```

#### 4.2 Mobile UI Guidelines
- **Touch Targets**: Minimum 44px for buttons
- **Typography**: Minimum 16px font size for readability
- **Navigation**: Bottom tab navigation for primary actions
- **Images**: Responsive image gallery with zoom capabilities
- **Forms**: Progressive disclosure, one section at a time

#### 4.3 PWA Configuration
```json
// Update public/manifest.json
{
  "name": "SeekWell - AI Health Assistant",
  "short_name": "SeekWell",
  "description": "AI-powered skin lesion assessment tool",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3498db",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "logo192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "logo512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

---

### Phase 5: Workflow Integration (Week 5-6)
**Goal**: Implement complete user workflows

#### 5.1 Patient Workflow
1. **Registration/Login** → Mobile-optimized authentication
2. **Skin Assessment** → Capture lesion image with guidance
3. **Body Region Selection** → Interactive body map
4. **AI Analysis** → Immediate classification results
5. **Risk Assessment** → Clear risk communication
6. **Next Steps** → Follow-up recommendations
7. **Tracking** → Historical lesion monitoring

#### 5.2 Local Cadre Workflow
1. **Dashboard** → Queue of pending reviews
2. **Image Review** → AI assessment summary
3. **Patient Consultation** → Local guidance and education
4. **Escalation Decision** → Route to doctor if needed
5. **Follow-up Scheduling** → Community health monitoring
6. **Reporting** → Health metrics and outcomes

#### 5.3 Doctor Workflow
1. **Remote Dashboard** → High-priority cases
2. **Case Review** → Complete patient history
3. **Diagnosis** → Professional assessment
4. **Treatment Plan** → Recommendations and prescriptions
5. **Referral System** → Specialist consultations
6. **Follow-up** → Remote monitoring

#### 5.4 User Journey Map
```
Patient Journey:
Concern → Photo → AI Analysis → Risk Level → Human Review → Treatment Plan

Low Risk: Patient → AI → Cadre Guidance → Self-monitoring
Medium Risk: Patient → AI → Cadre Review → Doctor Consultation → Treatment
High Risk: Patient → AI → Urgent Cadre Review → Immediate Doctor Consultation → Referral
```

---

### Phase 6: Mobile Optimization (Week 6-7)
**Goal**: Optimize for mobile performance and offline capabilities

#### 6.1 Performance Optimizations
- [ ] Image compression and optimization
- [ ] Lazy loading for image galleries
- [ ] Service worker for offline functionality
- [ ] Push notifications for follow-ups
- [ ] Local storage for draft assessments

#### 6.2 Camera Integration
```typescript
// Camera API integration
const captureImage = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
    // Camera implementation
  } catch (error) {
    // Fallback to file upload
  }
};
```

#### 6.3 Offline Capabilities
```typescript
// Service worker for offline functionality
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/skin-lesions')) {
    event.respondWith(
      // Cache strategy for offline support
    );
  }
});
```

---

### Phase 7: Testing & Validation (Week 7-8)
**Goal**: Comprehensive testing and validation

#### 7.1 AI Model Testing
- [ ] Test with diverse skin types and conditions
- [ ] Validate against dermatologist assessments
- [ ] Implement feedback loop for model improvement
- [ ] Performance benchmarking (accuracy, speed)

#### 7.2 User Testing Checklist
- [ ] Patient usability testing (different age groups)
- [ ] Cadre workflow validation
- [ ] Doctor remote consultation testing
- [ ] Mobile performance across devices
- [ ] Accessibility compliance (WCAG 2.1)

#### 7.3 Security Testing
- [ ] HIPAA compliance for health data
- [ ] Image encryption and secure storage
- [ ] User authentication and authorization
- [ ] API security and rate limiting

---

### Phase 8: Deployment & Documentation (Week 8)
**Goal**: Production deployment and competition deliverables

#### 8.1 Competition Deliverables
1. **Demo Video** (5-10 minutes)
   - Patient journey from capture to diagnosis
   - AI classification demonstration
   - Cadre and doctor workflows
   - Impact on rural healthcare access

2. **Technical Documentation**
   - Architecture overview
   - AI integration details
   - Security and privacy measures
   - Scalability considerations

3. **Impact Analysis**
   - Healthcare access improvement metrics
   - Cost-effectiveness analysis
   - User adoption projections
   - Social impact assessment

4. **Business Plan**
   - Sustainability model
   - Scaling strategy
   - Partnership opportunities
   - Revenue projections

#### 8.2 Deployment Strategy
```yaml
# Docker configuration for cloud deployment
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_BACKEND_URL=https://api.seekwell.app
  
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://...
      - AI_MODEL_API_KEY=...
  
  postgres:
    image: postgres:13
    environment:
      - POSTGRES_DB=seekwell
      - POSTGRES_USER=...
      - POSTGRES_PASSWORD=...
```

---

## 🎯 Success Metrics for ADSE Competition

### Innovation Impact
- **Rural Health Access**: Demonstrate reach to underserved areas
- **Early Detection**: Show potential for earlier skin cancer detection
- **Cost Effectiveness**: Compare to traditional screening methods
- **User Adoption**: Mobile-first design driving higher engagement

### Technical Excellence
- **AI Integration**: Sophisticated yet accessible AI implementation
- **Mobile Performance**: Fast, responsive mobile web experience (<3s load time)
- **Scalability**: Architecture supporting 10K+ concurrent users
- **Human-AI Collaboration**: Effective cadre and doctor involvement

### Social Impact
- **Health Equity**: Bridging urban-rural healthcare gaps
- **Preventive Care**: Shifting from treatment to prevention
- **Community Empowerment**: Training local cadres as health advocates
- **Sustainable Model**: Framework for expansion to other conditions

---

## 🛠 Development Environment Setup

### Prerequisites
```bash
# Backend setup
cd backend
python -m venv .venv
source .venv/bin/activate  # On macOS/Linux
pip install -r requirements.txt

# Frontend setup
cd frontend
npm install

# Database setup
# Ensure PostgreSQL is running
python app/create_initial_admin.py
```

### Environment Variables
```bash
# Backend (.env)
DATABASE_URL=postgresql://username:password@localhost/seekwell
SECRET_KEY=your-secret-key
AI_MODEL_API_KEY=your-ai-api-key
ALLOWED_ORIGINS=["http://localhost:3000"]

# Frontend (.env)
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_AI_CONFIDENCE_THRESHOLD=0.8
```

---

## 🚀 Quick Start Commands

```bash
# Start backend server
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload

# Start frontend development server
cd frontend && npm start

# Run database migrations
cd backend && python database/migrations/add_skin_lesion_tables.py

# Initialize sample data
cd backend && python app/create_initial_admin.py
```

---

## 📚 Key Resources

### AI/ML Resources
- [DermNet Skin Disease Atlas](https://dermnetnz.org/)
- [HAM10000 Dataset](https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/DBW86T)
- [Google Cloud Vision AI](https://cloud.google.com/vision)
- [TensorFlow.js](https://www.tensorflow.org/js)

### Mobile Development
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [React Native Web](https://necolas.github.io/react-native-web/)
- [Mobile-First Design Principles](https://www.lukew.com/ff/entry.asp?933)

### Healthcare Standards
- [HIPAA Compliance](https://www.hhs.gov/hipaa/index.html)
- [HL7 FHIR](https://www.hl7.org/fhir/)
- [FDA Digital Health Guidelines](https://www.fda.gov/medical-devices/digital-health-center-excellence)

---

## 📝 Progress Tracking

### Week 1-2: Mobile UI ✅ / ❌
- [ ] Convert PatientDashboard to mobile-first
- [ ] Update authentication flows
- [ ] Implement PWA basics
- [ ] Test on various devices

### Week 3-4: AI Integration ✅ / ❌
- [ ] Database schema implementation
- [ ] AI model selection and testing
- [ ] API endpoint development
- [ ] Image processing pipeline

### Week 5-6: Workflows ✅ / ❌
- [ ] Patient capture workflow
- [ ] Cadre review system
- [ ] Doctor consultation interface
- [ ] End-to-end testing

### Week 7-8: Competition Prep ✅ / ❌
- [ ] Performance optimization
- [ ] Security implementation
- [ ] Demo preparation
- [ ] Documentation completion

---

## 🤝 Team Responsibilities

### Technical Development
- **Backend**: AI integration, API development, database schema
- **Frontend**: Mobile UI, PWA implementation, user workflows
- **DevOps**: Deployment, performance optimization, monitoring

### Competition Preparation
- **Demo Creation**: Video production, presentation materials
- **Documentation**: Technical docs, impact analysis, business plan
- **Testing**: User testing, performance validation, security audit

---

## 📞 Support & Contact

For questions or issues during development:
1. Check existing documentation in `/documents/`
2. Review similar implementations in `/frontend/src/components/`
3. Test API endpoints using FastAPI automatic documentation at `/docs`

---

*Last Updated: June 11, 2025*
*Project: SeekWell - ADSE Competition*
*Team: [Your Team Name]*
