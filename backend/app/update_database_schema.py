"""
Database schema update script for SeekWell
Adds LOCAL_CADRE role to existing UserRole enum
"""
import asyncio
import sys
import os
from sqlalchemy import text
from dotenv import load_dotenv

# Load environment variables
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
DOTENV_PATH = os.path.join(BACKEND_DIR, '.env')
load_dotenv(DOTENV_PATH)

sys.path.insert(0, BACKEND_DIR)

from app.database import engine

async def update_user_role_enum():
    """
    Update the UserRole enum to include LOCAL_CADRE
    """
    print("🔧 Updating database schema to include LOCAL_CADRE role...")
    
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
        print(f"❌ Error updating database schema: {e}")
        print("💡 This might happen if the enum doesn't exist yet or database is new")
        return False

async def verify_enum_values():
    """
    Verify all expected UserRole values exist
    """
    print("🔍 Verifying UserRole enum values...")
    
    try:
        async with engine.begin() as conn:
            result = await conn.execute(text("""
                SELECT enumlabel 
                FROM pg_enum 
                JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
                WHERE pg_type.typname = 'userrole'
                ORDER BY enumlabel
            """))
            
            enum_values = [row[0] for row in result.fetchall()]
            print(f"📋 Current UserRole values: {enum_values}")
            
            expected_values = ['ADMIN', 'DOCTOR', 'LOCAL_CADRE', 'PATIENT']
            missing_values = [v for v in expected_values if v not in enum_values]
            
            if missing_values:
                print(f"⚠️  Missing enum values: {missing_values}")
                return False
            else:
                print("✅ All expected UserRole values are present")
                return True
                
    except Exception as e:
        print(f"❌ Error verifying enum values: {e}")
        return False

async def main():
    print("🩺 SeekWell Database Schema Update")
    print("=" * 50)
    
    # Update the enum
    update_success = await update_user_role_enum()
    
    # Verify the update
    verify_success = await verify_enum_values()
    
    if update_success and verify_success:
        print("=" * 50)
        print("🎉 Database schema update completed successfully!")
        print("✅ Ready to run create_initial_admin.py")
    else:
        print("=" * 50)
        print("⚠️  Database schema update completed with issues")
        print("🔧 Please check the logs above")

if __name__ == "__main__":
    asyncio.run(main())
