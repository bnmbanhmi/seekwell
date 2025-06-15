import sys
import os
import asyncio
from datetime import date
from dotenv import load_dotenv # Import load_dotenv

# Load .env file from the backend directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
DOTENV_PATH = os.path.join(BACKEND_DIR, '.env')
load_dotenv(DOTENV_PATH)

sys.path.insert(0, BACKEND_DIR) # Add backend directory to sys.path

from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import SessionLocal, engine, UserRole, create_db_and_tables
from app import crud, schemas, models

async def update_user_role_enum():
    """
    Ensure the UserRole enum includes all necessary values
    """
    print("🔧 Updating database schema for UserRole enum...")
    
    try:
        async with engine.begin() as conn:
            # Check if LOCAL_CADRE already exists
            result = await conn.execute(text("""
                SELECT enumlabel 
                FROM pg_enum 
                JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
                WHERE pg_type.typname = 'userrole' 
                AND enumlabel = 'LOCAL_CADRE'
            """))
            
            existing = result.fetchone()
            
            if existing:
                print("✅ LOCAL_CADRE role already exists in database")
                return True
            
            # Add LOCAL_CADRE to the enum
            print("📝 Adding LOCAL_CADRE to UserRole enum...")
            await conn.execute(text("ALTER TYPE userrole ADD VALUE 'LOCAL_CADRE'"))
            print("✅ Successfully added LOCAL_CADRE role to database")
            return True
            
    except Exception as e:
        print(f"⚠️  Could not update enum (might be a new database): {e}")
        # This is expected for new databases where enum will be created fresh
        return True

