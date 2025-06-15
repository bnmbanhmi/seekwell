"""
Simple database enum update script for Render deployment
Adds LOCAL_CADRE to UserRole enum if it doesn't exist
"""
import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def update_enum():
    """Update UserRole enum to include LOCAL_CADRE"""
    
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL environment variable not found")
        return False
    
    try:
        print("🔗 Connecting to database...")
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # Check if LOCAL_CADRE already exists
        print("🔍 Checking if LOCAL_CADRE enum value exists...")
        cursor.execute("""
            SELECT enumlabel 
            FROM pg_enum 
            JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
            WHERE pg_type.typname = 'userrole' 
            AND enumlabel = 'LOCAL_CADRE'
        """)
        
        existing = cursor.fetchone()
        
        if existing:
            print("✅ LOCAL_CADRE enum value already exists")
            return True
        
        # Add LOCAL_CADRE to the enum
        print("📝 Adding LOCAL_CADRE to UserRole enum...")
        cursor.execute("ALTER TYPE userrole ADD VALUE 'LOCAL_CADRE'")
        conn.commit()
        
        print("✅ Successfully added LOCAL_CADRE to UserRole enum")
        
        # Verify the addition
        cursor.execute("""
            SELECT enumlabel 
            FROM pg_enum 
            JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
            WHERE pg_type.typname = 'userrole'
            ORDER BY enumlabel
        """)
        
        enum_values = [row[0] for row in cursor.fetchall()]
        print(f"📋 Current UserRole enum values: {enum_values}")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Error updating enum: {e}")
        print("💡 This is normal for new databases where enum will be created fresh")
        return False

if __name__ == "__main__":
    print("🩺 SeekWell Database Enum Update")
    print("=" * 40)
    
    success = update_enum()
    
    if success:
        print("=" * 40)
        print("🎉 Database enum update completed!")
        print("✅ You can now run create_initial_admin.py")
    else:
        print("=" * 40)
        print("⚠️  Could not update enum")
        print("💡 This might be expected for new databases")
        print("🔧 Try running create_initial_admin.py anyway")
