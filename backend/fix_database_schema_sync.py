"""
Database schema inspection and fix script for SeekWell (Synchronous version)
Checks current database structure and adds missing columns
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

def inspect_doctors_table():
    """
    Inspect the current structure of the doctors table
    """
    print("🔍 Inspecting doctors table structure...")
    
    try:
        with engine.connect() as conn:
            # Get column information for doctors table
            result = conn.execute(text("""
                SELECT 
                    column_name, 
                    data_type, 
                    is_nullable, 
                    column_default
                FROM information_schema.columns 
                WHERE table_name = 'doctors' 
                ORDER BY ordinal_position;
            """))
            
            columns = result.fetchall()
            
            if not columns:
                print("❌ Doctors table does not exist!")
                return False
            
            print("\n📋 Current doctors table structure:")
            print("-" * 60)
            for col in columns:
                column_name, data_type, is_nullable, column_default = col
                nullable = "NULL" if is_nullable == "YES" else "NOT NULL"
                default = f" DEFAULT {column_default}" if column_default else ""
                print(f"  {column_name:25} {data_type:15} {nullable}{default}")
            
            # Check if specialization column exists
            column_names = [col[0] for col in columns]
            return 'specialization' in column_names
            
    except Exception as e:
        print(f"❌ Error inspecting doctors table: {e}")
        return False

def add_missing_columns():
    """
    Add missing columns to the doctors table
    """
    print("\n🔧 Adding missing columns to doctors table...")
    
    try:
        with engine.connect() as conn:
            # Start a transaction
            trans = conn.begin()
            
            try:
                # Add specialization column if it doesn't exist
                print("📝 Adding specialization column...")
                conn.execute(text("""
                    ALTER TABLE doctors 
                    ADD COLUMN IF NOT EXISTS specialization VARCHAR(160);
                """))
                
                # Add center_id column if it doesn't exist
                print("📝 Adding center_id column...")
                conn.execute(text("""
                    ALTER TABLE doctors 
                    ADD COLUMN IF NOT EXISTS center_id INTEGER;
                """))
                
                # Add is_community_health_worker column if it doesn't exist
                print("📝 Adding is_community_health_worker column...")
                conn.execute(text("""
                    ALTER TABLE doctors 
                    ADD COLUMN IF NOT EXISTS is_community_health_worker BOOLEAN DEFAULT FALSE;
                """))
                
                trans.commit()
                print("✅ Successfully added missing columns")
                return True
                
            except Exception as e:
                trans.rollback()
                raise e
            
    except Exception as e:
        print(f"❌ Error adding columns: {e}")
        return False

def ensure_community_health_centers_table():
    """
    Create community_health_centers table if it doesn't exist
    """
    print("\n🏥 Ensuring community_health_centers table exists...")
    
    try:
        with engine.connect() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS community_health_centers (
                    center_id SERIAL PRIMARY KEY,
                    center_name VARCHAR(100),
                    address VARCHAR(255),
                    region VARCHAR(160),
                    center_type VARCHAR(50)
                );
            """))
            
            print("✅ community_health_centers table ready")
            return True
            
    except Exception as e:
        print(f"❌ Error creating community_health_centers table: {e}")
        return False

def add_foreign_key_constraints():
    """
    Add foreign key constraints if they don't exist
    """
    print("\n🔗 Adding foreign key constraints...")
    
    try:
        with engine.connect() as conn:
            # Check if constraint already exists
            result = conn.execute(text("""
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_name = 'doctors' 
                AND constraint_name = 'fk_doctors_center_id';
            """))
            
            if result.fetchone():
                print("✅ Foreign key constraint already exists")
                return True
            
            # Add foreign key for center_id
            print("📝 Adding foreign key constraint for center_id...")
            conn.execute(text("""
                ALTER TABLE doctors 
                ADD CONSTRAINT fk_doctors_center_id 
                FOREIGN KEY (center_id) 
                REFERENCES community_health_centers(center_id) 
                ON DELETE CASCADE;
            """))
            
            print("✅ Foreign key constraints added")
            return True
            
    except Exception as e:
        print(f"❌ Error adding foreign key constraints: {e}")
        print("💡 This might be normal if the constraint already exists")
        return True  # Return True as this is not critical

def create_sample_health_center():
    """
    Create a sample health center for testing
    """
    print("\n🏥 Creating sample health center...")
    
    try:
        with engine.connect() as conn:
            # Check if any health centers exist
            result = conn.execute(text("""
                SELECT COUNT(*) FROM community_health_centers;
            """))
            count = result.scalar()
            
            if count == 0:
                # Create a default health center
                conn.execute(text("""
                    INSERT INTO community_health_centers 
                    (center_name, address, region, center_type)
                    VALUES 
                    ('Default Community Health Center', 'Main Street', 'Central District', 'Primary Care Center');
                """))
                print("✅ Created sample health center")
            else:
                print(f"✅ {count} health center(s) already exist")
            
            return True
            
    except Exception as e:
        print(f"❌ Error creating sample health center: {e}")
        return False

def update_existing_doctors():
    """
    Update existing doctors with default values
    """
    print("\n👨‍⚕️ Updating existing doctors with default values...")
    
    try:
        with engine.connect() as conn:
            # Get the first health center ID
            result = conn.execute(text("""
                SELECT center_id FROM community_health_centers LIMIT 1;
            """))
            center_id = result.scalar()
            
            if center_id:
                # Update doctors with null center_id
                result = conn.execute(text("""
                    UPDATE doctors 
                    SET center_id = :center_id,
                        specialization = COALESCE(specialization, 'General Practice'),
                        is_community_health_worker = COALESCE(is_community_health_worker, FALSE)
                    WHERE center_id IS NULL;
                """), {"center_id": center_id})
                
                print(f"✅ Updated {result.rowcount} doctors with default values")
            else:
                print("⚠️  No health centers found to assign to doctors")
            
            return True
            
    except Exception as e:
        print(f"❌ Error updating existing doctors: {e}")
        return False

def verify_fix():
    """
    Verify that the fix worked
    """
    print("\n✅ Verifying database fix...")
    
    try:
        with engine.connect() as conn:
            # Try the query that was failing
            result = conn.execute(text("""
                SELECT doctor_id, doctor_name, specialization, center_id, is_community_health_worker 
                FROM doctors 
                LIMIT 5;
            """))
            
            doctors = result.fetchall()
            print(f"📋 Successfully queried {len(doctors)} doctors")
            
            for doctor in doctors:
                print(f"  Doctor ID: {doctor[0]}, Name: {doctor[1]}, Specialization: {doctor[2]}")
            
            return True
            
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False

def main():
    print("🩺 SeekWell Database Schema Fix")
    print("=" * 50)
    
    try:
        # Step 1: Inspect current structure
        has_specialization = inspect_doctors_table()
        
        # Step 2: Create health centers table
        ensure_community_health_centers_table()
        
        # Step 3: Add missing columns if needed
        if not has_specialization:
            add_missing_columns()
            add_foreign_key_constraints()
            create_sample_health_center()
            update_existing_doctors()
        else:
            print("\n✅ All required columns already exist")
            # Still need to ensure health center exists
            create_sample_health_center()
        
        # Step 4: Verify the fix
        success = verify_fix()
        
        print("=" * 50)
        if success:
            print("🎉 Database schema fix completed successfully!")
            print("✅ You should now be able to load appointment slots")
        else:
            print("⚠️  Database schema fix completed with issues")
            print("🔧 Please check the logs above")
            
    except Exception as e:
        print(f"💥 Critical error: {e}")
        print("🔧 Please check your database connection and try again")

if __name__ == "__main__":
    main()