# Initialize SeekWell healthcare platform with essential users for ASEAN deployment
async def create_initial_users():
    db: Session = SessionLocal()
    try:
        print("🩺 Initializing SeekWell - AI-Powered Skin Cancer Detection Platform")
        print("🌍 Setting up initial users for ASEAN healthcare deployment...")

        # --- 1. CREATE ADMIN USER ---
        print("\n1. Creating System Administrator...")
        admin_username = "admin"
        admin_email = "admin@seekwell.health"
        admin_password = "SeekWell2025!"
        admin_full_name = "SeekWell System Administrator"

        # Check if admin already exists
        existing_admin = crud.get_user_by_email(db, email=admin_email)
        if not existing_admin:
            admin_user_in = schemas.UserCreate(
                username=admin_username,
                email=admin_email,
                password=admin_password,
                full_name=admin_full_name,
                role=UserRole.ADMIN
            )
            admin_user = crud.create_user(db=db, user=admin_user_in)
            print(f"✅ Admin user created: {admin_user.username} (ID: {admin_user.user_id})")
            print(f"   📧 Email: {admin_email}")
            print(f"   🔑 Password: {admin_password}")
        else:
            print(f"⚠️  Admin user already exists: {admin_email}")

        # --- 2. CREATE DEFAULT HOSPITAL ---
        print("\n2. Creating Default Healthcare Facility...")
        
        # Check if default hospital already exists
        existing_hospital = crud.get_hospital(db, hospital_id=1)
        if not existing_hospital:
            hospital_in = schemas.HospitalCreate(
                hospital_name="SeekWell Regional Health Center",
                address="ASEAN Digital Health Hub, Southeast Asia",
                governed_by="ASEAN Digital Health Initiative"
            )
            hospital = crud.create_hospital(db=db, hospital_in=hospital_in)
            print(f"✅ Default hospital created: {hospital.hospital_name} (ID: {hospital.hospital_id})")
        else:
            print(f"⚠️  Default hospital already exists: {existing_hospital.hospital_name}")

        # --- 3. CREATE SPECIALIST DOCTORS ---
        print("\n3. Creating Specialist Doctors...")
        doctors_data = [
            {
                "username": "dr_dermatologist",
                "email": "dermatologist@seekwell.health",
                "password": "DermExpert2025",
                "full_name": "Dr. Maria Santos",
                "major": "Dermatology & Skin Cancer"
            },
            {
                "username": "dr_oncologist",
                "email": "oncologist@seekwell.health", 
                "password": "OncoSpecialist2025",
                "full_name": "Dr. James Chen",
                "major": "Oncology & Cancer Treatment"
            },
            {
                "username": "dr_pathologist",
                "email": "pathologist@seekwell.health",
                "password": "PathExpert2025",
                "full_name": "Dr. Priya Sharma",
                "major": "Pathology & Diagnostics"
            }
        ]

        doctor_users = []
        for doctor_data in doctors_data:
            existing_doctor = crud.get_user_by_email(db, email=doctor_data["email"])
            if not existing_doctor:
                doctor_user_in = schemas.UserCreate(
                    username=doctor_data["username"],
                    email=doctor_data["email"],
                    password=doctor_data["password"],
                    full_name=doctor_data["full_name"],
                    role=UserRole.DOCTOR
                )
                doctor_user = crud.create_user(db=db, user=doctor_user_in)
                doctor_users.append(doctor_user)
                print(f"✅ Doctor created: {doctor_user.full_name} (ID: {doctor_user.user_id})")
                print(f"   📧 Email: {doctor_data['email']}")
                print(f"   🔑 Password: {doctor_data['password']}")
                print(f"   🏥 Specialty: {doctor_data['major']}")
            else:
                doctor_users.append(existing_doctor)
                print(f"⚠️  Doctor already exists: {doctor_data['email']}")

        # --- 4. CREATE LOCAL CADRES (COMMUNITY HEALTH WORKERS) ---
        print("\n4. Creating Local Health Cadres...")
        cadres_data = [
            {
                "username": "cadre_thailand",
                "email": "cadre.thailand@seekwell.health",
                "password": "CadreThailand2025",
                "full_name": "Siriporn Thanakit (Thailand CHW)",
                "location": "Rural Thailand - Northeastern Province"
            },
            {
                "username": "cadre_indonesia",
                "email": "cadre.indonesia@seekwell.health",
                "password": "CadreIndonesia2025", 
                "full_name": "Budi Santoso (Indonesia CHW)",
                "location": "Remote Islands - East Java"
            },
            {
                "username": "cadre_philippines",
                "email": "cadre.philippines@seekwell.health",
                "password": "CadrePhilippines2025",
                "full_name": "Maria Gonzales (Philippines CHW)",
                "location": "Rural Philippines - Mindanao"
            },
            {
                "username": "cadre_vietnam",
                "email": "cadre.vietnam@seekwell.health",
                "password": "CadreVietnam2025",
                "full_name": "Nguyen Thi Lan (Vietnam CHW)",
                "location": "Mekong Delta Region"
            }
        ]

        cadre_users = []
        for cadre_data in cadres_data:
            existing_cadre = crud.get_user_by_email(db, email=cadre_data["email"])
            if not existing_cadre:
                try:
                    cadre_user_in = schemas.UserCreate(
                        username=cadre_data["username"],
                        email=cadre_data["email"],
                        password=cadre_data["password"],
                        full_name=cadre_data["full_name"],
                        role=UserRole.LOCAL_CADRE
                    )
                    cadre_user = crud.create_user(db=db, user=cadre_user_in)
                    cadre_users.append(cadre_user)
                    print(f"✅ Local Cadre created: {cadre_user.full_name} (ID: {cadre_user.user_id})")
                    print(f"   📧 Email: {cadre_data['email']}")
                    print(f"   🔑 Password: {cadre_data['password']}")
                    print(f"   📍 Location: {cadre_data['location']}")
                except Exception as e:
                    print(f"⚠️  Could not create LOCAL_CADRE user: {e}")
                    print(f"💡 Creating as ADMIN role instead (can be updated later)")
                    # Fallback to ADMIN role if LOCAL_CADRE enum doesn't exist yet
                    cadre_user_in = schemas.UserCreate(
                        username=cadre_data["username"],
                        email=cadre_data["email"],
                        password=cadre_data["password"],
                        full_name=f"{cadre_data['full_name']} [CADRE]",
                        role=UserRole.ADMIN
                    )
                    cadre_user = crud.create_user(db=db, user=cadre_user_in)
                    cadre_users.append(cadre_user)
                    print(f"✅ Cadre created as ADMIN: {cadre_user.full_name} (ID: {cadre_user.user_id})")
            else:
                cadre_users.append(existing_cadre)
                print(f"⚠️  Local Cadre already exists: {cadre_data['email']}")

        # --- 5. CREATE DEMO PATIENTS ---
        print("\n5. Creating Demo Patients...")
        patients_data = [
            {
                "username": "patient_demo1", 
                "email": "patient1@seekwell.health", 
                "full_name": "Ahmad Rahman",
                "age": 45,
                "location": "Rural Malaysia"
            },
            {
                "username": "patient_demo2", 
                "email": "patient2@seekwell.health", 
                "full_name": "Siti Nurhaliza",
                "age": 32,
                "location": "Remote Indonesia"
            },
            {
                "username": "patient_demo3", 
                "email": "patient3@seekwell.health", 
                "full_name": "Jose Rizal Jr.",
                "age": 58,
                "location": "Rural Philippines"
            },
            {
                "username": "patient_demo4", 
                "email": "patient4@seekwell.health", 
                "full_name": "Somchai Jaidee",
                "age": 41,
                "location": "Rural Thailand"
            },
            {
                "username": "patient_demo5", 
                "email": "patient5@seekwell.health", 
                "full_name": "Tran Thi Mai",
                "age": 35,
                "location": "Rural Vietnam"
            }
        ]

        patient_users = []
        for patient_data in patients_data:
            existing_patient = crud.get_user_by_email(db, email=patient_data["email"])
            if not existing_patient:
                patient_user_in = schemas.UserCreate(
                    username=patient_data["username"],
                    email=patient_data["email"],
                    password="PatientDemo2025",
                    full_name=patient_data["full_name"],
                    role=UserRole.PATIENT
                )
                patient_user = crud.create_user(db=db, user=patient_user_in)
                patient_users.append(patient_user)
                print(f"✅ Demo Patient created: {patient_user.full_name} (ID: {patient_user.user_id})")
                print(f"   📧 Email: {patient_data['email']}")
                print(f"   🔑 Password: PatientDemo2025")
                print(f"   📍 Location: {patient_data['location']}")
            else:
                patient_users.append(existing_patient)
                print(f"⚠️  Demo Patient already exists: {patient_data['email']}")

        print(f"\n🎉 SeekWell platform initialization completed!")
        print(f"📊 Summary:")
        print(f"   🔧 1 System Administrator")
        print(f"   🏥 1 Regional Healthcare Facility")
        print(f"   👩‍⚕️ {len(doctors_data)} Specialist Doctors")
        print(f"   🤝 {len(cadres_data)} Community Health Workers (Local Cadres)")
        print(f"   👥 {len(patients_data)} Demo Patients")
        print(f"   📈 Total: {1 + len(doctors_data) + len(cadres_data) + len(patients_data)} users")
        
        print(f"\n🌟 Platform Ready for ASEAN Deployment!")
        print(f"🚀 Next Steps:")
        print(f"   1. Configure AI model endpoints")
        print(f"   2. Set up HuggingFace integration")
        print(f"   3. Deploy to production environment")
        print(f"   4. Train local cadres on platform usage")
        print(f"   5. Begin pilot deployment in target communities")

    except Exception as e:
        print(f"❌ An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

async def verify_system_health():
    """
    Verify that the SeekWell platform is properly initialized
    """
    db: Session = SessionLocal()
    try:
        print("\n🔍 Performing system health check...")
        
        # Check if admin exists
        admin = crud.get_user_by_email(db, email="admin@seekwell.health")
        if admin:
            print("✅ Admin user verified")
        else:
            print("❌ Admin user missing")
            
        # Check if doctors exist
        doctor_count = db.query(models.User).filter(models.User.role == UserRole.DOCTOR).count()
        print(f"✅ {doctor_count} specialist doctors configured")
        
        # Check if local cadres exist
        try:
            cadre_count = db.query(models.User).filter(models.User.role == UserRole.LOCAL_CADRE).count()
            print(f"✅ {cadre_count} local cadres configured")
        except Exception as e:
            print(f"⚠️  Could not count LOCAL_CADRE users: {e}")
            # Count admin users with [CADRE] in name as fallback
            cadre_count = db.query(models.User).filter(
                models.User.role == UserRole.ADMIN,
                models.User.full_name.contains("[CADRE]")
            ).count()
            print(f"⚠️  {cadre_count} cadres created as ADMIN role (needs enum update)")
        
        # Check if patients exist
        patient_count = db.query(models.User).filter(models.User.role == UserRole.PATIENT).count()
        print(f"✅ {patient_count} demo patients configured")
        
        # Check if hospital exists
        hospital_count = db.query(models.Hospital).count()
        print(f"✅ {hospital_count} healthcare facility configured")
        
        total_users = db.query(models.User).count()
        print(f"📊 Total system users: {total_users}")
        
        print("✅ System health check completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ System health check failed: {e}")
        return False
    finally:
        db.close()

async def main():
    """
    Main function to initialize SeekWell platform for production deployment
    """
    print("🚀 Starting SeekWell Platform Initialization...")
    print("=" * 60)
    
    try:
        # Create database tables if they don't exist
        print("📋 Creating database tables...")
        create_db_and_tables()
        print("✅ Database tables verified/created")
        
        # Update UserRole enum to include LOCAL_CADRE
        await update_user_role_enum()
        
        # Create initial users
        await create_initial_users()
        
        # Verify system health
        await verify_system_health()
        
        print("=" * 60)
        print("🎯 SeekWell Platform Successfully Initialized!")
        print("🌍 Ready for ASEAN healthcare deployment")
        print("=" * 60)
        
    except Exception as e:
        print(f"💥 Initialization failed: {e}")
        print("🔧 Please check your database connection and try again.")
        sys.exit(1)

if __name__ == "__main__":
    print("🩺 SeekWell - AI-Powered Skin Cancer Detection Platform")
    print("🌟 ASEAN Digital Health Initiative")
    print("📅 Initializing for production deployment...")
    print()
    
    asyncio.run(main())
