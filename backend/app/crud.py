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
from .database import pwd_context, UserRole, Class, Gender

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

        # Extract values using getattr to resolve type checker issues
        user_id_value = getattr(db_user, 'user_id', 0)
        full_name_value = getattr(db_user, 'full_name', 'Unknown')

        # Create role-specific records based on user role
        if user.role == "PATIENT":
            patient_in = schemas.PatientCreate(
                patient_id=user_id_value,  # Use user_id as patient_id for linking
                full_name=full_name_value,  # Required field from PatientBase
            )
            create_patient(db=db, patient_in=patient_in, creator_id=user_id_value)

        elif user.role == "DOCTOR":
            doctor_in = schemas.DoctorCreate(
                doctor_id=user_id_value,
                doctor_name=full_name_value,
                center_id=1  # TODO: Make this configurable instead of hardcoded
            )
            create_doctor(db=db, doctor_in=doctor_in, creator_id=user_id_value)

        elif user.role == "CLINIC_STAFF":
            # No additional records needed for clinic staff currently
            pass

        db.commit()
        db.refresh(db_user)

        print(f"User created successfully: ID={db_user.user_id}, Name={db_user.full_name}, Role={db_user.role}")
        return db_user

    except Exception as e:
        db.rollback()
        print(f"Failed to create user and associated record: {str(e)}")
        raise


def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate) -> Optional[models.User]:
    """Update an existing user's information."""
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    update_data = user_update.model_dump(exclude_unset=True)
    
    # Handle password update with proper hashing
    if "password" in update_data and update_data["password"]:
        hashed_password = pwd_context.hash(update_data["password"])
        update_data["hashed_password"] = hashed_password
        del update_data["password"]  # Remove plain password from update data
    else:
        # Remove empty password field from update data
        if "password" in update_data:
            del update_data["password"]

    # Apply updates to user object
    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: int) -> Optional[models.User]:
    """
    Delete a user and handle cascade relationships.
    """
    db_user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not db_user:
        return None

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


def get_patients_by_doctor(db: Session, doctor_id: int, skip: int = 0, limit: int = 100) -> List[models.Patient]:
    """Retrieve all patients - this function is deprecated since we removed assigned doctor relationship."""
    # Since we removed the assigned doctor field, this function now returns all patients
    # In the future, this could be replaced with a different relationship mechanism
    return get_patients(db, skip=skip, limit=limit)


def get_patient_by_user_id(db: Session, user_id: int) -> Optional[models.Patient]:
    """Retrieve a patient by their associated user ID."""
    return db.query(models.Patient).filter(models.Patient.patient_id == user_id).first()


def create_patient(db: Session, patient_in: schemas.PatientCreate, creator_id: int) -> models.Patient:
    """
    Create a new patient record.
    
    Note: Some fields like full_name, date_of_birth, etc. are expected to be
    in the linked User model, while patient-specific fields are stored here.
    """
    patient_data = {
        "patient_id": patient_in.patient_id,
        "full_name": patient_in.full_name,
        "date_of_birth": patient_in.date_of_birth or date(2000, 1, 1),
        "gender": patient_in.gender or Gender.MALE,
        "class_role": Class.OTHER
    }
    
    db_patient = models.Patient(**patient_data)
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient


def update_patient(db: Session, patient_id: int, patient_update: schemas.PatientUpdate) -> Optional[models.Patient]:
    """Update an existing patient's information."""
    db_patient = get_patient(db, patient_id=patient_id)
    if not db_patient:
        return None
    
    update_data = patient_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_patient, key, value)
    
    db.commit()
    db.refresh(db_patient)
    return db_patient


def update_patient_emr(db: Session, patient_id: int, emr_summary: str) -> Optional[models.Patient]:
    """Update only the EMR summary for a patient."""
    db_patient = get_patient(db, patient_id=patient_id)
    if not db_patient:
        return None
    
    setattr(db_patient, 'emr_summary', emr_summary)
    db.commit()
    db.refresh(db_patient)
    return db_patient


def delete_patient(db: Session, patient_id: int) -> Optional[models.Patient]:
    """Delete a patient record."""
    db_patient = get_patient(db, patient_id)
    if not db_patient:
        return None
    
    db.delete(db_patient)
    db.commit()
    return db_patient


