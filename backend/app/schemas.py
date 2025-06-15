from pydantic import BaseModel, EmailStr, ConfigDict # Add ConfigDict
from typing import Optional, List, Dict, Any
from datetime import date, datetime, time # Added date
from .database import UserRole # Ensure UserRole is available if needed for nested schemas

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: Optional[str] = None # Role can be included in the token response
    user_id: int

# User Schemas
class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: UserRole # UserRole will be updated to PATIENT, DOCTOR, CLINIC_STAFF, ADMIN

class UserCreate(UserBase):
    password: str

class UserCreateInternal(UserCreate): # For internal use, like creating from admin panel
    pass

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    password: Optional[str] = None

class UserInDBBase(UserBase):
    user_id: int
    # role: UserRole # Already in UserBase

    model_config = ConfigDict(from_attributes=True) # Updated for Pydantic v2

class UserSchema(UserBase): # Renamed from User to UserSchema to avoid conflict with model
    user_id: int

    model_config = ConfigDict(from_attributes=True) # Updated for Pydantic v2

# Password Recovery Schemas
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# Token Data Schema (for dependency)
class TokenData(BaseModel):
    username: str # Changed from Optional[str] to str
    role: Optional[UserRole] = None # Add role to token data

# Patient Schemas
class PatientBase(BaseModel):
    username: Optional[str] = None  # Changed to optional
    email: Optional[EmailStr] = None  # Add email
    full_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    ehtnic_group: Optional[str] = None
    address: Optional[str] = None
    phone_number: Optional[str] = None
    health_insurance_card_no: Optional[str] = None
    identification_id: Optional[str] = None
    job: Optional[str] = None
    class_role: Optional[str] = None # Class role can be updated
    emr_summary: Optional[str] = None # Electronic Health Record summary

class PatientCreate(PatientBase):
    patient_id: int # Added to link to an existing user
    # creator_id will be set based on the logged-in user (Patient or Clinic Staff)

class PatientUpdate(PatientBase):
    full_name: Optional[str] = None # All fields optional for update
    emr_summary: Optional[str] = None # EMR summary field for updates
    # Add other updatable fields as necessary

class PatientSchema(PatientBase):
    patient_id: int
    # creator_id: int
    # created_at: datetime
    # updated_at: datetime
    # creator: Optional[UserSchema] = None # Nested schema for creator info

    model_config = ConfigDict(from_attributes=True) # Updated for Pydantic v2

# Doctor Schemas
class DoctorBase(BaseModel):
    username: Optional[str] = None  # Changed to optional
    email: Optional[EmailStr] = None  # Add email
    doctor_name: str
    major: Optional[str] = None
    hospital_id: int  # required as per the model (nullable=False)

class DoctorCreate(DoctorBase):
    doctor_id: int  # Link to User.user_id

class DoctorUpdate(BaseModel):
    doctor_name: Optional[str] = None
    major: Optional[str] = None
    hospital_id: Optional[int] = None

class DoctorSchema(DoctorBase):
    doctor_id: int

    model_config = ConfigDict(from_attributes=True)

# Hospital Schemas
class HospitalBase(BaseModel):
    hospital_name: str
    address: Optional[str] = None
    governed_by: Optional[str] = None

class HospitalCreate(HospitalBase):
    pass

class HospitalUpdate(BaseModel):
    hospital_name: Optional[str] = None
    address: Optional[str] = None
    governed_by: Optional[str] = None

class HospitalSchema(HospitalBase):
    hospital_id: int

    model_config = ConfigDict(from_attributes=True)


# Appointment Schemas (New)
class AppointmentBase(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_time: time
    appointment_day: date
    reason: Optional[str] = None
    # status: Optional[str] = "Scheduled" # e.g., Scheduled, Cancelled, Completed

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    appointment_time: Optional[time] = None
    appointment_day: Optional[date] = None
    reason: Optional[str] = None
    # status: Optional[str] = None

class AppointmentSchema(AppointmentBase):
    appointment_id: int
    patient_id: int
    doctor_id: int
    # doctor: UserSchema  # Potentially include doctor details
    # patient: PatientSchema # Potentially include patient details

    model_config = ConfigDict(from_attributes=True) # Updated for Pydantic v2

class AvailableDoctor(BaseModel):
    doctor_id: int
    doctor_name: str

class AvailableSlot(BaseModel):
    datetime: datetime
    available_doctors: List[AvailableDoctor]

# New schema for EMR updates
class PatientEMRUpdate(BaseModel):
    emr_summary: Optional[str] = None # Optional: Summary of the patient's EMR

class ChatMessageBase(BaseModel):
    chat_message: str

class ChatMessageCreate(ChatMessageBase):
    user_id: Optional[int] = None # Optional: Link message to a user if logged in

class ChatMessageSchema(ChatMessageBase):
    chat_id: int
    times_tamp: datetime
    # response: Optional[str] = None # Chatbot's response
    user_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True) # Updated for Pydantic v2

