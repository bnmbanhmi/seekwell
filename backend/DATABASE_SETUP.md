# SeekWell Database Setup & Initialization

This unified script handles complete database setup for the SeekWell AI-powered community health platform.

## Overview

The `setup_seekwell_database.py` script combines all database initialization tasks into a single, comprehensive tool:

- ✅ **Database schema creation and updates**
- ✅ **Missing column fixes and foreign key constraints**
- ✅ **Enum updates (LOCAL_CADRE role support)**
- ✅ **Initial admin and user account creation**
- ✅ **Community health center setup**
- ✅ **Sample data population for testing**
- ✅ **Comprehensive verification and error handling**

## Quick Start

### Option 1: Use VS Code Tasks (Recommended)

1. Open VS Code in the SeekWell project
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "Tasks: Run Task"
4. Select "**SeekWell: Complete Database Setup**"

### Option 2: Command Line

```bash
cd backend
python setup_seekwell_database.py
```

## Usage Options

### Complete Setup (Default)
```bash
python setup_seekwell_database.py
```
- Creates/updates database schema
- Fixes missing columns and constraints  
- Creates initial users and health centers
- **Recommended for new installations**

### Schema Fix Only
```bash
python setup_seekwell_database.py --skip-users
```
- Only fixes database schema issues
- Doesn't create or modify user accounts
- **Use when you have database structure issues**

### Verbose Output
```bash
python setup_seekwell_database.py --verbose
```
- Shows detailed progress and debugging information
- **Recommended when troubleshooting**

### Reset Database (⚠️ DANGER)
```bash
python setup_seekwell_database.py --reset
```
- **DESTROYS ALL DATA** - Drops and recreates all tables
- Requires confirmation ("YES")
- **Only use for complete fresh start**

## What Gets Created

### Database Schema
- All required tables with proper relationships
- Missing columns added to existing tables:
  - `doctors.specialization` - Medical specialization field
  - `doctors.center_id` - Links doctors to health centers
  - `doctors.is_community_health_worker` - Distinguishes CHWs from doctors
- Foreign key constraints for data integrity
- Updated enums (LOCAL_CADRE role support)

### Community Health Infrastructure
- **1 Regional Health Center**: "SeekWell Regional Community Health Center"
- Proper relationships between health centers and health workers

### Initial User Accounts

#### System Administrator
- **Email**: admin@seekwell.health
- **Password**: SeekWell2025!
- **Role**: ADMIN
- Full platform management access

#### Specialist Doctors (3)
- **Dr. Maria Santos** (Dermatologist): dermatologist@seekwell.health / DermExpert2025
- **Dr. James Chen** (Oncologist): oncologist@seekwell.health / OncoSpecialist2025  
- **Dr. Priya Sharma** (Pathologist): pathologist@seekwell.health / PathExpert2025

#### Community Health Workers (4)
- **Thailand CHW**: cadre.thailand@seekwell.health / CadreThailand2025
- **Indonesia CHW**: cadre.indonesia@seekwell.health / CadreIndonesia2025
- **Philippines CHW**: cadre.philippines@seekwell.health / CadrePhilippines2025
- **Vietnam CHW**: cadre.vietnam@seekwell.health / CadreVietnam2025

#### Demo Patients (5)
- **Ahmad Rahman** (Malaysia): patient1@seekwell.health / PatientDemo2025
- **Siti Nurhaliza** (Indonesia): patient2@seekwell.health / PatientDemo2025
- **Jose Rizal Jr.** (Philippines): patient3@seekwell.health / PatientDemo2025
- **Somchai Jaidee** (Thailand): patient4@seekwell.health / PatientDemo2025
- **Tran Thi Mai** (Vietnam): patient5@seekwell.health / PatientDemo2025

## Troubleshooting

### Common Issues

#### "Database connection failed"
- Check your DATABASE_URL in `.env`
- Ensure PostgreSQL is running
- Verify database credentials

#### "Column does not exist" errors
```bash
python setup_seekwell_database.py --skip-users --verbose
```

#### "Enum value does not exist" errors
```bash
python setup_seekwell_database.py --verbose
```

#### Need fresh start
```bash
python setup_seekwell_database.py --reset
# Type "YES" when prompted
```

### Error Recovery

The script is designed to be **idempotent** - you can run it multiple times safely:
- Existing data is preserved
- Missing components are added
- No duplicate creation errors

## Advanced Usage

### Environment Variables Required
```env
DATABASE_URL=postgresql://username:password@localhost:5432/seekwell_db
```

### Prerequisites
- PostgreSQL database running
- Python environment with required packages:
  - SQLAlchemy
  - psycopg2
  - passlib
  - python-dotenv

### Integration with Existing Data
- Script preserves existing users and data
- Only adds missing schema elements
- Updates existing records with default values when needed

## VS Code Tasks Available

| Task Name | Description |
|-----------|-------------|
| **SeekWell: Complete Database Setup** | Full initialization (recommended) |
| **SeekWell: Database Schema Fix Only** | Schema fixes without user creation |
| **SeekWell: Reset Database (DANGER)** | Complete reset (destroys all data) |
| **Initialize Database (Legacy)** | Old script (deprecated) |

## Migration from Legacy Scripts

This script replaces several older scripts:
- `create_initial_admin.py` (legacy)
- `update_database_schema.py` (legacy)
- `fix_database_schema_sync.py` (legacy)
- Manual SQL fixes

**Migration Steps:**
1. Run the new script: `python setup_seekwell_database.py`
2. Verify everything works
3. Remove old scripts (optional)

## Success Indicators

When the script completes successfully, you should see:
- ✅ Database connection successful
- ✅ Schema created/updated
- ✅ All required columns present
- ✅ Enum values updated
- ✅ Users created
- ✅ Verification passed
- 🎉 Setup completed message

## Next Steps After Setup

1. ✅ **Database is ready** - Users can log in
2. 🤖 **Configure AI model endpoints** - HuggingFace integration
3. 🔗 **Set up environment variables** - API keys, secrets
4. 🌐 **Deploy to production** - Cloud deployment
5. 📚 **Train staff** - Local cadres and doctors
6. 🎯 **Begin pilot deployment** - ASEAN communities

## Support

If you encounter issues:
1. Run with `--verbose` flag for detailed output
2. Check the error messages for specific guidance
3. Verify your environment variables and database connection
4. For persistent issues, try the `--reset` option (⚠️ destroys data)

---

🩺 **SeekWell** - AI-Powered Community Health for ASEAN
🌍 Serving rural and underserved communities across Southeast Asia
