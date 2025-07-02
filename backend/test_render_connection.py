#!/usr/bin/env python3
"""
Test script for Render PostgreSQL connection
Run this after updating your .env file with the actual Render database URL
"""

import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_render_database():
    """Test connection to Render PostgreSQL database"""
    
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("❌ ERROR: DATABASE_URL not found in environment variables")
        return False
        
    if "REPLACE_WITH_RENDER" in database_url:
        print("❌ ERROR: Please update DATABASE_URL with actual Render database credentials")
        print("   Current URL:", database_url)
        print("\n📋 Steps to get your Render database URL:")
        print("1. Go to render.com → Your PostgreSQL service")
        print("2. Copy the 'Internal Database URL'")
        print("3. Replace the DATABASE_URL in .env file")
        return False
    
    print(f"🔗 Testing connection to: {database_url.split('@')[0]}@{database_url.split('@')[1].split(':')[0]}:****")
    
    try:
        # Create engine and test connection
        engine = create_engine(database_url)
        
        with engine.connect() as connection:
            # Test basic query
            result = connection.execute(text("SELECT version();"))
            version = result.fetchone()[0]
            
            print("✅ DATABASE CONNECTION SUCCESSFUL!")
            print(f"📊 PostgreSQL Version: {version}")
            
            # Check if this is a fresh database
            tables_result = connection.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public';
            """))
            
            tables = [row[0] for row in tables_result.fetchall()]
            
            if not tables:
                print("📝 Database is empty - ready for fresh setup")
                print("🚀 Run: python setup_seekwell_database.py")
            else:
                print(f"📋 Found {len(tables)} existing tables: {', '.join(tables)}")
                print("⚠️  If you want fresh setup, run: python setup_seekwell_database.py --reset")
            
            return True
            
    except Exception as e:
        print(f"❌ DATABASE CONNECTION FAILED: {str(e)}")
        print("\n🔧 Troubleshooting:")
        print("1. Verify DATABASE_URL is correct")
        print("2. Check if Render database is running")
        print("3. Ensure you're using the Internal Database URL (not External)")
        return False

if __name__ == "__main__":
    print("🩺 SeekWell - Render Database Connection Test")
    print("=" * 50)
    test_render_database()
