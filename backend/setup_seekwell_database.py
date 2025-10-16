#!/usr/bin/env python3
"""
SeekWell Database Initialization Script
Handles database schema creation and initial admin user setup.
"""
import sys
import os
import argparse
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# --- Setup Project Path ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# Assumes this script is in the 'backend' directory
sys.path.insert(0, SCRIPT_DIR)

# --- Load Environment Variables ---
DOTENV_PATH = os.path.join(SCRIPT_DIR, '.env')
load_dotenv(DOTENV_PATH)

from app.database import engine, Base, UserRole, SessionLocal
from app import crud, schemas
from app.config import settings

def setup_database(reset=False):
    """
    Initializes the database, creates tables, and sets up the admin user.
    """
    print("--- SeekWell Database Setup ---")

    # 1. Test Connection
    try:
        print("🔌 Testing database connection...")
        with engine.connect() as connection:
            print("✅ Connection successful.")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("👉 Please ensure your PostgreSQL server is running and DATABASE_URL is correct in .env")
        return

    # 2. Drop and Recreate Tables if --reset is specified
    if reset:
        print("\n⚠️  --reset flag detected. Dropping all tables...")
        try:
            # Use a more robust method to drop all tables, including dependencies
            with engine.connect() as connection:
                connection.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public;"))
                print("🗑️  All tables dropped successfully by resetting the public schema.")
        except Exception as e:
            print(f"❌ Error dropping tables: {e}")
            return

    # 3. Create Tables
    print("\n🏗️  Creating database tables from models...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created successfully.")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return

    # 4. Create Admin User
    print("\n👤 Creating initial admin user...")
    db = SessionLocal()
    try:
        admin_email = os.getenv("ADMIN_EMAIL", "admin@example.com")
        admin_password = os.getenv("ADMIN_PASSWORD", "adminpassword")

        if not all([admin_email, admin_password]):
            print("❌ Admin credentials (ADMIN_EMAIL, ADMIN_PASSWORD) not found in .env file. Skipping admin creation.")
            return

        # Use email as the username for the admin account to align with login logic
        admin = crud.get_user_by_email(db, email=admin_email)
        if not admin:
            admin_in = schemas.UserCreate(
                username=admin_email, # Use email for username
                email=admin_email,
                password=admin_password,
                full_name="Admin User",
                role=UserRole.ADMIN
            )
            crud.create_user(db, user=admin_in)
            print(f"✅ Admin user '{admin_email}' created.")
        else:
            print(f"ℹ️ Admin user '{admin_email}' already exists. Skipping.")
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
    finally:
        db.close()

    print("\n--- Database setup complete! ---")

