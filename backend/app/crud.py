"""
CRUD Operations for Clinic Management System

This module contains all database CRUD operations for:
- Users (authentication and user management)
- Patients (patient records and management)
- Doctors (doctor profiles and assignments)
- Appointments (scheduling and management)
- Hospitals (hospital information)
- Chat Messages (chatbot interactions)
- Medical Reports (patient medical records)
"""

import secrets
from datetime import datetime, timedelta, time, date
from typing import List, Dict, Any, Optional

from sqlalchemy.orm import Session

from . import models, schemas
from .database import pwd_context, UserRole, Gender

# ============================================================================
# USER CRUD OPERATIONS
# ============================================================================

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    """Retrieve a user by user ID."""
    return db.query(models.User).filter(models.User.user_id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    """Retrieve a user by email address. Used for login and authentication."""
    return db.query(models.User).filter(models.User.email == email).first()


def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    """Retrieve a user by username."""
    return db.query(models.User).filter(models.User.username == username).first()


def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    """Retrieve all users with pagination."""
    return db.query(models.User).offset(skip).limit(limit).all()


def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    """
    Create a new user and associated role-specific record.
    
    This function handles the creation of both the user account and the
    corresponding role-specific record (Patient, Doctor, or Clinic Staff).
    """
    try:
        # Hash the password and create user record
        hashed_password = pwd_context.hash(user.password)
        db_user = models.User(
            username=user.username,
            email=user.email,
            hashed_password=hashed_password,
            role=user.role,
            full_name=user.full_name
        )
        db.add(db_user)
        db.flush()  # Get db_user.user_id without committing yet
        db.refresh(db_user)  # Refresh to ensure all attributes are populated

        # Create a patient profile if the user is a patient
        if user.role == UserRole.PATIENT:
            # The patient profile is linked via relationship, so we can create it directly
            db_patient = models.Patient(
                patient_id=db_user.user_id,
                full_name=db_user.full_name,
                date_of_birth=date(1900, 1, 1),
                gender=Gender.OTHER,
                class_role="NORMAL" # Add default for the stubborn legacy column
            )
            db.add(db_patient)

        db.commit()
        db.refresh(db_user)

        print(f"User created successfully: ID={db_user.user_id}, Name={db_user.full_name}, Role={db_user.role}")
        return db_user

    except Exception as e:
        db.rollback()
        print(f"Failed to create user and associated record: {str(e)}")
        raise


def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate) -> Optional[models.User]:
    """Update a user's details."""
    db_user = get_user(db, user_id)
    if db_user:
        update_data = user_update.dict(exclude_unset=True)
        if "password" in update_data and update_data["password"]:
            hashed_password = pwd_context.hash(update_data["password"])
            update_data["password"] = hashed_password
        
        for key, value in update_data.items():
            setattr(db_user, key, value)
        
        db.commit()
        db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: int) -> Optional[models.User]:
    """Delete a user."""
    db_user = get_user(db, user_id)
    if db_user:
        db.delete(db_user)
        db.commit()
    return db_user


# Password Reset Operations
def create_password_reset_token(db: Session, user: models.User) -> str:
    """Generate and store a password reset token for a user."""
    token = secrets.token_urlsafe(32)
    expires_delta = timedelta(hours=1)  # Token valid for 1 hour
    expires_at = datetime.utcnow() + expires_delta
    
    setattr(user, 'reset_password_token', token)
    setattr(user, 'reset_password_token_expires_at', expires_at)
    
    db.commit()
    db.refresh(user)
    return token


def get_user_by_reset_token(db: Session, token: str) -> Optional[models.User]:
    """Retrieve a user by their password reset token."""
    return db.query(models.User).filter(models.User.reset_password_token == token).first()


def reset_password(db: Session, user: models.User, new_password: str) -> bool:
    """Reset a user's password and invalidate the reset token."""
    setattr(user, 'hashed_password', pwd_context.hash(new_password))
    setattr(user, 'reset_password_token', None)  # Invalidate the token
    setattr(user, 'reset_password_token_expires_at', None)
    
    db.commit()
    return True


# ============================================================================
# PATIENT CRUD OPERATIONS
# ============================================================================

def get_patient(db: Session, patient_id: int) -> Optional[models.Patient]:
    """Retrieve a patient by patient ID."""
    return db.query(models.Patient).filter(models.Patient.patient_id == patient_id).first()


def get_patients(db: Session, skip: int = 0, limit: int = 100) -> List[models.Patient]:
    """Retrieve all patients with pagination."""
    return db.query(models.Patient).offset(skip).limit(limit).all()


def search_patients(db: Session, search_term: str) -> List[models.Patient]:
    """Search for patients by name, email, or phone number."""
    search_filter = f"%{search_term}%"
    return db.query(models.Patient).join(models.User).filter(
        models.User.full_name.ilike(search_filter) |
        models.User.email.ilike(search_filter) |
        models.Patient.phone_number.ilike(search_filter)
    ).all()

# ============================================================================
# ANALYSIS RESULT CRUD OPERATIONS
# ============================================================================

def create_analysis_result(db: Session, result: schemas.AnalysisResultCreate) -> models.AnalysisResult:
    """Create a new analysis result."""
    db_result = models.AnalysisResult(**result.dict())
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result

def get_analysis_results_by_patient(db: Session, patient_id: int) -> List[models.AnalysisResult]:
    """Retrieve all analysis results for a specific patient."""
    return db.query(models.AnalysisResult).filter(models.AnalysisResult.patient_id == patient_id).all()

# ============================================================================
# CHAT MESSAGE CRUD OPERATIONS
# ============================================================================

def create_chat_message(db: Session, message: schemas.ChatMessageCreate) -> models.ChatMessage:
    """Create a new chat message."""
    db_message = models.ChatMessage(**message.dict())
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def get_chat_history(db: Session, user_id: int) -> List[models.ChatMessage]:
    """Retrieve chat history for a user."""
    return db.query(models.ChatMessage).filter(models.ChatMessage.user_id == user_id).order_by(models.ChatMessage.timestamp).all()