from sqlalchemy import (
    Column, Integer, String, Date, Time, Text, ForeignKey, Enum, TIMESTAMP
)
from sqlalchemy.orm import relationship, declarative_base
from .database import Gender, Class, UserRole, Base
from sqlalchemy import create_engine
from .config import settings


# Users table
class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(255), nullable=False)
    email = Column(String(255))
    hashed_password = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.PATIENT, nullable=False)
    full_name = Column(String(255), nullable=False)

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
    assigned_doctor_id = Column(Integer)
    class_role = Column(Enum(Class), nullable=False)

    # Quan hệ
    user = relationship("User", back_populates="patient_profile", foreign_keys=[patient_id])

    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")
    medical_reports = relationship("MedicalReport", back_populates="patient", cascade="all, delete-orphan")


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
    docter_notes = Column(Text)  # Thêm trường doctor_notes

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