def migrate_user_roles():
    """
    Updates any users with the legacy 'LOCAL_CADRE' role to the new 'OFFICIAL' role.
    Also ensures the 'OFFICIAL' enum value exists in the database.
    """
    print("\n🔄 Migrating legacy user roles...")
    try:
        with engine.connect() as connection:
            # This is a two-step process:
            # 1. Ensure the 'OFFICIAL' value exists in the enum type.
            connection.execute(text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'OFFICIAL'"))
            
            # 2. Update any existing rows that have the old value.
            result = connection.execute(text("UPDATE users SET role = 'OFFICIAL' WHERE role = 'LOCAL_CADRE'"))
            connection.commit()
            
            if result.rowcount > 0:
                print(f"✅ Migrated {result.rowcount} users from 'LOCAL_CADRE' to 'OFFICIAL'.")
            else:
                print("ℹ️ No legacy 'LOCAL_CADRE' roles found to migrate.")
    except Exception as e:
        print(f"⚠️  Could not migrate user roles (this is expected if the type doesn't exist yet): {e}")

def sync_user_role_enum():
    """
    Ensures the 'userrole' enum in the database matches the UserRole enum in the code.
    """
    print("\n🔄 Synchronizing UserRole enum with the database...")
    try:
        with engine.connect() as connection:
            # This command adds the 'OFFICIAL' value to the enum if it doesn't already exist.
            # It's a safe way to update the enum without causing errors if it's already been updated.
            connection.execute(text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'OFFICIAL'"))
            connection.commit()
            print("✅ UserRole enum synchronized.")
    except Exception as e:
        # If the enum type doesn't exist at all, it will be created by create_all, so we can ignore errors here.
        print(f"ℹ️  Could not alter UserRole enum (this is expected on first run): {e}")


def create_mock_users():
    """
    Creates a set of mock users for testing purposes.
    All users use simple passwords (123456) and phone numbers as usernames.
    """
    print("\n👥 Creating mock users for testing...")
    db = SessionLocal()
    try:
        mock_users = [
            # Admin (using email as username per admin pattern)
            {"username": "admin@seekwell.health", "email": "admin@seekwell.health", "password": "123456", "full_name": "Admin User", "role": UserRole.ADMIN, "phone": None},
            
            # Doctors (phone as username)
            {"username": "0901234567", "email": "doctor1@seekwell.health", "password": "123456", "full_name": "Dr. Maria Santos", "role": UserRole.DOCTOR, "phone": "0901234567"},
            {"username": "0901234568", "email": "doctor2@seekwell.health", "password": "123456", "full_name": "Dr. James Chen", "role": UserRole.DOCTOR, "phone": "0901234568"},
            {"username": "0901234569", "email": "doctor3@seekwell.health", "password": "123456", "full_name": "Dr. Priya Sharma", "role": UserRole.DOCTOR, "phone": "0901234569"},
            
            # Officials (phone as username)
            {"username": "0902345671", "email": "official.thailand@seekwell.health", "password": "123456", "full_name": "Thai Official", "role": UserRole.OFFICIAL, "phone": "0902345671"},
            {"username": "0902345672", "email": "official.indonesia@seekwell.health", "password": "123456", "full_name": "Indonesian Official", "role": UserRole.OFFICIAL, "phone": "0902345672"},
            {"username": "0902345673", "email": "official.philippines@seekwell.health", "password": "123456", "full_name": "Filipino Official", "role": UserRole.OFFICIAL, "phone": "0902345673"},
            {"username": "0902345674", "email": "official.vietnam@seekwell.health", "password": "123456", "full_name": "Vietnamese Official", "role": UserRole.OFFICIAL, "phone": "0902345674"},
            
            # Patients (phone as username) - matching demo login
            {"username": "0903456781", "email": "patient1@seekwell.health", "password": "123456", "full_name": "Nguyen Van A", "role": UserRole.PATIENT, "phone": "0903456781"},
            {"username": "0903456782", "email": "patient2@seekwell.health", "password": "123456", "full_name": "Tran Thi B", "role": UserRole.PATIENT, "phone": "0903456782"},
            {"username": "0903456783", "email": "patient3@seekwell.health", "password": "123456", "full_name": "Le Van C", "role": UserRole.PATIENT, "phone": "0903456783"},
            {"username": "0903456784", "email": "patient4@seekwell.health", "password": "123456", "full_name": "Pham Thi D", "role": UserRole.PATIENT, "phone": "0903456784"},
            {"username": "0903456785", "email": "patient5@seekwell.health", "password": "123456", "full_name": "Hoang Van E", "role": UserRole.PATIENT, "phone": "0903456785"},
        ]

        created_count = 0
        for user_data in mock_users:
            phone = user_data.pop("phone", None)
            user = crud.get_user_by_username(db, username=user_data["username"])
            if not user:
                user_in = schemas.UserCreate(**user_data)
                created_user = crud.create_user(db, user=user_in)
                
                # If patient and has phone, update patient profile
                if phone and user_data["role"] == UserRole.PATIENT:
                    patient = db.query(crud.models.Patient).filter(
                        crud.models.Patient.patient_id == created_user.user_id
                    ).first()
                    if patient:
                        patient.phone_number = phone
                        db.commit()
                
                print(f"✅ Mock user '{user_data['username']}' ({user_data['full_name']}) created.")
                created_count += 1
            else:
                print(f"ℹ️ Mock user '{user_data['username']}' already exists. Skipping.")
        
        print(f"\n✅ Created {created_count} new mock users.")

    except Exception as e:
        print(f"❌ Error creating mock users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SeekWell Database Setup Script.")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Drop and recreate all tables. DANGER: This will delete all data."
    )
    parser.add_argument(
        "--no-mock",
        action="store_true",
        help="Skip creating mock users."
    )
    args = parser.parse_args()

    setup_database(reset=args.reset)
    migrate_user_roles() # Run the migration to clean up old data
    if not args.no_mock:
        create_mock_users()
