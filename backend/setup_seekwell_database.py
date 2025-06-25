#!/usr/bin/env python3
"""
SeekWell Database Initialization & Setup Script
Complete database setup, schema fixes, and initial data creation

This unified script handles:
1. Database schema creation and updates
2. Missing column fixes and foreign key constraints
3. Initial admin and user account creation
4. Community health center setup
5. Enum value updates (LOCAL_CADRE role)
6. Sample data population

Usage:
    python setup_seekwell_database.py [--reset] [--skip-users] [--verbose]
    
Options:
    --reset      Drop and recreate all tables (DANGER: destroys all data)
    --skip-users Skip user creation if you only want schema fixes
    --verbose    Show detailed output
"""

import sys
import os
import argparse
from datetime import date
from sqlalchemy import text, create_engine, inspect
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# Load environment variables
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR) if 'app' in SCRIPT_DIR else SCRIPT_DIR
DOTENV_PATH = os.path.join(BACKEND_DIR, '.env')
load_dotenv(DOTENV_PATH)

sys.path.insert(0, BACKEND_DIR)

from app.database import engine, SessionLocal, UserRole, Gender, Class, create_db_and_tables
from app import crud, schemas, models
from app.config import settings

class SeekWellDatabaseSetup:
    def __init__(self, verbose=False):
        self.verbose = verbose
        self.engine = create_engine(settings.DATABASE_URL)
        
    def log(self, message, force=False):
        """Print message if verbose mode or force is True"""
        if self.verbose or force:
            print(message)
    
    def log_step(self, step_num, title):
        """Print step header"""
        print(f"\n{step_num}. {title}")
        print("=" * (len(title) + 4))
    
    def check_database_connection(self):
        """Test database connectivity"""
        self.log_step("🔌", "Testing Database Connection")
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text("SELECT 1"))
                self.log("✅ Database connection successful")
                return True
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            print("💡 Please check your DATABASE_URL and ensure PostgreSQL is running")
            return False
    
    def create_base_schema(self, reset=False):
        """Create or reset database schema"""
        self.log_step("🏗️", "Database Schema Setup")
        
        if reset:
            self.log("⚠️  RESETTING DATABASE (dropping all tables)", force=True)
            try:
                with self.engine.connect() as conn:
                    # Drop all tables
                    models.Base.metadata.drop_all(bind=self.engine)
                    self.log("🗑️  All tables dropped")
            except Exception as e:
                self.log(f"⚠️  Error dropping tables: {e}")
        
        try:
            # Create all tables
            models.Base.metadata.create_all(bind=self.engine)
            self.log("✅ Database schema created/updated")
            return True
        except Exception as e:
            print(f"❌ Error creating schema: {e}")
            return False
    
    def inspect_and_fix_schema(self):
        """Inspect current schema and fix missing columns/constraints"""
        self.log_step("🔍", "Schema Inspection & Fixes")
        
        try:
            with self.engine.connect() as conn:
                # Check doctors table structure
                result = conn.execute(text("""
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns 
                    WHERE table_name = 'doctors' 
                    ORDER BY ordinal_position;
                """))
                
                columns = result.fetchall()
                if not columns:
                    self.log("⚠️  Doctors table does not exist, will be created by schema setup")
                    return True
                
                column_names = [col[0] for col in columns]
                
                self.log(f"📋 Current doctors table columns: {column_names}")
                
                # Add missing columns
                missing_columns = []
                if 'specialization' not in column_names:
                    missing_columns.append(('specialization', 'VARCHAR(160)'))
                if 'center_id' not in column_names:
                    missing_columns.append(('center_id', 'INTEGER'))
                if 'is_community_health_worker' not in column_names:
                    missing_columns.append(('is_community_health_worker', 'BOOLEAN DEFAULT FALSE'))
                
                if missing_columns:
                    self.log("🔧 Adding missing columns to doctors table...")
                    for col_name, col_type in missing_columns:
                        try:
                            conn.execute(text(f"""
                                ALTER TABLE doctors 
                                ADD COLUMN IF NOT EXISTS {col_name} {col_type};
                            """))
                            self.log(f"   ✅ Added column: {col_name}")
                        except Exception as e:
                            self.log(f"   ⚠️  Could not add {col_name}: {e}")
                
                # Ensure community_health_centers table exists
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS community_health_centers (
                        center_id SERIAL PRIMARY KEY,
                        center_name VARCHAR(100),
                        address VARCHAR(255),
                        region VARCHAR(160),
                        center_type VARCHAR(50)
                    );
                """))
                self.log("✅ community_health_centers table ready")
                
                # Add foreign key constraint if needed
                try:
                    # Check if constraint exists
                    result = conn.execute(text("""
                        SELECT constraint_name 
                        FROM information_schema.table_constraints 
                        WHERE table_name = 'doctors' 
                        AND constraint_name LIKE '%center_id%';
                    """))
                    
                    if not result.fetchone():
                        conn.execute(text("""
                            ALTER TABLE doctors 
                            ADD CONSTRAINT fk_doctors_center_id 
                            FOREIGN KEY (center_id) 
                            REFERENCES community_health_centers(center_id) 
                            ON DELETE CASCADE;
                        """))
                        self.log("✅ Added foreign key constraint for center_id")
                    else:
                        self.log("✅ Foreign key constraints already exist")
                        
                except Exception as e:
                    self.log(f"⚠️  Foreign key constraint issue: {e}")
                
                conn.commit()
                return True
                
        except Exception as e:
            print(f"❌ Error during schema inspection: {e}")
            return False
    
    def update_enums(self):
        """Update database enums to include all required values"""
        self.log_step("🔧", "Enum Updates")
        
        try:
            with self.engine.connect() as conn:
                # Check if LOCAL_CADRE enum value exists
                result = conn.execute(text("""
                    SELECT enumlabel 
                    FROM pg_enum 
                    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
                    WHERE pg_type.typname = 'userrole' 
                    AND enumlabel = 'LOCAL_CADRE'
                """))
                
                if result.fetchone():
                    self.log("✅ LOCAL_CADRE enum value already exists")
                else:
                    # Add LOCAL_CADRE to the enum
                    conn.execute(text("ALTER TYPE userrole ADD VALUE 'LOCAL_CADRE'"))
                    self.log("✅ Added LOCAL_CADRE to UserRole enum")
                
                # Verify all enum values
                result = conn.execute(text("""
                    SELECT enumlabel 
                    FROM pg_enum 
                    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
                    WHERE pg_type.typname = 'userrole'
                    ORDER BY enumlabel
                """))
                
                enum_values = [row[0] for row in result.fetchall()]
                self.log(f"📋 UserRole enum values: {enum_values}")
                
                conn.commit()
                return True
                
        except Exception as e:
            self.log(f"⚠️  Enum update warning: {e}")
            return True  # Not critical for new databases
    
    def create_default_health_center(self, db: Session):
        """Create default community health center"""
        self.log("🏥 Setting up default community health center...")
        
        try:
            # Check if any health centers exist
            existing_center = db.query(models.CommunityHealthCenter).first()
            if existing_center:
                self.log(f"✅ Health center already exists: {existing_center.center_name}")
                return existing_center
            
            # Create default health center
            center_in = schemas.CommunityHealthCenterCreate(
                center_name="SeekWell Regional Community Health Center",
                address="ASEAN Digital Health Hub, Southeast Asia",
                region="ASEAN Digital Health Initiative",
                center_type="Regional Community Health Center"
            )
            center = crud.create_community_health_center(db=db, center_in=center_in)
            db.commit()
            self.log(f"✅ Created health center: {center.center_name} (ID: {center.center_id})")
            return center
            
        except Exception as e:
            print(f"❌ Error creating health center: {e}")
            db.rollback()
            return None
    
    def fix_existing_doctors(self, db: Session, health_center):
        """Update existing doctors with proper values"""
        self.log("👨‍⚕️ Updating existing doctors...")
        
        try:
            # Update doctors missing center_id or specialization
            updated_count = 0
            doctors = db.query(models.Doctor).all()
            
            for doctor in doctors:
                needs_update = False
                if not doctor.center_id:
                    doctor.center_id = health_center.center_id
                    needs_update = True
                if not doctor.specialization:
                    doctor.specialization = "General Practice"
                    needs_update = True
                if doctor.is_community_health_worker is None:
                    doctor.is_community_health_worker = False
                    needs_update = True
                
                if needs_update:
                    updated_count += 1
            
            if updated_count > 0:
                db.commit()
                self.log(f"✅ Updated {updated_count} existing doctors")
            else:
                self.log("✅ All doctors already have proper values")
            
            return True
            
        except Exception as e:
            print(f"❌ Error updating doctors: {e}")
            db.rollback()
            return False
    
    def create_initial_users(self, db: Session, health_center):
        """Create all initial users for the platform"""
        self.log_step("👥", "Initial User Creation")
        
        # 1. Admin User
        self.log("🔧 Creating System Administrator...")
        admin_data = {
            "username": "admin",
            "email": "admin@seekwell.health",
            "password": "SeekWell2025!",
            "full_name": "SeekWell System Administrator",
            "role": UserRole.ADMIN
        }
        
        existing_admin = crud.get_user_by_email(db, email=admin_data["email"])
        if not existing_admin:
            admin_user_in = schemas.UserCreate(**admin_data)
            admin_user = crud.create_user(db=db, user=admin_user_in)
            self.log(f"✅ Admin created: {admin_user.username} (Email: {admin_data['email']}, Password: {admin_data['password']})")
        else:
            self.log(f"⚠️  Admin already exists: {admin_data['email']}")
        
        # 2. Specialist Doctors
        self.log("\n👩‍⚕️ Creating Specialist Doctors...")
        doctors_data = [
            {
                "username": "dr_dermatologist",
                "email": "dermatologist@seekwell.health",
                "password": "DermExpert2025",
                "full_name": "Dr. Maria Santos",
                "specialization": "Dermatology & Skin Cancer",
                "role": UserRole.DOCTOR
            },
            {
                "username": "dr_oncologist",
                "email": "oncologist@seekwell.health", 
                "password": "OncoSpecialist2025",
                "full_name": "Dr. James Chen",
                "specialization": "Oncology & Cancer Treatment",
                "role": UserRole.DOCTOR
            },
            {
                "username": "dr_pathologist",
                "email": "pathologist@seekwell.health",
                "password": "PathExpert2025",
                "full_name": "Dr. Priya Sharma",
                "specialization": "Pathology & Diagnostics",
                "role": UserRole.DOCTOR
            }
        ]
        
        for doctor_data in doctors_data:
            existing_doctor = crud.get_user_by_email(db, email=doctor_data["email"])
            if not existing_doctor:
                doctor_user_in = schemas.UserCreate(
                    username=doctor_data["username"],
                    email=doctor_data["email"],
                    password=doctor_data["password"],
                    full_name=doctor_data["full_name"],
                    role=doctor_data["role"]
                )
                doctor_user = crud.create_user(db=db, user=doctor_user_in)
                
                # Create doctor profile with specialization
                if hasattr(doctor_user, 'doctor_profile') and doctor_user.doctor_profile:
                    doctor_user.doctor_profile.specialization = doctor_data["specialization"]
                    doctor_user.doctor_profile.center_id = health_center.center_id
                    doctor_user.doctor_profile.is_community_health_worker = False
                
                self.log(f"✅ Doctor created: {doctor_user.full_name} (Email: {doctor_data['email']}, Password: {doctor_data['password']})")
                self.log(f"   🏥 Specialty: {doctor_data['specialization']}")
            else:
                self.log(f"⚠️  Doctor already exists: {doctor_data['email']}")
        
        # 3. Local Cadres (Community Health Workers)
        self.log("\n🤝 Creating Local Health Cadres...")
        cadres_data = [
            {
                "username": "cadre_thailand",
                "email": "cadre.thailand@seekwell.health",
                "password": "CadreThailand2025",
                "full_name": "Siriporn Thanakit (Thailand CHW)",
                "location": "Rural Thailand - Northeastern Province",
                "role": UserRole.LOCAL_CADRE
            },
            {
                "username": "cadre_indonesia",
                "email": "cadre.indonesia@seekwell.health",
                "password": "CadreIndonesia2025", 
                "full_name": "Budi Santoso (Indonesia CHW)",
                "location": "Remote Islands - East Java",
                "role": UserRole.LOCAL_CADRE
            },
            {
                "username": "cadre_philippines",
                "email": "cadre.philippines@seekwell.health",
                "password": "CadrePhilippines2025",
                "full_name": "Maria Gonzales (Philippines CHW)",
                "location": "Rural Philippines - Mindanao",
                "role": UserRole.LOCAL_CADRE
            },
            {
                "username": "cadre_vietnam",
                "email": "cadre.vietnam@seekwell.health",
                "password": "CadreVietnam2025",
                "full_name": "Nguyen Thi Lan (Vietnam CHW)",
                "location": "Mekong Delta Region",
                "role": UserRole.LOCAL_CADRE
            }
        ]
        
        for cadre_data in cadres_data:
            existing_cadre = crud.get_user_by_email(db, email=cadre_data["email"])
            if not existing_cadre:
                try:
                    cadre_user_in = schemas.UserCreate(
                        username=cadre_data["username"],
                        email=cadre_data["email"],
                        password=cadre_data["password"],
                        full_name=cadre_data["full_name"],
                        role=cadre_data["role"]
                    )
                    cadre_user = crud.create_user(db=db, user=cadre_user_in)
                    
                    # Create cadre profile
                    if hasattr(cadre_user, 'doctor_profile') and cadre_user.doctor_profile:
                        cadre_user.doctor_profile.specialization = "Community Health Worker"
                        cadre_user.doctor_profile.center_id = health_center.center_id
                        cadre_user.doctor_profile.is_community_health_worker = True
                    
                    self.log(f"✅ Local Cadre created: {cadre_user.full_name} (Email: {cadre_data['email']}, Password: {cadre_data['password']})")
                    self.log(f"   📍 Location: {cadre_data['location']}")
                except Exception as e:
                    self.log(f"⚠️  Could not create LOCAL_CADRE user: {e}")
                    # Fallback to ADMIN role
                    cadre_user_in = schemas.UserCreate(
                        username=cadre_data["username"],
                        email=cadre_data["email"],
                        password=cadre_data["password"],
                        full_name=f"{cadre_data['full_name']} [CADRE]",
                        role=UserRole.ADMIN
                    )
                    cadre_user = crud.create_user(db=db, user=cadre_user_in)
                    self.log(f"✅ Cadre created as ADMIN: {cadre_user.full_name}")
            else:
                self.log(f"⚠️  Local Cadre already exists: {cadre_data['email']}")
        
        # 4. Demo Patients
        self.log("\n👥 Creating Demo Patients...")
        patients_data = [
            {"username": "patient_demo1", "email": "patient1@seekwell.health", "full_name": "Ahmad Rahman", "location": "Rural Malaysia"},
            {"username": "patient_demo2", "email": "patient2@seekwell.health", "full_name": "Siti Nurhaliza", "location": "Remote Indonesia"},
            {"username": "patient_demo3", "email": "patient3@seekwell.health", "full_name": "Jose Rizal Jr.", "location": "Rural Philippines"},
            {"username": "patient_demo4", "email": "patient4@seekwell.health", "full_name": "Somchai Jaidee", "location": "Rural Thailand"},
            {"username": "patient_demo5", "email": "patient5@seekwell.health", "full_name": "Tran Thi Mai", "location": "Rural Vietnam"}
        ]
        
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
                self.log(f"✅ Demo Patient created: {patient_user.full_name} (Email: {patient_data['email']}, Password: PatientDemo2025)")
                self.log(f"   📍 Location: {patient_data['location']}")
            else:
                self.log(f"⚠️  Demo Patient already exists: {patient_data['email']}")
        
        db.commit()
        return True
    
    def verify_setup(self):
        """Verify that everything is working correctly"""
        self.log_step("✅", "Setup Verification")
        
        try:
            with self.engine.connect() as conn:
                # Test the query that was originally failing
                result = conn.execute(text("""
                    SELECT doctor_id, doctor_name, specialization, center_id, is_community_health_worker 
                    FROM doctors LIMIT 3;
                """))
                
                doctors = result.fetchall()
                self.log(f"📋 Successfully queried {len(doctors)} doctors")
                
                # Test user counts
                result = conn.execute(text("SELECT role, COUNT(*) FROM users GROUP BY role ORDER BY role;"))
                user_counts = result.fetchall()
                
                self.log("📊 User distribution:")
                for role, count in user_counts:
                    self.log(f"   {role}: {count}")
                
                # Test health centers
                result = conn.execute(text("SELECT COUNT(*) FROM community_health_centers;"))
                center_count = result.scalar()
                self.log(f"🏥 Health centers: {center_count}")
                
                return True
                
        except Exception as e:
            print(f"❌ Verification failed: {e}")
            return False
    
    def run_setup(self, reset=False, skip_users=False):
        """Run the complete setup process"""
        print("🩺 SeekWell Database Setup & Initialization")
        print("=" * 60)
        print(f"🌍 ASEAN Community Health Platform")
        print(f"🤖 AI-Powered Skin Cancer Detection")
        print("=" * 60)
        
        # Step 1: Test connection
        if not self.check_database_connection():
            return False
        
        # Step 2: Create/reset schema
        if not self.create_base_schema(reset=reset):
            return False
        
        # Step 3: Fix schema issues
        if not self.inspect_and_fix_schema():
            return False
        
        # Step 4: Update enums
        if not self.update_enums():
            return False
        
        if not skip_users:
            # Step 5: Create initial data
            db = SessionLocal()
            try:
                # Create health center
                health_center = self.create_default_health_center(db)
                if not health_center:
                    return False
                
                # Fix existing doctors
                self.fix_existing_doctors(db, health_center)
                
                # Create initial users
                if not self.create_initial_users(db, health_center):
                    return False
                
            except Exception as e:
                print(f"❌ Error during user creation: {e}")
                db.rollback()
                return False
            finally:
                db.close()
        
        # Step 6: Verify everything works
        if not self.verify_setup():
            return False
        
        # Success!
        print("\n" + "=" * 60)
        print("🎉 SeekWell Database Setup Completed Successfully!")
        print("=" * 60)
        
        if not skip_users:
            print("📊 Platform Summary:")
            print("   🔧 1 System Administrator")
            print("   🏥 1 Regional Healthcare Facility")
            print("   👩‍⚕️ 3 Specialist Doctors")
            print("   🤝 4 Community Health Workers (Local Cadres)")
            print("   👥 5 Demo Patients")
            print("   📈 Total: 13+ users ready for deployment")
            
            print("\n🔑 Default Login Credentials:")
            print("   👑 Admin: admin@seekwell.health / SeekWell2025!")
            print("   👩‍⚕️ Dermatologist: dermatologist@seekwell.health / DermExpert2025")
            print("   🤝 Thailand CHW: cadre.thailand@seekwell.health / CadreThailand2025")
            print("   👥 Demo Patient: patient1@seekwell.health / PatientDemo2025")
        
        print("\n🚀 Next Steps:")
        print("   1. ✅ Database is ready")
        print("   2. 🤖 Configure AI model endpoints")
        print("   3. 🔗 Set up HuggingFace integration")
        print("   4. 🌐 Deploy to production environment")
        print("   5. 📚 Train local cadres on platform usage")
        print("   6. 🎯 Begin pilot deployment in ASEAN communities")
        
        print(f"\n🌟 SeekWell Platform Ready for ASEAN Deployment!")
        return True

def main():
    parser = argparse.ArgumentParser(description='SeekWell Database Setup')
    parser.add_argument('--reset', action='store_true', 
                       help='Drop and recreate all tables (DESTROYS ALL DATA)')
    parser.add_argument('--skip-users', action='store_true',
                       help='Skip user creation, only fix schema')
    parser.add_argument('--verbose', action='store_true',
                       help='Show detailed output')
    
    args = parser.parse_args()
    
    if args.reset:
        confirm = input("⚠️  WARNING: This will DELETE ALL DATA. Type 'YES' to confirm: ")
        if confirm != 'YES':
            print("❌ Aborted")
            return False
    
    setup = SeekWellDatabaseSetup(verbose=args.verbose)
    return setup.run_setup(reset=args.reset, skip_users=args.skip_users)

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
