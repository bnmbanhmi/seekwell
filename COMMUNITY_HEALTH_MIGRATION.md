# Database Migration Guide - Phase 2

## Overview
This migration guide covers the changes needed to refactor the SeekWell system from hospital management to community health centers, and to support the enhanced community health workflow.

## Database Schema Changes

### 1. Community Health Center Migration

**Rename and Update Tables:**

```sql
-- Rename hospitals table to community_health_centers
ALTER TABLE hospitals RENAME TO community_health_centers;

-- Rename columns to match new structure
ALTER TABLE community_health_centers RENAME COLUMN hospital_id TO center_id;
ALTER TABLE community_health_centers RENAME COLUMN hospital_name TO center_name;
ALTER TABLE community_health_centers RENAME COLUMN governed_by TO region;

-- Add new column for center type
ALTER TABLE community_health_centers ADD COLUMN center_type VARCHAR(50);

-- Update doctors table to reference community health centers
ALTER TABLE doctors RENAME COLUMN hospital_id TO center_id;
ALTER TABLE doctors RENAME COLUMN major TO specialization;

-- Add community health worker flag
ALTER TABLE doctors ADD COLUMN is_community_health_worker BOOLEAN DEFAULT FALSE;

-- Update foreign key constraint
ALTER TABLE doctors DROP CONSTRAINT doctors_hospital_id_fkey;
ALTER TABLE doctors ADD CONSTRAINT doctors_center_id_fkey 
    FOREIGN KEY (center_id) REFERENCES community_health_centers(center_id) ON DELETE CASCADE;
```

### 2. Community Health Records Enhancement

**Add Community Health Visit Tracking:**

```sql
-- Create community health visits table
CREATE TABLE community_health_visits (
    visit_id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(patient_id) ON DELETE CASCADE,
    health_worker_id INTEGER REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    visit_time TIME NOT NULL,
    visit_type VARCHAR(20) CHECK (visit_type IN ('routine', 'high-risk', 'follow-up', 'ai-referral')),
    status VARCHAR(20) CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create community health metrics table
CREATE TABLE community_health_metrics (
    metric_id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(patient_id) ON DELETE CASCADE,
    visit_id INTEGER REFERENCES community_health_visits(visit_id) ON DELETE CASCADE,
    nutrition_status VARCHAR(20) CHECK (nutrition_status IN ('underweight', 'normal', 'overweight', 'obese')),
    immunization_status VARCHAR(20) CHECK (immunization_status IN ('up-to-date', 'partial', 'incomplete')),
    chronic_conditions JSONB,
    risk_factors JSONB,
    family_history JSONB,
    income_level VARCHAR(20),
    education_level VARCHAR(20),
    water_access VARCHAR(20),
    sanitation_access VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create enhanced vital signs table
CREATE TABLE vital_signs (
    vital_id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(patient_id) ON DELETE CASCADE,
    visit_id INTEGER REFERENCES community_health_visits(visit_id) ON DELETE CASCADE,
    weight DECIMAL(5,2),
    height INTEGER,
    bmi DECIMAL(4,1),
    blood_pressure VARCHAR(20),
    pulse_rate INTEGER,
    temperature DECIMAL(4,1),
    respiratory_rate INTEGER,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. AI Integration Enhancement

**Update AI Assessment for Community Health:**

```sql
-- Add community health context to AI assessments
ALTER TABLE ai_assessments ADD COLUMN community_context JSONB;
ALTER TABLE ai_assessments ADD COLUMN follow_up_required BOOLEAN DEFAULT FALSE;
ALTER TABLE ai_assessments ADD COLUMN referral_recommended BOOLEAN DEFAULT FALSE;
ALTER TABLE ai_assessments ADD COLUMN community_risk_factors JSONB;

-- Link AI assessments to community visits
ALTER TABLE ai_assessments ADD COLUMN visit_id INTEGER REFERENCES community_health_visits(visit_id);
```

### 4. Data Migration Script

**Migrate Existing Data:**

```sql
-- Update existing community health center data
UPDATE community_health_centers 
SET center_type = 'Regional Health Center' 
WHERE center_type IS NULL;

UPDATE community_health_centers 
SET region = 'Southeast Asia Region' 
WHERE region IS NULL OR region = '';

-- Mark existing doctors as community health workers where appropriate
UPDATE doctors 
SET is_community_health_worker = TRUE 
WHERE specialization LIKE '%Community%' OR specialization LIKE '%Public Health%';

-- Set default specialization for community health workers
UPDATE doctors 
SET specialization = 'Community Health' 
WHERE specialization IS NULL OR specialization = '';
```

## Backend API Updates

### New Endpoints to Implement:

1. **Community Health Centers:**
   - `GET /community-health-centers` - List all centers
   - `POST /community-health-centers` - Create new center
   - `PUT /community-health-centers/{id}` - Update center
   - `DELETE /community-health-centers/{id}` - Delete center

2. **Community Health Visits:**
   - `GET /community/visits` - List visits (with filtering)
   - `POST /community/visits` - Schedule new visit
   - `PUT /community/visits/{id}` - Update visit status
   - `GET /community/visits/{id}/metrics` - Get health metrics

3. **Enhanced EMR:**
   - `POST /community/health-records` - Create community health record
   - `GET /community/health-records/{patient_id}` - Get patient's community health history
   - `POST /community/vital-signs` - Record vital signs
   - `GET /community/statistics` - Get community health statistics

## Frontend Updates Completed

### New Components Added:
1. **CommunityHealthVisits** - Replaces traditional check-in/out with community health visit management
2. **CommunityHealthEMR** - Enhanced EMR with community health metrics and social determinants
3. **Updated Navigation** - Reflects community health focus

### Routing Updates:
- `/dashboard/community-health` - Community health visits management
- `/dashboard/community-emr` - Community health EMR

## Migration Steps

### Phase 1: Database Migration
1. Backup existing database
2. Run schema update scripts
3. Migrate existing data
4. Update foreign key constraints
5. Test data integrity

### Phase 2: Backend Updates
1. Update models to reflect new schema
2. Update CRUD operations
3. Add new community health endpoints
4. Update existing endpoints to use new models
5. Test API endpoints

### Phase 3: Frontend Integration
1. Update existing components to use new APIs
2. Test community health workflows
3. Update user roles and permissions
4. Test end-to-end functionality

## Testing Checklist

- [ ] Database migration completes without errors
- [ ] Existing data is preserved and properly migrated
- [ ] New community health visit workflow functions
- [ ] Enhanced EMR captures community health metrics
- [ ] AI integration works with community health context
- [ ] User roles have appropriate access to new features
- [ ] Navigation and routing work correctly
- [ ] All builds complete without errors

## Rollback Plan

If issues occur during migration:
1. Restore database from backup
2. Revert to previous backend version
3. Remove new frontend components from routing
4. Test core functionality
5. Investigate and fix issues before re-attempting migration

## Next Steps

After successful migration:
1. Train users on new community health workflows
2. Monitor system performance with new features
3. Gather feedback on community health metrics
4. Plan additional enhancements based on usage patterns
5. Consider adding community health analytics and reporting features
