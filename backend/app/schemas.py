from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import date, datetime
from .database import UserRole, Gender

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: Optional[UserRole] = None
    user_id: int

class TokenData(BaseModel):
    username: str
    role: Optional[UserRole] = None

# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None

class UserSchema(UserBase):
    user_id: int
    model_config = ConfigDict(from_attributes=True)

# --- Password Recovery Schemas ---
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# --- Patient Schemas ---
class PatientBase(BaseModel):
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    address: Optional[str] = None
    phone_number: Optional[str] = None

class PatientCreate(PatientBase):
    # Linked to a user, so we only need the user_id
    user_id: int

class PatientUpdate(PatientBase):
    pass # All fields are optional in the base

class PatientSchema(PatientBase):
    patient_id: int
    user: UserSchema # Nested user details
    model_config = ConfigDict(from_attributes=True)

# --- Analysis Result Schemas ---
class AnalysisResultBase(BaseModel):
    image_url: str
    prediction: str
    confidence_score: float
    risk_level: str
    is_urgent: bool
    status: str

class AnalysisResultCreate(AnalysisResultBase):
    patient_id: int

class AnalysisResultUpdate(BaseModel):
    reviewed_by_doctor_id: Optional[int] = None
    doctor_feedback: Optional[str] = None
    status: Optional[str] = None

class AnalysisResultSchema(AnalysisResultBase):
    result_id: int
    patient_id: int
    upload_timestamp: datetime
    reviewed_by_doctor_id: Optional[int] = None
    doctor_feedback: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

# --- Chat Schemas ---
class ChatMessageBase(BaseModel):
    message_text: str
    is_from_user: bool

class ChatMessageCreate(ChatMessageBase):
    user_id: int

class ChatMessageSchema(ChatMessageBase):
    message_id: int
    user_id: int
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)
