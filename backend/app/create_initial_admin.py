import sys
import os
import asyncio
from dotenv import load_dotenv # Import load_dotenv

# Load .env file from the backend directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
DOTENV_PATH = os.path.join(BACKEND_DIR, '.env')
load_dotenv(DOTENV_PATH)

sys.path.insert(0, BACKEND_DIR) # Add backend directory to sys.path

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, UserRole, create_db_and_tables
from app import crud, schemas, models

# Ensure tables are created (especially if running this standalone for the first time)
# In a real scenario with Alembic, you'd run migrations first.
# For this script, we'll call the function you have in main.py
async def create_first_admin():
    db: Session = SessionLocal()
    try:
        print("Attempting to create the first admin user...")

        # --- Admin User Details ---
        # You can hardcode these or use input() for more flexibility
        admin_username = "bnmbanhmi"
        admin_email = "bachnhatminh0212@gmail.com"
        admin_password = "02122004" # Change this!
        admin_full_name = "Super Administrator"
        # --- End Admin User Details ---

        # Check if admin already exists
        existing_admin_by_username = crud.get_user_by_username(db, username=admin_username)
        if existing_admin_by_username:
            print(f"Admin user with username '{admin_username}' already exists.")
            return

        if admin_email:
            existing_admin_by_email = crud.get_user_by_email(db, email=admin_email)
            if existing_admin_by_email:
                print(f"Admin user with email '{admin_email}' already exists.")
                return

        user_in = schemas.UserCreate(
            username=admin_username,
            email=admin_email,
            password=admin_password,
            full_name=admin_full_name,
            role=UserRole.ADMIN  # Pass the Enum member directly
        )

        admin_user = crud.create_user(db=db, user=user_in)
        print(f"Admin user '{admin_user.username}' created successfully with ID: {admin_user.user_id} and Role: {admin_user.role.value}")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        db.close()

async def main():
    create_db_and_tables()
    await create_first_admin()

if __name__ == "__main__":
    asyncio.run(main())
