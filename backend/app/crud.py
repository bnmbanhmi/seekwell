from sqlalchemy.orm import Session
from typing import Optional # Added Optional
from . import models, schemas # Updated to schemas
from .database import pwd_context, UserRole, Class, Gender
from datetime import datetime, timedelta, time, date
from typing import List, Dict, Any

# User CRUD operations
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.user_id == user_id).first()

def get_user_by_email(db: Session, email: str): # Added for login and other purposes
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_users(db: Session, skip: int = 0, limit: int = 100): # Added
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    try:
        # Start transaction
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

        # Create associated role-specific record
        if user.role == "PATIENT":
            patient_in = schemas.PatientCreate(
                patient_id=db_user.user_id,
                full_name=db_user.full_name,
                assigned_doctor_id=10 # Hardcoded for now, doctors table MUST have doctors_id=10
            )
            create_patient(db=db, patient_in=patient_in, creator_id=db_user.user_id)

        elif user.role == "DOCTOR":
            doctor_in = schemas.DoctorCreate(
                doctor_id=db_user.user_id,
                doctor_name=db_user.full_name,
                hospital_id=1  # Hardcoded for now, hospitals table MUST have hospitals_id=1
            )
            create_doctor(db=db, doctor_in=doctor_in, creator_id=db_user.user_id)

        elif user.role == "CLINIC_STAFF":
            # No additional records needed for now
            pass

        db.commit()
        db.refresh(db_user)

        print(f"User and role-specific record created successfully for user_id: {db_user.user_id} - {db_user.full_name} - {db_user.role}")
        return db_user

    except Exception as e:
        db.rollback()
        print(f"Failed to create user and associated record: {str(e)}")
        raise

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate):
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    update_data = user_update.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        hashed_password = pwd_context.hash(update_data["password"])
        update_data["hashed_password"] = hashed_password
        del update_data["password"] # Ensure plain password is not stored
    else: # remove password from update_data if it is None or empty
        if "password" in update_data:
            del update_data["password"]


    for key, value in update_data.items():
        setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not db_user:
        return None

    # If the user is a doctor, nullify their assignment in Patient records
    # Compare the string value of the role stored in the DB
    if str(db_user.role) == UserRole.DOCTOR.value:
        db.query(models.Patient).filter(models.Patient.assigned_doctor_id == user_id).update({models.Patient.assigned_doctor_id: None}, synchronize_session=False)

    # # Nullify creator_id in Patient records where this user is the creator
    # db.query(models.Patient).filter(models.Patient.creator_id == user_id).update({models.Patient.creator_id: None}, synchronize_session=False)

    db.delete(db_user)
    db.commit()
    return db_user

# Patient CRUD operations
def get_patient(db: Session, patient_id: int):
    return db.query(models.Patient).filter(models.Patient.patient_id == patient_id).first()

def get_patients(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Patient).offset(skip).limit(limit).all()

def get_patients_by_doctor(db: Session, doctor_id: int, skip: int = 0, limit: int = 100): # Renamed and updated
    return db.query(models.Patient).filter(models.Patient.assigned_doctor_id == doctor_id).offset(skip).limit(limit).all()

def get_patient_by_user_id(db: Session, user_id: int) -> Optional[models.Patient]:
    """Retrieve a patient by their associated user_id."""
    return db.query(models.Patient).filter(models.Patient.patient_id == user_id).first()

def create_patient(db: Session, patient_in: schemas.PatientCreate, creator_id: int) -> models.Patient:
    # Selectively create the patient data for the model
    # Fields from PatientCreate that are in Patient model: user_id, gender, emr_summary, assigned_doctor_id
    # Fields like full_name, date_of_birth, address, phone_number are in PatientBase but not Patient model.
    # These details are expected to be on the linked User model.
    # Patient model also has 'age' and 'medical_history' which are not in PatientCreate.
    # These would need to be added to PatientCreate or updated separately if they are to be set at creation.

    patient_data_for_model = {
        "patient_id": patient_in.patient_id,
        "full_name": patient_in.full_name,
        "date_of_birth": patient_in.date_of_birth or date(2000, 1, 1),
        "gender": patient_in.gender or Gender.MALE,
        "class_role": Class.OTHER,
        "assigned_doctor_id": patient_in.assigned_doctor_id
    }
    
    # Optional fields: if not provided in patient_in, they might be None.
    # SQLAlchemy handles None for nullable fields. If a field is not nullable and has no default,
    # it must be provided.

    db_patient = models.Patient(**patient_data_for_model)
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