def search_patients(
    db: Session, 
    search_params: schemas.PatientSearchQuery, 
    current_user_role: str,
    current_user_id: int
) -> tuple[List[models.Patient], int]:
    """
    Advanced patient search with multiple filters and role-based access control.
    
    Returns:
        tuple: (list_of_patients, total_count)
    """
    from sqlalchemy import and_, or_, func, desc, asc
    from datetime import date
    
    # Base query with joins
    query = db.query(models.Patient).join(
        models.User, models.Patient.patient_id == models.User.user_id
    )
    
    # Role-based access control
    if current_user_role == UserRole.DOCTOR.value:
        # Doctors can see all patients since we removed the assigned doctor relationship
        # In the future, this could be replaced with a different access control mechanism
        pass
    elif current_user_role == UserRole.PATIENT.value:
        # Patients can only see their own record
        query = query.filter(models.Patient.patient_id == current_user_id)
    # ADMIN and CLINIC_STAFF can see all patients (no additional filter)
    
    # Build search conditions
    conditions = []
    
    # General search query (searches across multiple fields)
    if search_params.query:
        search_term = f"%{search_params.query}%"
        general_search = or_(
            models.Patient.full_name.ilike(search_term),
            models.User.email.ilike(search_term),
            models.Patient.phone_number.ilike(search_term),
            models.Patient.identification_id.ilike(search_term),
            models.Patient.health_insurance_card_no.ilike(search_term)
        )
        conditions.append(general_search)
    
    # Specific field searches
    if search_params.patient_id:
        conditions.append(models.Patient.patient_id == search_params.patient_id)
    
    if search_params.full_name:
        conditions.append(models.Patient.full_name.ilike(f"%{search_params.full_name}%"))
    
    if search_params.phone_number:
        conditions.append(models.Patient.phone_number.ilike(f"%{search_params.phone_number}%"))
    
    if search_params.email:
        conditions.append(models.User.email.ilike(f"%{search_params.email}%"))
    
    if search_params.identification_id:
        conditions.append(models.Patient.identification_id.ilike(f"%{search_params.identification_id}%"))
    
    if search_params.health_insurance_card_no:
        conditions.append(models.Patient.health_insurance_card_no.ilike(f"%{search_params.health_insurance_card_no}%"))
    
    if search_params.gender:
        conditions.append(models.Patient.gender == search_params.gender)
    
    # Age filters (calculate age from date_of_birth)
    if search_params.age_min or search_params.age_max:
        today = date.today()
        
        if search_params.age_min:
            max_birth_date = date(today.year - search_params.age_min, today.month, today.day)
            conditions.append(models.Patient.date_of_birth <= max_birth_date)
        
        if search_params.age_max:
            min_birth_date = date(today.year - search_params.age_max - 1, today.month, today.day)
            conditions.append(models.Patient.date_of_birth > min_birth_date)
    
    # Apply all conditions
    if conditions:
        query = query.filter(and_(*conditions))
    
    # Get total count before pagination
    total_count = query.count()
    
    # Sorting
    sort_by = search_params.sort_by or "full_name"
    if hasattr(models.Patient, sort_by):
        sort_field = getattr(models.Patient, sort_by)
    else:
        sort_field = models.Patient.full_name
        
    if search_params.sort_order == "desc":
        query = query.order_by(desc(sort_field))
    else:
        query = query.order_by(asc(sort_field))
    
    # Pagination
    patients = query.offset(search_params.skip).limit(search_params.limit).all()
    
    return patients, total_count


def get_patient_search_result(db: Session, patient: models.Patient) -> schemas.PatientSearchResult:
    """
    Convert a Patient model to PatientSearchResult schema with additional computed fields.
    """
    from datetime import date
    
    # Calculate age
    age = None
    if hasattr(patient, 'date_of_birth') and patient.date_of_birth is not None:
        today = date.today()
        birth_date = patient.date_of_birth
        age = today.year - birth_date.year
        if today.month < birth_date.month or (
            today.month == birth_date.month and today.day < birth_date.day
        ):
            age -= 1
    
    # Get user email
    patient_id = getattr(patient, 'patient_id')
    user = get_user(db, patient_id)
    email = getattr(user, 'email', None) if user else None
    
    # Get gender value
    gender_value = None
    if hasattr(patient, 'gender') and patient.gender is not None:
        gender_value = patient.gender.value if hasattr(patient.gender, 'value') else str(patient.gender)
    
    return schemas.PatientSearchResult(
        patient_id=getattr(patient, 'patient_id'),
        full_name=getattr(patient, 'full_name'),
        date_of_birth=getattr(patient, 'date_of_birth', None),
        gender=gender_value,
        phone_number=getattr(patient, 'phone_number', None),
        email=email,
        identification_id=getattr(patient, 'identification_id', None),
        health_insurance_card_no=getattr(patient, 'health_insurance_card_no', None),
        age=age
    )

