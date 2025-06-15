from sqlalchemy import (
    Column, Integer, String, Date, DateTime, Time, Text, ForeignKey, Enum, TIMESTAMP, Float, Boolean
)
from sqlalchemy.orm import relationship, declarative_base
from .database import Gender, Class, UserRole, Base
from sqlalchemy import create_engine
from .config import settings
from datetime import datetime


# Users table
class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(255), nullable=False)
    email = Column(String(255))
    hashed_password = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.PATIENT, nullable=False)
    full_name = Column(String(255), nullable=False)
    ### In the database, these havent exist yet.
    # reset_password_token = Column(String, nullable=True, index=True, unique=True) # Added for password reset
    # reset_password_token_expires_at = Column(DateTime, nullable=True) # Added for password reset
    # # Add other relevant fields for User
    # Quan hệ
    patient_profile = relationship("Patient", back_populates="user", uselist=False, cascade="all, delete-orphan")
    doctor_profile = relationship("Doctor", back_populates="user", uselist=False, cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")


# Patients table
class Patient(Base):
    __tablename__ = "patients"
    patient_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    full_name = Column(String(255), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(Enum(Gender), nullable=False)
    ethnic_group = Column(String(100))
    address = Column(String(255))
    phone_number = Column(String(20), unique=True)
    health_insurance_card_no = Column(String(20), unique=True)
    identification_id = Column(String(20), unique=True)
    job = Column(String(100))
    class_role = Column(Enum(Class), nullable=False)

    # Quan hệ
    user = relationship("User", back_populates="patient_profile", foreign_keys=[patient_id])

    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")
    medical_reports = relationship("MedicalReport", back_populates="patient", cascade="all, delete-orphan")
    skin_lesion_images = relationship("SkinLesionImage", back_populates="patient", cascade="all, delete-orphan")


# Hospitals table
class Hospital(Base):
    __tablename__ = "hospitals"
    hospital_id = Column(Integer, primary_key=True, autoincrement=True)
    hospital_name = Column(String(100))
    address = Column(String(255))
    governed_by = Column(String(160))  # chỉnh tên đúng typo 'gorverned_by' -> 'governed_by'

    doctors = relationship("Doctor", back_populates="hospital", cascade="all, delete-orphan")


# Doctors table
class Doctor(Base):
    __tablename__ = "doctors"
    doctor_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    doctor_name = Column(String(100))
    major = Column(String(160))
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id", ondelete="CASCADE"), nullable=False)

    # Quan hệ
    user = relationship("User", back_populates="doctor_profile", foreign_keys=[doctor_id])
    hospital = relationship("Hospital", back_populates="doctors")

    appointments = relationship("Appointment", back_populates="doctor", cascade="all, delete-orphan")
    medical_reports = relationship("MedicalReport", back_populates="doctor", cascade="all, delete-orphan")


# Appointments table
class Appointment(Base):
    __tablename__ = "appointments"
    appointment_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id", ondelete="CASCADE"), nullable=False)
    appointment_day = Column(Date, nullable=False)
    appointment_time = Column(Time, nullable=False)
    reason = Column(Text)
    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id", ondelete="CASCADE"), nullable=False)
    re_examination_date = Column(Date)
    re_examination_time = Column(Time)
    issue = Column(Text)

    # Quan hệ
    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")


# MedicalReports table
class MedicalReport(Base):
    __tablename__ = "medical_reports"
    record_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id", ondelete="CASCADE"))
    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id", ondelete="CASCADE"))
    in_day = Column(Date)
    out_day = Column(Date)
    in_diagnosis = Column(Text)
    out_diagnosis = Column(Text)
    reason_in = Column(Text)
    treatment_process = Column(Text)
    pulse_rate = Column(String(255))
    temperature = Column(String(255))
    blood_pressure = Column(String(255))
    respiratory_rate = Column(String(255))
    weight = Column(String(255))
    pathological_process = Column(Text)
    personal_history = Column(Text)
    family_history = Column(Text)
    diagnose_from_recommender = Column(Text)
    prescription = Column(Text)  # Thêm trường prescription
    doctor_notes = Column(Text)  # Thêm trường doctor_notes

    # Quan hệ
    patient = relationship("Patient", back_populates="medical_reports")
    doctor = relationship("Doctor", back_populates="medical_reports")


# Chat_Messages table
class ChatMessage(Base):
    __tablename__ = "chat_messages"
    chat_id = Column(Integer, primary_key=True, autoincrement=True)
    chat_message = Column(Text)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    time_stamp = Column(TIMESTAMP(timezone=True), server_default="now()", nullable=False)

    # Quan hệ
    user = relationship("User", back_populates="chat_messages")


# AI-related tables for skin lesion analysis
class SkinLesionImage(Base):
    __tablename__ = "skin_lesion_images"
    image_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id", ondelete="CASCADE"))
    image_path = Column(String(500), nullable=False)
    image_data = Column(Text, nullable=True)  # Base64 encoded image data
    upload_timestamp = Column(DateTime, default=datetime.utcnow)
    body_region = Column(String(100))
    ai_prediction = Column(String(200))
    confidence_score = Column(Float)
    needs_professional_review = Column(Boolean, default=False)
    reviewed_by_cadre = Column(Integer, ForeignKey("users.user_id"))
    reviewed_by_doctor = Column(Integer, ForeignKey("doctors.doctor_id"))
    status = Column(String(50), default='pending')  # pending, reviewed, completed
    notes = Column(Text)
    
    # Relationships
    patient = relationship("Patient", foreign_keys=[patient_id])
    cadre_reviewer = relationship("User", foreign_keys=[reviewed_by_cadre])
    doctor_reviewer = relationship("Doctor", foreign_keys=[reviewed_by_doctor])
    ai_assessment = relationship("AIAssessment", back_populates="lesion_image", uselist=False, cascade="all, delete-orphan")


class AIAssessment(Base):
    __tablename__ = "ai_assessments"
    assessment_id = Column(Integer, primary_key=True, autoincrement=True)
    image_id = Column(Integer, ForeignKey("skin_lesion_images.image_id", ondelete="CASCADE"))
    risk_level = Column(String(50))  # LOW, MEDIUM, HIGH, URGENT, UNCERTAIN
    confidence_level = Column(String(50))  # LOW, MEDIUM, HIGH, VERY_LOW
    predicted_class = Column(String(100))
    all_predictions = Column(Text)  # JSON string of all predictions
    recommendations = Column(Text)  # JSON string of recommendations
    follow_up_needed = Column(Boolean, default=False)
    follow_up_days = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    lesion_image = relationship("SkinLesionImage", back_populates="ai_assessment")


class BodyRegion(Base):
    __tablename__ = "body_regions"
    region_id = Column(Integer, primary_key=True, autoincrement=True)
    region_name = Column(String(100), nullable=False, unique=True)
    region_description = Column(Text)
    is_high_risk = Column(Boolean, default=False)  # face, neck, hands, etc.


class CadreReview(Base):
    __tablename__ = "cadre_reviews"
    review_id = Column(Integer, primary_key=True, autoincrement=True)
    image_id = Column(Integer, ForeignKey("skin_lesion_images.image_id", ondelete="CASCADE"))
    cadre_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"))
    review_notes = Column(Text)
    agrees_with_ai = Column(Boolean)
    escalate_to_doctor = Column(Boolean, default=False)
    local_recommendations = Column(Text)
    review_timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    lesion_image = relationship("SkinLesionImage", foreign_keys=[image_id])
    cadre = relationship("User", foreign_keys=[cadre_id])


class DoctorConsultation(Base):
    __tablename__ = "doctor_consultations"
    consultation_id = Column(Integer, primary_key=True, autoincrement=True)
    image_id = Column(Integer, ForeignKey("skin_lesion_images.image_id", ondelete="CASCADE"))
    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id", ondelete="CASCADE"))
    diagnosis = Column(Text, nullable=False)
    treatment_plan = Column(Text)
    urgency_level = Column(String(50))  # LOW, MEDIUM, HIGH, URGENT
    requires_specialist = Column(Boolean, default=False)
    specialist_type = Column(String(100))
    follow_up_days = Column(Integer)
    prescription = Column(Text)
    consultation_timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    lesion_image = relationship("SkinLesionImage", foreign_keys=[image_id])
    doctor = relationship("Doctor", foreign_keys=[doctor_id])