def update_patient(db: Session, patient_id: int, patient_update: schemas.PatientUpdate) -> Optional[models.Patient]:
    db_patient = get_patient(db, patient_id=patient_id)
    if db_patient:
        update_data = patient_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_patient, key, value)
        db.commit()
        db.refresh(db_patient)
    return db_patient

# Simplified to only update EMR summary
def update_patient_emr(db: Session, patient_id: int, emr_summary: str) -> Optional[models.Patient]:
    """Updates only the EMR summary for a given patient."""
    db_patient = get_patient(db, patient_id=patient_id)
    if db_patient:
        # Use setattr to avoid direct type issues if emr_summary is a Column object to the type checker
        setattr(db_patient, 'emr_summary', emr_summary)
        db.commit()
        db.refresh(db_patient)
    return db_patient

def delete_patient(db: Session, patient_id: int):
    db_patient = get_patient(db, patient_id)
    if not db_patient:
        return None
    db.delete(db_patient)
    db.commit()
    return db_patient

# Appointment CRUD Operations (New)
def create_appointment(db: Session, appointment: schemas.AppointmentCreate, creator_id: int):
    # Assuming creator_id is the ID of the user creating the appointment (Patient or Clinic Staff)
    appointment_data = appointment.model_dump()
    appointment_data["patient_id"] = creator_id
    db_appointment = models.Appointment(**appointment_data)
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    print(f"Appointment created: {db_appointment}")
    return db_appointment

def get_appointment(db: Session, appointment_id: int):
    return db.query(models.Appointment).filter(models.Appointment.appointment_id == appointment_id).first()

def get_all_appointments(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Appointment).offset(skip).limit(limit).all()


def get_available_slots_in_a_day(db: Session, day: date) -> List[schemas.AvailableSlot]:
    start_of_day = datetime.combine(day, time(8, 30))
    end_of_day = datetime.combine(day, time(17, 30))
    lunch_start = time(11, 30)
    lunch_end = time(13, 30)
    slot_duration = timedelta(hours=1)

    # Fetch all doctors
    doctors = db.query(models.Doctor).all()

    # Build appointment map: {(doctor_id, appointment_time): True}
    appointments = db.query(models.Appointment).filter(models.Appointment.appointment_day == day).all()
    taken = set((appt.doctor_id, appt.appointment_time) for appt in appointments)

    # Prepare result
    available_slots: List[schemas.AvailableSlot] = []
    current_time = start_of_day

    while current_time + slot_duration <= end_of_day:
        if lunch_start <= current_time.time() < lunch_end:
            current_time += slot_duration
            continue

        # Find doctors who are free at this time
        free_doctors = [
            schemas.AvailableDoctor(
                doctor_id=doctor.doctor_id,
                doctor_name=doctor.doctor_name
            )
            for doctor in doctors
            if (doctor.doctor_id, current_time.time()) not in taken
        ]

        if free_doctors:
            available_slots.append(
                schemas.AvailableSlot(
                    datetime=current_time,
                    available_doctors=free_doctors
                )
            )

        current_time += slot_duration

    return available_slots


def get_appointments_for_patient(db: Session, patient_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Appointment).filter(models.Appointment.patient_id == patient_id).offset(skip).limit(limit).all()

def get_appointments_for_doctor(db: Session, doctor_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Appointment).filter(models.Appointment.doctor_id == doctor_id).offset(skip).limit(limit).all()

def update_appointment(db: Session, appointment_id: int, appointment_update: schemas.AppointmentUpdate):
    db_appointment = get_appointment(db, appointment_id)
    if not db_appointment:
        return None
    update_data = appointment_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_appointment, key, value)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

def delete_appointment(db: Session, appointment_id: int):
    db_appointment = get_appointment(db, appointment_id)
    if not db_appointment:
        return None
    db.delete(db_appointment)
    db.commit()
    return db_appointment

# Doctor CRUD Operations

def get_doctor(db: Session, doctor_id: int) -> Optional[models.Doctor]:
    return db.query(models.Doctor).filter(models.Doctor.doctor_id == doctor_id).first()

def get_doctors(db: Session, skip: int = 0, limit: int = 100) -> List[models.Doctor]:
    return db.query(models.Doctor).offset(skip).limit(limit).all()

def create_doctor(db: Session, doctor_in: schemas.DoctorCreate, creator_id: int) -> models.Doctor:
    db_doctor = models.Doctor(
        doctor_id=doctor_in.doctor_id,
        doctor_name=doctor_in.doctor_name,
        major=doctor_in.major or "General Medicine",
        hospital_id=doctor_in.hospital_id,
    )
    db.add(db_doctor)
    db.commit()
    db.refresh(db_doctor)
    return db_doctor