# ============================================================================
# APPOINTMENT CRUD OPERATIONS
# ============================================================================

def create_appointment(db: Session, appointment: schemas.AppointmentCreate, creator_id: int) -> models.Appointment:
    """Create a new appointment."""
    appointment_data = appointment.model_dump()
    appointment_data["patient_id"] = creator_id
    
    db_appointment = models.Appointment(**appointment_data)
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    
    print(f"Appointment created: {db_appointment}")
    return db_appointment


def get_appointment(db: Session, appointment_id: int) -> Optional[models.Appointment]:
    """Retrieve an appointment by ID."""
    return db.query(models.Appointment).filter(
        models.Appointment.appointment_id == appointment_id
    ).first()


def get_all_appointments(db: Session, skip: int = 0, limit: int = 100) -> List[models.Appointment]:
    """Retrieve all appointments with pagination."""
    return db.query(models.Appointment).offset(skip).limit(limit).all()


def get_appointments_for_patient(db: Session, patient_id: int, skip: int = 0, limit: int = 100) -> List[models.Appointment]:
    """Retrieve all appointments for a specific patient."""
    return db.query(models.Appointment).filter(
        models.Appointment.patient_id == patient_id
    ).offset(skip).limit(limit).all()


def get_appointments_for_doctor(db: Session, doctor_id: int, skip: int = 0, limit: int = 100) -> List[models.Appointment]:
    """Retrieve all appointments for a specific doctor."""
    return db.query(models.Appointment).filter(
        models.Appointment.doctor_id == doctor_id
    ).offset(skip).limit(limit).all()


def get_available_slots_in_a_day(db: Session, day: date) -> List[schemas.AvailableSlot]:
    """
    Get all available appointment slots for a given day.
    
    This function considers:
    - Working hours: 8:30 AM to 5:30 PM
    - Lunch break: 11:30 AM to 1:30 PM
    - Existing appointments
    - Available doctors
    """
    # Define working hours and lunch break
    start_of_day = datetime.combine(day, time(8, 30))
    end_of_day = datetime.combine(day, time(17, 30))
    lunch_start = time(11, 30)
    lunch_end = time(13, 30)
    slot_duration = timedelta(hours=1)

    # Get all doctors and existing appointments for the day
    doctors = db.query(models.Doctor).all()
    appointments = db.query(models.Appointment).filter(
        models.Appointment.appointment_day == day
    ).all()
    
    # Create set of taken appointment slots
    taken_slots = set((appt.doctor_id, appt.appointment_time) for appt in appointments)

    # Generate available slots
    available_slots: List[schemas.AvailableSlot] = []
    current_time = start_of_day

    while current_time + slot_duration <= end_of_day:
        # Skip lunch break
        if lunch_start <= current_time.time() < lunch_end:
            current_time += slot_duration
            continue

        # Find doctors available at this time
        free_doctors = [
            schemas.AvailableDoctor(
                doctor_id=getattr(doctor, 'doctor_id'),
                doctor_name=getattr(doctor, 'doctor_name')
            )
            for doctor in doctors
            if (getattr(doctor, 'doctor_id'), current_time.time()) not in taken_slots
        ]

        # Add slot if there are available doctors
        if free_doctors:
            available_slots.append(
                schemas.AvailableSlot(
                    datetime=current_time,
                    available_doctors=free_doctors
                )
            )

        current_time += slot_duration

    return available_slots


def update_appointment(db: Session, appointment_id: int, appointment_update: schemas.AppointmentUpdate) -> Optional[models.Appointment]:
    """Update an existing appointment."""
    db_appointment = get_appointment(db, appointment_id)
    if not db_appointment:
        return None
    
    update_data = appointment_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_appointment, key, value)
    
    db.commit()
    db.refresh(db_appointment)
    return db_appointment


def delete_appointment(db: Session, appointment_id: int) -> Optional[models.Appointment]:
    """Delete an appointment."""
    db_appointment = get_appointment(db, appointment_id)
    if not db_appointment:
        return None
    
    db.delete(db_appointment)
    db.commit()
    return db_appointment