class MedicalReportBase(BaseModel):
    patient_id: int
    doctor_id: int
    in_day: Optional[date] = None
    out_day: Optional[date] = None
    in_diagnosis: Optional[str] = None
    out_diagnosis: Optional[str] = None
    reason_in: Optional[str] = None
    treatment_process: Optional[str] = None
    pulse_rate: Optional[str] = None
    temperature: Optional[str] = None
    blood_pressure: Optional[str] = None
    respiratory_rate: Optional[str] = None
    weight: Optional[str] = None
    pathological_process: Optional[str] = None
    personal_history: Optional[str] = None
    family_history: Optional[str] = None
    diagnose_from_recommender: Optional[str] = None
    prescription: Optional[str] = None  # Thêm trường prescription
    doctor_notes: Optional[str] = None  # Thêm trường doctor_notes

class MedicalReportCreate(MedicalReportBase):
    # Với create, bắt buộc có patient_id và doctor_id nên không để Optional
    pass

class MedicalReportUpdate(BaseModel):
    patient_id: Optional[int] = None
    doctor_id: Optional[int] = None
    in_day: Optional[date] = None
    out_day: Optional[date] = None
    in_diagnosis: Optional[str] = None
    out_diagnosis: Optional[str] = None
    reason_in: Optional[str] = None
    treatment_process: Optional[str] = None
    pulse_rate: Optional[str] = None
    temperature: Optional[str] = None
    blood_pressure: Optional[str] = None
    respiratory_rate: Optional[str] = None
    weight: Optional[str] = None
    pathological_process: Optional[str] = None
    personal_history: Optional[str] = None
    family_history: Optional[str] = None
    diagnose_from_recommender: Optional[str] = None
    prescription: Optional[str] = None  # Added missing field
    doctor_notes: Optional[str] = None  # Added missing field

    model_config = {
        "from_attributes": True  # mới trên Pydantic v2
    }

# Patient Search Schemas
class PatientSearchQuery(BaseModel):
    """Schema for patient search parameters"""
    query: Optional[str] = None  # General search query for name, email, phone
    patient_id: Optional[int] = None  # Search by specific patient ID
    full_name: Optional[str] = None  # Search by full name (partial match)
    phone_number: Optional[str] = None  # Search by phone number
    email: Optional[str] = None  # Search by email
    identification_id: Optional[str] = None  # Search by identification ID
    health_insurance_card_no: Optional[str] = None  # Search by health insurance card
    gender: Optional[str] = None  # Filter by gender
    age_min: Optional[int] = None  # Minimum age filter
    age_max: Optional[int] = None  # Maximum age filter
    skip: int = 0  # Pagination offset
    limit: int = 100  # Pagination limit
    sort_by: Optional[str] = "full_name"  # Sort field: full_name, date_of_birth, patient_id
    sort_order: Optional[str] = "asc"  # Sort order: asc, desc

class PatientSearchResult(BaseModel):
    """Enhanced patient schema for search results"""
    patient_id: int
    full_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    identification_id: Optional[str] = None
    health_insurance_card_no: Optional[str] = None
    age: Optional[int] = None  # Calculated age
    
    model_config = ConfigDict(from_attributes=True)

class PatientSearchResponse(BaseModel):
    """Response schema for patient search results"""
    patients: List[PatientSearchResult]
    total_count: int
    page: int
    per_page: int
    total_pages: int
class MedicalReportSchema(MedicalReportBase):
    record_id: int

    model_config = {
        "from_attributes": True
    }


# AI-related schemas for skin lesion analysis
class PredictionResult(BaseModel):
    """Schema for individual AI prediction result"""
    class_id: int
    label: str
    confidence: float
    percentage: float

class RiskAssessment(BaseModel):
    """Schema for risk assessment results"""
    risk_level: str  # LOW, MEDIUM, HIGH, URGENT, UNCERTAIN
    confidence_level: str  # LOW, MEDIUM, HIGH, VERY_LOW
    needs_professional_review: bool
    needs_urgent_attention: bool
    base_risk: str
    confidence_score: float
    predicted_class: str

