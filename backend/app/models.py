from sqlalchemy import Column, Integer, String, Enum as SQLAlchemyEnum, Date, Text, DateTime, ForeignKey # Add Date, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship # Add relationship
from .database import Base, UserRole # Import Base and UserRole from database.py
from datetime import datetime # Add datetime
from typing import Optional # Added Optional for type hinting

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLAlchemyEnum(UserRole), nullable=False, default=UserRole.PATIENT) # Changed from CADRE to PATIENT
    full_name = Column(String, nullable=True)
    # Add other relevant fields for User

    __table_args__ = {'extend_existing': True}

    # Relationships
    created_patients = relationship("Patient", foreign_keys="Patient.creator_id", back_populates="creator")
    # Update relationship to reflect Doctor instead of Cadre
    assigned_patients_as_doctor = relationship("Patient", foreign_keys="Patient.assigned_doctor_id", back_populates="assigned_doctor")

    # Relationships for appointments
    created_appointments = relationship("Appointment", foreign_keys="Appointment.created_by_user_id", back_populates="created_by_user")
    doctor_appointments = relationship("Appointment", foreign_keys="Appointment.doctor_id", back_populates="doctor")
    patient_appointments = relationship("Appointment", foreign_keys="Appointment.patient_id", back_populates="patient_record") # Renamed to avoid conflict if a User is also a Patient

    # Relationships for chat messages
    chat_messages = relationship("ChatMessage", back_populates="user")

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String, nullable=True) # Could be an Enum later
    address = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    emr_summary = Column(Text, nullable=True) # For basic EMR context. This is a Text field.

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False) # Can be a Patient themselves or Clinic Staff
    assigned_doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Changed from assigned_cadre_id

    creator = relationship(User, foreign_keys=[creator_id], back_populates="created_patients")
    assigned_doctor = relationship(User, foreign_keys=[assigned_doctor_id], back_populates="assigned_patients_as_doctor") # Changed from assigned_cadre

    # Relationship for appointments where this patient is involved
    appointments = relationship("Appointment", foreign_keys="Appointment.patient_id", back_populates="patient")

    __table_args__ = {'extend_existing': True}

# New Appointment Model
class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False) # FK to User table (Doctor)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False) # User who created appointment (Patient/Staff)
    appointment_time = Column(DateTime, nullable=False)
    reason = Column(Text, nullable=True)
    status = Column(String, default="Scheduled") # e.g., Scheduled, Cancelled, Completed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = relationship("Patient", foreign_keys=[patient_id], back_populates="appointments")
    doctor = relationship("User", foreign_keys=[doctor_id], back_populates="doctor_appointments")
    created_by_user = relationship("User", foreign_keys=[created_by_user_id], back_populates="created_appointments")

    __table_args__ = {'extend_existing': True}

# New ChatMessage Model
class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # User who sent the message (can be null if anonymous)
    message = Column(Text, nullable=False)
    response = Column(Text, nullable=True) # Chatbot's response
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_messages")

    __table_args__ = {'extend_existing': True}