# ============================================================================
# DOCTOR CRUD OPERATIONS
# ============================================================================

def get_doctor(db: Session, doctor_id: int) -> Optional[models.Doctor]:
    """Retrieve a doctor by doctor ID."""
    return db.query(models.Doctor).filter(models.Doctor.doctor_id == doctor_id).first()


def get_doctors(db: Session, skip: int = 0, limit: int = 100) -> List[models.Doctor]:
    """Retrieve all doctors with pagination."""
    return db.query(models.Doctor).offset(skip).limit(limit).all()


def create_doctor(db: Session, doctor_in: schemas.DoctorCreate, creator_id: int) -> models.Doctor:
    """Create a new health worker/doctor record."""
    db_doctor = models.Doctor(
        doctor_id=doctor_in.doctor_id,
        doctor_name=doctor_in.doctor_name,
        specialization=doctor_in.specialization or "General Medicine",
        center_id=doctor_in.center_id,
        is_community_health_worker=doctor_in.is_community_health_worker or False,
    )
    db.add(db_doctor)
    db.commit()
    db.refresh(db_doctor)
    return db_doctor


def update_doctor(db: Session, doctor_id: int, doctor_update: schemas.DoctorUpdate) -> Optional[models.Doctor]:
    """Update an existing doctor's information."""
    db_doctor = get_doctor(db, doctor_id=doctor_id)
    if not db_doctor:
        return None

    update_data = doctor_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_doctor, key, value)

    db.commit()
    db.refresh(db_doctor)
    return db_doctor


def delete_doctor(db: Session, doctor_id: int) -> Optional[models.Doctor]:
    """Delete a doctor record."""
    db_doctor = get_doctor(db, doctor_id=doctor_id)
    if not db_doctor:
        return None
    
    db.delete(db_doctor)
    db.commit()
    return db_doctor


# ============================================================================
# HOSPITAL CRUD OPERATIONS
# ============================================================================

# ============================================================================
# COMMUNITY HEALTH CENTER CRUD OPERATIONS
# ============================================================================

def get_community_health_center(db: Session, center_id: int) -> Optional[models.CommunityHealthCenter]:
    """Retrieve a community health center by center ID."""
    return db.query(models.CommunityHealthCenter).filter(models.CommunityHealthCenter.center_id == center_id).first()


def get_community_health_centers(db: Session, skip: int = 0, limit: int = 100) -> List[models.CommunityHealthCenter]:
    """Retrieve all community health centers with pagination."""
    return db.query(models.CommunityHealthCenter).offset(skip).limit(limit).all()


def create_community_health_center(db: Session, center_in: schemas.CommunityHealthCenterCreate) -> models.CommunityHealthCenter:
    """Create a new community health center record."""
    db_center = models.CommunityHealthCenter(**center_in.model_dump())
    db.add(db_center)
    db.commit()
    db.refresh(db_center)
    return db_center


def update_community_health_center(db: Session, center_id: int, center_update: schemas.CommunityHealthCenterUpdate) -> Optional[models.CommunityHealthCenter]:
    """Update an existing community health center's information."""
    db_center = get_community_health_center(db, center_id=center_id)
    if not db_center:
        return None

    update_data = center_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_center, key, value)

    db.commit()
    db.refresh(db_center)
    return db_center


def delete_community_health_center(db: Session, center_id: int) -> Optional[models.CommunityHealthCenter]:
    """Delete a community health center record."""
    db_center = get_community_health_center(db, center_id=center_id)
    if not db_center:
        return None
    
    db.delete(db_center)
    db.commit()
    return db_center


# Legacy hospital functions - kept for backward compatibility during migration
def get_hospital(db: Session, hospital_id: int) -> Optional[models.CommunityHealthCenter]:
    """Legacy function - redirects to community health center."""
    return get_community_health_center(db, center_id=hospital_id)

def get_hospitals(db: Session, skip: int = 0, limit: int = 100) -> List[models.CommunityHealthCenter]:
    """Legacy function - redirects to community health centers."""
    return get_community_health_centers(db, skip=skip, limit=limit)

def create_hospital(db: Session, hospital_in: schemas.CommunityHealthCenterCreate) -> models.CommunityHealthCenter:
    """Legacy function - redirects to community health center creation."""
    return create_community_health_center(db, center_in=hospital_in)

