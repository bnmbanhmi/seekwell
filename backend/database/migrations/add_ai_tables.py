"""
Database migration for AI skin lesion analysis features
Adds tables for skin lesion images, AI assessments, cadre reviews, and doctor consultations
"""

from sqlalchemy import text
from sqlalchemy.engine import Engine

def upgrade(engine: Engine) -> None:
    """Apply the migration - create AI-related tables"""
    
    with engine.connect() as conn:
        # Create skin_lesion_images table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS skin_lesion_images (
                image_id SERIAL PRIMARY KEY,
                patient_id INTEGER REFERENCES patients(patient_id) ON DELETE CASCADE,
                image_path VARCHAR(500) NOT NULL,
                image_data TEXT,
                upload_timestamp TIMESTAMP DEFAULT NOW(),
                body_region VARCHAR(100),
                ai_prediction VARCHAR(200),
                confidence_score FLOAT,
                needs_professional_review BOOLEAN DEFAULT FALSE,
                reviewed_by_cadre INTEGER REFERENCES users(user_id),
                reviewed_by_doctor INTEGER REFERENCES doctors(doctor_id),
                status VARCHAR(50) DEFAULT 'pending',
                notes TEXT
            );
        """))
        
        # Create ai_assessments table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS ai_assessments (
                assessment_id SERIAL PRIMARY KEY,
                image_id INTEGER REFERENCES skin_lesion_images(image_id) ON DELETE CASCADE,
                risk_level VARCHAR(50),
                confidence_level VARCHAR(50),
                predicted_class VARCHAR(100),
                all_predictions TEXT,
                recommendations TEXT,
                follow_up_needed BOOLEAN DEFAULT FALSE,
                follow_up_days INTEGER,
                created_at TIMESTAMP DEFAULT NOW()
            );
        """))
        
        # Create body_regions table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS body_regions (
                region_id SERIAL PRIMARY KEY,
                region_name VARCHAR(100) NOT NULL UNIQUE,
                region_description TEXT,
                is_high_risk BOOLEAN DEFAULT FALSE
            );
        """))
        
        # Create cadre_reviews table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS cadre_reviews (
                review_id SERIAL PRIMARY KEY,
                image_id INTEGER REFERENCES skin_lesion_images(image_id) ON DELETE CASCADE,
                cadre_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                review_notes TEXT,
                agrees_with_ai BOOLEAN,
                escalate_to_doctor BOOLEAN DEFAULT FALSE,
                local_recommendations TEXT,
                review_timestamp TIMESTAMP DEFAULT NOW()
            );
        """))
        
        # Create doctor_consultations table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS doctor_consultations (
                consultation_id SERIAL PRIMARY KEY,
                image_id INTEGER REFERENCES skin_lesion_images(image_id) ON DELETE CASCADE,
                doctor_id INTEGER REFERENCES doctors(doctor_id) ON DELETE CASCADE,
                diagnosis TEXT NOT NULL,
                treatment_plan TEXT,
                urgency_level VARCHAR(50),
                requires_specialist BOOLEAN DEFAULT FALSE,
                specialist_type VARCHAR(100),
                follow_up_days INTEGER,
                prescription TEXT,
                consultation_timestamp TIMESTAMP DEFAULT NOW()
            );
        """))
        
        # Insert default body regions
        conn.execute(text("""
            INSERT INTO body_regions (region_name, region_description, is_high_risk) VALUES
            ('face', 'Face and facial features', TRUE),
            ('neck', 'Neck area', TRUE),
            ('chest', 'Chest and upper torso', FALSE),
            ('back', 'Back area', FALSE),
            ('arms', 'Arms and shoulders', FALSE),
            ('hands', 'Hands and fingers', TRUE),
            ('abdomen', 'Abdominal area', FALSE),
            ('legs', 'Legs and thighs', FALSE),
            ('feet', 'Feet and toes', TRUE),
            ('genitals', 'Genital area', TRUE),
            ('other', 'Other or unspecified location', FALSE)
            ON CONFLICT (region_name) DO NOTHING;
        """))
        
        # Create indexes for better performance
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_skin_lesion_patient ON skin_lesion_images(patient_id);
            CREATE INDEX IF NOT EXISTS idx_skin_lesion_status ON skin_lesion_images(status);
            CREATE INDEX IF NOT EXISTS idx_skin_lesion_upload_time ON skin_lesion_images(upload_timestamp);
            CREATE INDEX IF NOT EXISTS idx_ai_assessment_image ON ai_assessments(image_id);
            CREATE INDEX IF NOT EXISTS idx_cadre_review_image ON cadre_reviews(image_id);
            CREATE INDEX IF NOT EXISTS idx_doctor_consultation_image ON doctor_consultations(image_id);
        """))
        
        conn.commit()
        print("✅ AI-related tables created successfully!")

def downgrade(engine: Engine) -> None:
    """Rollback the migration - drop AI-related tables"""
    
    with engine.connect() as conn:
        # Drop tables in reverse order to handle foreign key constraints
        tables_to_drop = [
            "doctor_consultations",
            "cadre_reviews", 
            "ai_assessments",
            "skin_lesion_images",
            "body_regions"
        ]
        
        for table in tables_to_drop:
            conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE;"))
        
        conn.commit()
        print("✅ AI-related tables dropped successfully!")

# For standalone execution
if __name__ == "__main__":
    from sqlalchemy import create_engine
    from ...app.config import settings
    
    engine = create_engine(settings.DATABASE_URL)
    
    print("Running AI tables migration...")
    upgrade(engine)
    print("Migration completed!")