def update_doctor(db: Session, doctor_id: int, doctor_update: schemas.DoctorUpdate) -> Optional[models.Doctor]:
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
    db_doctor = get_doctor(db, doctor_id=doctor_id)
    if not db_doctor:
        return None
    db.delete(db_doctor)
    db.commit()
    return db_doctor


# Hospital CRUD Operations

def get_hospital(db: Session, hospital_id: int) -> Optional[models.Hospital]:
    return db.query(models.Hospital).filter(models.Hospital.hospital_id == hospital_id).first()

def get_hospitals(db: Session, skip: int = 0, limit: int = 100) -> List[models.Hospital]:
    return db.query(models.Hospital).offset(skip).limit(limit).all()

def create_hospital(db: Session, hospital_in: schemas.HospitalCreate) -> models.Hospital:
    db_hospital = models.Hospital(**hospital_in.model_dump())
    db.add(db_hospital)
    db.commit()
    db.refresh(db_hospital)
    return db_hospital

def update_hospital(db: Session, hospital_id: int, hospital_update: schemas.HospitalUpdate) -> Optional[models.Hospital]:
    db_hospital = get_hospital(db, hospital_id=hospital_id)
    if not db_hospital:
        return None

    update_data = hospital_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_hospital, key, value)

    db.commit()
    db.refresh(db_hospital)
    return db_hospital

def delete_hospital(db: Session, hospital_id: int) -> Optional[models.Hospital]:
    db_hospital = get_hospital(db, hospital_id=hospital_id)
    if not db_hospital:
        return None
    db.delete(db_hospital)
    db.commit()
    return db_hospital


# Chat Message CRUD Operations (New - Basic)
def create_chat_message(db: Session, message: schemas.ChatMessageCreate, user_id: Optional[int] = None): # user_id from current_user
    db_message = models.ChatMessage(**message.model_dump(), user_id=user_id) # Assuming ChatMessage model has user_id
    # Add logic for chatbot response if synchronous, or handle asynchronously
    # For now, just saving the user's message
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def get_chat_message(db: Session, message_id: int):
    return db.query(models.ChatMessage).filter(models.ChatMessage.chat_id == message_id).first()

def get_chat_messages_for_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    # This would fetch messages initiated by or involving the user.
    # The exact filter might depend on how conversations are structured.
    return db.query(models.ChatMessage).filter(models.ChatMessage.user_id == user_id).order_by(models.ChatMessage.time_stamp.desc()).offset(skip).limit(limit).all()

# Medical report CRUD Operations (New - Basic)
# Tạo mới medical report
def create_medical_report(db: Session, report: schemas.MedicalReportCreate):
    db_report = models.MedicalReport(**report.model_dump())
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

# Lấy medical report theo record_id
def get_medical_report(db: Session, record_id: int):
    return db.query(models.MedicalReport).filter(models.MedicalReport.record_id == record_id).first()

# Lấy danh sách medical reports của một bệnh nhân, có phân trang
def get_medical_reports_for_patient(db: Session, patient_id: int, skip: int = 0, limit: int = 100):
    return (
        db.query(models.MedicalReport)
        .filter(models.MedicalReport.patient_id == patient_id)
        .order_by(models.MedicalReport.in_day.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

# Cập nhật medical report (giả sử có schema MedicalReportUpdate chứa các trường có thể update)
def update_medical_report(db: Session, record_id: int, report_update: schemas.MedicalReportUpdate):
    db_report = get_medical_report(db, record_id)
    if not db_report:
        return None
    for field, value in report_update.model_dump(exclude_unset=True).items():
        setattr(db_report, field, value)
    db.commit()
    db.refresh(db_report)
    return db_report

# Xóa medical report theo record_id
def delete_medical_report(db: Session, record_id: int):
    db_report = get_medical_report(db, record_id)
    if not db_report:
        return None
    db.delete(db_report)
    db.commit()
    return db_report

# Placeholder for a function to get all messages in a conversation (if applicable)
# def get_conversation_messages(db: Session, conversation_id: int, skip: int = 0, limit: int = 100):
#     pass

# Placeholder for a function to add chatbot's response to a message
# def add_chatbot_response_to_message(db: Session, message_id: int, response_text: str):
#     db_message = get_chat_message(db, message_id)
#     if db_message:
#         db_message.response = response_text
#         db.commit()
#         db.refresh(db_message)
#     return db_message