def update_hospital(db: Session, hospital_id: int, hospital_update: schemas.CommunityHealthCenterUpdate) -> Optional[models.CommunityHealthCenter]:
    """Legacy function - redirects to community health center update."""
    return update_community_health_center(db, center_id=hospital_id, center_update=hospital_update)

def delete_hospital(db: Session, hospital_id: int) -> Optional[models.CommunityHealthCenter]:
    """Legacy function - redirects to community health center deletion."""
    return delete_community_health_center(db, center_id=hospital_id)


# ============================================================================
# CHAT MESSAGE CRUD OPERATIONS
# ============================================================================

def create_chat_message(db: Session, message: schemas.ChatMessageCreate, user_id: Optional[int] = None) -> models.ChatMessage:
    """
    Create a new chat message.
    
    This function saves user messages to the database. Chatbot responses
    can be handled synchronously or asynchronously depending on implementation.
    """
    db_message = models.ChatMessage(**message.model_dump(), user_id=user_id)
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message


def get_chat_message(db: Session, message_id: int) -> Optional[models.ChatMessage]:
    """Retrieve a chat message by message ID."""
    return db.query(models.ChatMessage).filter(models.ChatMessage.chat_id == message_id).first()


def get_chat_messages_for_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[models.ChatMessage]:
    """
    Retrieve chat messages for a specific user.
    
    This fetches messages initiated by or involving the user, ordered by
    most recent first. The exact filter depends on conversation structure.
    """
    return db.query(models.ChatMessage).filter(
        models.ChatMessage.user_id == user_id
    ).order_by(
        models.ChatMessage.time_stamp.desc()
    ).offset(skip).limit(limit).all()

# ============================================================================
# MEDICAL REPORT CRUD OPERATIONS
# ============================================================================

def create_medical_report(db: Session, report: schemas.MedicalReportCreate) -> models.MedicalReport:
    """Create a new medical report."""
    db_report = models.MedicalReport(**report.model_dump())
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report


def get_medical_report(db: Session, record_id: int) -> Optional[models.MedicalReport]:
    """Retrieve a medical report by record ID."""
    return db.query(models.MedicalReport).filter(models.MedicalReport.record_id == record_id).first()

def get_medical_reports_by_doctor(db: Session, doctor_id: int, skip: int = 0, limit: int = 100):
    return (db.query(models.MedicalReport).filter(models.MedicalReport.doctor_id == doctor_id)
            .order_by(models.MedicalReport.in_day.desc())
            .offset(skip)
            .limit(limit)
            .all()
    )

