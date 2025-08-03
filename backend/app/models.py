from sqlalchemy import (
    Column, Integer, String, Date, DateTime, Text, ForeignKey, Enum, Float, Boolean
)
from sqlalchemy.orm import relationship
from .database import Gender, UserRole, Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(255), nullable=False, unique=True)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.PATIENT, nullable=False)
    full_name = Column(String(255), nullable=False)

    patient_profile = relationship("Patient", back_populates="user", uselist=False, cascade="all, delete-orphan")
    # Simplified: A user can be a doctor, but we don't need a separate Doctor table for now.
    # The 'DOCTOR' role on the User model is sufficient.
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")


class Patient(Base):
    __tablename__ = "patients"
    patient_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    # Personal details are now in the User model (full_name).
    # We can add more patient-specific, non-identifying info here if needed.
    date_of_birth = Column(Date)
    gender = Column(Enum(Gender))
    address = Column(String(255))
    phone_number = Column(String(20), unique=True)

    user = relationship("User", back_populates="patient_profile")
    analysis_results = relationship("AnalysisResult", back_populates="patient", cascade="all, delete-orphan")


class AnalysisResult(Base):
    __tablename__ = "analysis_results"
    result_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String(255), nullable=False) # URL to the stored image
    upload_timestamp = Column(DateTime, default=datetime.utcnow)
    
    # AI Prediction Details
    prediction = Column(String(100)) # e.g., "Melanoma"
    confidence_score = Column(Float)
    risk_level = Column(String(50)) # e.g., "URGENT", "HIGH", "MEDIUM", "LOW"

    # Review Details
    is_urgent = Column(Boolean, default=False)
    reviewed_by_doctor_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    doctor_feedback = Column(Text, nullable=True)
    status = Column(String(50), default="PENDING_REVIEW") # PENDING_REVIEW, FORWARDED_TO_DOCTOR, DOCTOR_REVIEWED, CLOSED

    patient = relationship("Patient", back_populates="analysis_results")
    reviewer = relationship("User", foreign_keys=[reviewed_by_doctor_id])


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    message_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    message_text = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    is_from_user = Column(Boolean, default=True)

    user = relationship("User", back_populates="chat_messages")
