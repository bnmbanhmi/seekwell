"""
Update existing doctors with proper values
"""
import sys
import os
from sqlalchemy import text, create_engine
from dotenv import load_dotenv

# Load environment variables
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
DOTENV_PATH = os.path.join(BACKEND_DIR, '.env')
load_dotenv(DOTENV_PATH)

sys.path.insert(0, BACKEND_DIR)

from app.config import settings

# Create engine with the database URL from settings
engine = create_engine(settings.DATABASE_URL)

def update_doctors():
    """Update existing doctors with proper values"""
    print("👨‍⚕️ Updating existing doctors...")
    
    try:
        with engine.connect() as conn:
            # Get the health center ID
            result = conn.execute(text("""
                SELECT center_id FROM community_health_centers LIMIT 1;
            """))
            center_id = result.scalar()
            
            if not center_id:
                print("❌ No health center found")
                return False
            
            # Update all doctors
            result = conn.execute(text("""
                UPDATE doctors 
                SET 
                    center_id = :center_id,
                    specialization = CASE 
                        WHEN specialization IS NULL OR specialization = '' 
                        THEN 'General Practice' 
                        ELSE specialization 
                    END,
                    is_community_health_worker = COALESCE(is_community_health_worker, FALSE)
                WHERE center_id IS NULL OR specialization IS NULL;
            """), {"center_id": center_id})
            
            print(f"✅ Updated {result.rowcount} doctors")
            
            # Verify the update
            result = conn.execute(text("""
                SELECT doctor_id, doctor_name, specialization, center_id, is_community_health_worker 
                FROM doctors LIMIT 5;
            """))
            
            doctors = result.fetchall()
            print("\n📋 Updated doctors:")
            for doctor in doctors:
                print(f"  ID: {doctor[0]}, Name: {doctor[1]}, Specialization: {doctor[2]}, Center: {doctor[3]}")
            
            return True
            
    except Exception as e:
        print(f"❌ Error updating doctors: {e}")
        return False

if __name__ == "__main__":
    print("🔧 SeekWell Doctor Update")
    print("=" * 40)
    success = update_doctors()
    print("=" * 40)
    if success:
        print("🎉 Doctors updated successfully!")
    else:
        print("❌ Update failed")