def get_medical_reports_for_patient(db: Session, patient_id: int, skip: int = 0, limit: int = 100) -> List[models.MedicalReport]:
    """Retrieve all medical reports for a specific patient, ordered by date."""
    return (
        db.query(models.MedicalReport)
        .filter(models.MedicalReport.patient_id == patient_id)
        .order_by(models.MedicalReport.in_day.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_medical_report(db: Session, record_id: int, report_update: schemas.MedicalReportUpdate) -> Optional[models.MedicalReport]:
    """Update an existing medical report."""
    db_report = get_medical_report(db, record_id)
    if not db_report:
        return None
    
    update_data = report_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_report, field, value)
    
    db.commit()
    db.refresh(db_report)
    return db_report


def delete_medical_report(db: Session, record_id: int) -> Optional[models.MedicalReport]:
    """Delete a medical report."""
    db_report = get_medical_report(db, record_id)
    if not db_report:
        return None
    
    db.delete(db_report)
    db.commit()
    return db_report

def search_medical_reports(db: Session, patient_id: Optional[int], doctor_id: Optional[int], in_day: Optional[date], out_day: Optional[date]):
    query = db.query(models.MedicalReport)
    if patient_id:
        query = query.filter(models.MedicalReport.patient_id == patient_id)
    if doctor_id:
        query = query.filter(models.MedicalReport.doctor_id == doctor_id)
    if in_day:
        query = query.filter(models.MedicalReport.in_day == in_day)
    if out_day:
        query = query.filter(models.MedicalReport.out_day == out_day)
    return query.all()

# Placeholder for a function to get all messages in a conversation (if applicable)

# ============================================================================
# FUTURE ENHANCEMENTS (Placeholder Functions)
# ============================================================================

# TODO: Implement conversation management for chat messages
# def get_conversation_messages(db: Session, conversation_id: int, skip: int = 0, limit: int = 100):
#     """Retrieve all messages in a conversation."""
#     pass

# TODO: Implement chatbot response handling
# def add_chatbot_response_to_message(db: Session, message_id: int, response_text: str):
#     """Add a chatbot response to an existing message."""
#     db_message = get_chat_message(db, message_id)
#     if db_message:
#         db_message.response = response_text
#         db.commit()
#         db.refresh(db_message)
#     return db_message


# ============================================================================
# AI SKIN LESION ANALYSIS CRUD OPERATIONS
# ============================================================================

def create_skin_lesion_image(db: Session, lesion_data: schemas.SkinLesionImageCreate) -> models.SkinLesionImage:
    """Create a new skin lesion image record."""
    db_lesion = models.SkinLesionImage(
        patient_id=lesion_data.patient_id,
        image_path=lesion_data.image_path,
        image_data=lesion_data.image_data,
        body_region=lesion_data.body_region,
        ai_prediction=lesion_data.ai_prediction,
        confidence_score=lesion_data.confidence_score,
        status=lesion_data.status,
        notes=lesion_data.notes
    )
    db.add(db_lesion)
    db.commit()
    db.refresh(db_lesion)
    return db_lesion


def get_skin_lesion_image(db: Session, image_id: int) -> Optional[models.SkinLesionImage]:
    """Retrieve a skin lesion image by ID."""
    return db.query(models.SkinLesionImage).filter(models.SkinLesionImage.image_id == image_id).first()


def get_patient_skin_lesions(db: Session, patient_id: int, skip: int = 0, limit: int = 100) -> List[models.SkinLesionImage]:
    """Retrieve all skin lesion images for a patient."""
    return db.query(models.SkinLesionImage).filter(
        models.SkinLesionImage.patient_id == patient_id
    ).offset(skip).limit(limit).all()


def get_pending_reviews(db: Session, risk_levels: Optional[List[str]] = None, skip: int = 0, limit: int = 100) -> List[models.SkinLesionImage]:
    """Get skin lesions pending review by cadres."""
    query = db.query(models.SkinLesionImage).filter(
        models.SkinLesionImage.needs_professional_review == True,
        models.SkinLesionImage.reviewed_by_cadre.is_(None)
    )
    
    if risk_levels:
        # Join with AI assessment to filter by risk level
        query = query.join(models.AIAssessment).filter(
            models.AIAssessment.risk_level.in_(risk_levels)
        )
    
    return query.offset(skip).limit(limit).all()


def update_skin_lesion_status(db: Session, image_id: int, status: str, reviewed_by: Optional[int] = None) -> Optional[models.SkinLesionImage]:
    """Update the status of a skin lesion image."""
    db_lesion = get_skin_lesion_image(db, image_id)
    if db_lesion:
        db_lesion.status = status
        if reviewed_by and status in ["reviewed", "completed"]:
            db_lesion.reviewed_by_cadre = reviewed_by
        db.commit()
        db.refresh(db_lesion)
    return db_lesion


def create_ai_assessment(db: Session, assessment_data: schemas.AIAssessmentCreate) -> models.AIAssessment:
    """Create a new AI assessment record."""
    db_assessment = models.AIAssessment(
        image_id=assessment_data.image_id,
        risk_level=assessment_data.risk_level,
        confidence_level=assessment_data.confidence_level,
        predicted_class=assessment_data.predicted_class,
        all_predictions=assessment_data.all_predictions,
        recommendations=assessment_data.recommendations,
        follow_up_needed=assessment_data.follow_up_needed,
        follow_up_days=assessment_data.follow_up_days
    )
    db.add(db_assessment)
    db.commit()
    db.refresh(db_assessment)
    return db_assessment


def get_ai_assessment_by_image(db: Session, image_id: int) -> Optional[models.AIAssessment]:
    """Get AI assessment for a specific image."""
    return db.query(models.AIAssessment).filter(models.AIAssessment.image_id == image_id).first()


def create_cadre_review(db: Session, review_data: schemas.CadreReviewCreate, cadre_id: int) -> models.CadreReview:
    """Create a new cadre review."""
    db_review = models.CadreReview(
        image_id=review_data.image_id,
        cadre_id=cadre_id,
        review_notes=review_data.review_notes,
        agrees_with_ai=review_data.agrees_with_ai,
        escalate_to_doctor=review_data.escalate_to_doctor,
        local_recommendations=review_data.local_recommendations
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    
    # Update the lesion image to mark as reviewed by cadre
    update_skin_lesion_status(db, review_data.image_id, "reviewed", cadre_id)
    
    return db_review


def get_cadre_reviews_by_image(db: Session, image_id: int) -> List[models.CadreReview]:
    """Get all cadre reviews for a specific image."""
    return db.query(models.CadreReview).filter(models.CadreReview.image_id == image_id).all()


def create_doctor_consultation(db: Session, consultation_data: schemas.DoctorConsultationCreate, doctor_id: int) -> models.DoctorConsultation:
    """Create a new doctor consultation."""
    db_consultation = models.DoctorConsultation(
        image_id=consultation_data.image_id,
        doctor_id=doctor_id,
        diagnosis=consultation_data.diagnosis,
        treatment_plan=consultation_data.treatment_plan,
        urgency_level=consultation_data.urgency_level,
        requires_specialist=consultation_data.requires_specialist,
        specialist_type=consultation_data.specialist_type,
        follow_up_days=consultation_data.follow_up_days,
        prescription=consultation_data.prescription
    )
    db.add(db_consultation)
    db.commit()
    db.refresh(db_consultation)
    
    # Update the lesion image to mark as completed
    lesion = get_skin_lesion_image(db, consultation_data.image_id)
    if lesion:
        lesion.reviewed_by_doctor = doctor_id
        lesion.status = "completed"
        db.commit()
    
    return db_consultation


def get_doctor_consultations_by_image(db: Session, image_id: int) -> List[models.DoctorConsultation]:
    """Get all doctor consultations for a specific image."""
    return db.query(models.DoctorConsultation).filter(models.DoctorConsultation.image_id == image_id).all()


def get_body_regions(db: Session) -> List[models.BodyRegion]:
    """Get all available body regions."""
    return db.query(models.BodyRegion).all()


def get_patient_lesion_history(db: Session, patient_id: int) -> Dict[str, Any]:
    """Get comprehensive lesion history for a patient."""
    all_lesions = get_patient_skin_lesions(db, patient_id)
    
    # Count by status and risk level
    total_analyses = len(all_lesions)
    pending_reviews = len([l for l in all_lesions if l.status == "pending"])
    
    # Count high-risk lesions by joining with AI assessments
    high_risk_count = db.query(models.SkinLesionImage).join(models.AIAssessment).filter(
        models.SkinLesionImage.patient_id == patient_id,
        models.AIAssessment.risk_level.in_(["HIGH", "URGENT"])
    ).count()
    
    # Get recent analyses (last 10)
    recent_analyses = db.query(models.SkinLesionImage).filter(
        models.SkinLesionImage.patient_id == patient_id
    ).order_by(models.SkinLesionImage.upload_timestamp.desc()).limit(10).all()
    
    return {
        "patient_id": patient_id,
        "total_analyses": total_analyses,
        "pending_reviews": pending_reviews,
        "high_risk_count": high_risk_count,
        "recent_analyses": recent_analyses
    }


def get_review_queue_stats(db: Session) -> Dict[str, int]:
    """Get statistics for the review queue."""
    # Count pending reviews by risk level
    pending_query = db.query(models.SkinLesionImage).filter(
        models.SkinLesionImage.needs_professional_review == True,
        models.SkinLesionImage.reviewed_by_cadre.is_(None)
    )
    
    total_pending = pending_query.count()
    
    # Count by risk level
    urgent_count = pending_query.join(models.AIAssessment).filter(
        models.AIAssessment.risk_level == "URGENT"
    ).count()
    
    high_priority_count = pending_query.join(models.AIAssessment).filter(
        models.AIAssessment.risk_level == "HIGH"
    ).count()
    
    medium_priority_count = pending_query.join(models.AIAssessment).filter(
        models.AIAssessment.risk_level == "MEDIUM"
    ).count()
    
    low_priority_count = pending_query.join(models.AIAssessment).filter(
        models.AIAssessment.risk_level == "LOW"
    ).count()
    
    return {
        "total_pending": total_pending,
        "urgent_count": urgent_count,
        "high_priority_count": high_priority_count,
        "medium_priority_count": medium_priority_count,
        "low_priority_count": low_priority_count
    }