class SkinLesionAnalysisRequest(BaseModel):
    """Schema for skin lesion analysis request"""
    body_region: Optional[str] = None
    notes: Optional[str] = None

class SkinLesionAnalysisResponse(BaseModel):
    """Schema for skin lesion analysis response"""
    success: bool
    error: Optional[str] = None
    analysis_id: Optional[int] = None
    predictions: List[PredictionResult] = []
    risk_assessment: Optional[RiskAssessment] = None
    recommendations: List[str] = []
    needs_cadre_review: bool = False
    needs_doctor_review: bool = False
    timestamp: Optional[datetime] = None

class SkinLesionImageBase(BaseModel):
    """Base schema for skin lesion image"""
    body_region: Optional[str] = None
    ai_prediction: Optional[str] = None
    confidence_score: Optional[float] = None
    status: str = "pending"
    notes: Optional[str] = None

class SkinLesionImageCreate(SkinLesionImageBase):
    """Schema for creating skin lesion image record"""
    patient_id: int
    image_path: str
    image_data: Optional[str] = None  # Base64 encoded image

class SkinLesionImageSchema(SkinLesionImageBase):
    """Schema for skin lesion image response"""
    image_id: int
    patient_id: int
    image_path: str
    upload_timestamp: datetime
    needs_professional_review: bool
    reviewed_by_cadre: Optional[int] = None
    reviewed_by_doctor: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class AIAssessmentBase(BaseModel):
    """Base schema for AI assessment"""
    risk_level: str
    confidence_level: str
    predicted_class: str
    all_predictions: Optional[str] = None  # JSON string
    recommendations: Optional[str] = None  # JSON string
    follow_up_needed: bool = False
    follow_up_days: Optional[int] = None

class AIAssessmentCreate(AIAssessmentBase):
    """Schema for creating AI assessment"""
    image_id: int

class AIAssessmentSchema(AIAssessmentBase):
    """Schema for AI assessment response"""
    assessment_id: int
    image_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CadreReviewBase(BaseModel):
    """Base schema for cadre review"""
    review_notes: str
    agrees_with_ai: Optional[bool] = None
    escalate_to_doctor: bool = False
    local_recommendations: Optional[str] = None

class CadreReviewCreate(CadreReviewBase):
    """Schema for creating cadre review"""
    image_id: int

class CadreReviewSchema(CadreReviewBase):
    """Schema for cadre review response"""
    review_id: int
    image_id: int
    cadre_id: int
    review_timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class DoctorConsultationBase(BaseModel):
    """Base schema for doctor consultation"""
    diagnosis: str
    treatment_plan: Optional[str] = None
    urgency_level: Optional[str] = None
    requires_specialist: bool = False
    specialist_type: Optional[str] = None
    follow_up_days: Optional[int] = None
    prescription: Optional[str] = None

class DoctorConsultationCreate(DoctorConsultationBase):
    """Schema for creating doctor consultation"""
    image_id: int

class DoctorConsultationSchema(DoctorConsultationBase):
    """Schema for doctor consultation response"""
    consultation_id: int
    image_id: int
    doctor_id: int
    consultation_timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class BodyRegionSchema(BaseModel):
    """Schema for body region"""
    region_id: int
    region_name: str
    region_description: Optional[str] = None
    is_high_risk: bool = False

    model_config = ConfigDict(from_attributes=True)

class PatientLesionHistory(BaseModel):
    """Schema for patient's lesion analysis history"""
    patient_id: int
    total_analyses: int
    pending_reviews: int
    high_risk_count: int
    recent_analyses: List[SkinLesionImageSchema] = []

class ReviewQueueItem(BaseModel):
    """Schema for review queue item"""
    image_id: int
    patient_name: str
    patient_id: int
    upload_timestamp: datetime
    body_region: Optional[str] = None
    ai_prediction: Optional[str] = None
    confidence_score: Optional[float] = None
    risk_level: str
    days_pending: int

class ReviewQueue(BaseModel):
    """Schema for review queue"""
    total_pending: int
    urgent_count: int
    high_priority_count: int
    medium_priority_count: int
    low_priority_count: int
    queue_items: List[ReviewQueueItem] = []

class AIServiceStatus(BaseModel):
    """Schema for AI service status"""
    is_initialized: bool
    service_name: str
    version: str
    model_info: Optional[Dict[str, Any]] = None
    last_health_check: Optional[datetime] = None
