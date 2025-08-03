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

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SeekWell Database Setup Script.")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Drop and recreate all tables. DANGER: This will delete all data."
    )
    args = parser.parse_args()

    setup_database(reset=args.reset)
