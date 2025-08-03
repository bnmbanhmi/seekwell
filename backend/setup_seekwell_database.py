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
        admin_username = os.getenv("ADMIN_USERNAME", "admin")
        admin_email = os.getenv("ADMIN_EMAIL", "admin@example.com")
        admin_password = os.getenv("ADMIN_PASSWORD", "adminpassword")

        if not all([admin_username, admin_email, admin_password]):
            print("❌ Admin credentials (ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD) not found in .env file. Skipping admin creation.")
            return

        admin = crud.get_user_by_username(db, username=admin_username)
        if not admin:
            admin_in = schemas.UserCreate(
                username=admin_username,
                email=admin_email,
                password=admin_password,
                full_name="Admin User",
                role=UserRole.ADMIN
            )
            crud.create_user(db, user=admin_in)
            print(f"✅ Admin user '{admin_username}' created.")
        else:
            print(f"ℹ️ Admin user '{admin_username}' already exists. Skipping.")
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
    finally:
        db.close()

    print("\n--- Database setup complete! ---")

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
    """
    print("\n👥 Creating mock users for testing...")
    db = SessionLocal()
    try:
        mock_users = [
            # Doctors
            {"username": "drsantos", "email": "dermatologist@seekwell.health", "password": "DermExpert2025", "full_name": "Dr. Maria Santos", "role": UserRole.DOCTOR},
            {"username": "drchen", "email": "oncologist@seekwell.health", "password": "OncoSpecialist2025", "full_name": "Dr. James Chen", "role": UserRole.DOCTOR},
            {"username": "drsharma", "email": "pathologist@seekwell.health", "password": "PathExpert2025", "full_name": "Dr. Priya Sharma", "role": UserRole.DOCTOR},
            # Officials
            {"username": "official_th", "email": "official.thailand@seekwell.health", "password": "OfficialThailand2025", "full_name": "Thai Official", "role": UserRole.OFFICIAL},
            {"username": "official_id", "email": "official.indonesia@seekwell.health", "password": "OfficialIndonesia2025", "full_name": "Indonesian Official", "role": UserRole.OFFICIAL},
            {"username": "official_ph", "email": "official.philippines@seekwell.health", "password": "OfficialPhilippines2025", "full_name": "Filipino Official", "role": UserRole.OFFICIAL},
            {"username": "official_vn", "email": "official.vietnam@seekwell.health", "password": "OfficialVietnam2025", "full_name": "Vietnamese Official", "role": UserRole.OFFICIAL},
            # Patients
            {"username": "patient1", "email": "patient1@example.com", "password": "password123", "full_name": "Patient One", "role": UserRole.PATIENT},
            {"username": "patient2", "email": "patient2@example.com", "password": "password123", "full_name": "Patient Two", "role": UserRole.PATIENT},
            {"username": "patient3", "email": "patient3@example.com", "password": "password123", "full_name": "Patient Three", "role": UserRole.PATIENT},
        ]

        for user_data in mock_users:
            user = crud.get_user_by_username(db, username=user_data["username"])
            if not user:
                user_in = schemas.UserCreate(**user_data)
                crud.create_user(db, user=user_in)
                print(f"✅ Mock user '{user_data['username']}' created.")
            else:
                print(f"ℹ️ Mock user '{user_data['username']}' already exists. Skipping.")

    except Exception as e:
        print(f"❌ Error creating mock users: {e}")
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
    sync_user_role_enum() # Add this step to sync the enum before creating users
    if not args.no_mock:
        create_mock_users()
