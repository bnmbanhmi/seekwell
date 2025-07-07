# SeekWell Database Initialization Guide

**Single Script for Complete Database Setup**

---

## 📋 Overview

The SeekWell platform uses a **single, comprehensive initialization script** that handles all database setup tasks. This consolidated approach replaces multiple legacy scripts and provides a reliable, one-command setup process.

## 🎯 Primary Script

### `setup_seekwell_database.py`

**Location**: `/backend/setup_seekwell_database.py`

This is the **only script you need** for database initialization. It handles:

- ✅ Database schema creation and updates
- ✅ Missing column fixes and foreign key constraints  
- ✅ Enum value updates (LOCAL_CADRE role)
- ✅ Initial admin and user account creation
- ✅ Community health center setup
- ✅ Sample data population
- ✅ Schema verification and health checks

---

## 🚀 Usage

### Standard Setup (Recommended)
```bash
cd backend
python setup_seekwell_database.py
```

This will:
1. Create/update database schema
2. Fix any missing columns or constraints
3. Add LOCAL_CADRE enum value
4. Create initial users (admin, doctors, cadres, patients)
5. Set up default community health center
6. Verify everything works correctly

### Schema-Only Setup
```bash
cd backend
python setup_seekwell_database.py --skip-users --verbose
```

Use this when you only want to update the database schema without creating users.

### Full Reset (⚠️ DANGER)
```bash
cd backend
python setup_seekwell_database.py --reset --verbose
```

**WARNING**: This will destroy all existing data and recreate the database from scratch.

### Available Options
- `--reset` - Drop and recreate all tables (destroys all data)
- `--skip-users` - Skip user creation, only fix schema issues
- `--verbose` - Show detailed output during setup

---

## 👥 Created Users

The script creates a complete set of initial users for testing and deployment:

### 🔧 System Administrator
- **Email**: `admin@seekwell.health`
- **Password**: `SeekWell2025!`
- **Role**: ADMIN

### 👩‍⚕️ Specialist Doctors (3)
- **Dermatologist**: `dermatologist@seekwell.health` / `DermExpert2025`
- **Oncologist**: `oncologist@seekwell.health` / `OncoSpecialist2025`
- **Pathologist**: `pathologist@seekwell.health` / `PathExpert2025`

### 🤝 Community Health Workers (4)
- **Thailand**: `cadre.thailand@seekwell.health` / `CadreThailand2025`
- **Indonesia**: `cadre.indonesia@seekwell.health` / `CadreIndonesia2025`
- **Philippines**: `cadre.philippines@seekwell.health` / `CadrePhilippines2025`
- **Vietnam**: `cadre.vietnam@seekwell.health` / `CadreVietnam2025`

### 👥 Demo Patients (5)
- **All patients**: Password `PatientDemo2025`
- **Emails**: `patient1@seekwell.health` through `patient5@seekwell.health`

---

## 🏥 Healthcare Infrastructure

### Community Health Center
- **Name**: SeekWell Regional Community Health Center
- **Location**: ASEAN Digital Health Hub, Southeast Asia
- **Type**: Regional Community Health Center

All doctors and cadres are automatically associated with this health center.

---

## 🔧 VS Code Tasks

Use these predefined tasks in VS Code for easy database management:

1. **SeekWell: Complete Database Setup** - Full initialization
2. **SeekWell: Database Schema Fix Only** - Schema updates only
3. **SeekWell: Reset Database (DANGER)** - Complete reset

---

## 📊 Database Schema

### Core Tables Created
- `users` - Authentication and role management
- `patients` - Patient demographics and health data
- `doctors` - Doctor profiles and specializations
- `community_health_centers` - Healthcare facilities
- `appointments` - Healthcare scheduling
- `medical_reports` - Electronic medical records
- `chat_messages` - Integrated communication
- `skin_lesion_images` - AI analysis images and metadata
- `ai_assessments` - AI analysis results and confidence
- `cadre_reviews` - Community health worker reviews
- `doctor_consultations` - Professional medical assessments
- `body_regions` - Anatomical region definitions

### User Roles Enum
- `ADMIN` - System administrators
- `DOCTOR` - Medical professionals
- `PATIENT` - Healthcare patients
- `LOCAL_CADRE` - Community health workers

---

## ⚠️ Important Notes

### Environment Variables Required
Ensure your `.env` file contains:
```env
DATABASE_URL=postgresql://user:password@host:port/database
SECRET_KEY=your-secret-key
```

### First-Time Setup
1. Ensure PostgreSQL is running
2. Create an empty database
3. Set DATABASE_URL in your `.env` file
4. Run the setup script

### Troubleshooting
- **Connection Error**: Verify DATABASE_URL and PostgreSQL service
- **Permission Error**: Ensure database user has CREATE/ALTER privileges
- **Enum Error**: Normal for new databases, script handles this automatically

---

## 📁 Legacy Scripts (Moved)

The following files have been moved to `/backend/legacy_scripts/` and are **no longer needed**:

- ❌ `create_initial_admin.py` - Replaced by comprehensive setup script
- ❌ `update_database_schema.py` - Schema updates now handled automatically

**Do not use these legacy scripts** - they may cause conflicts or incomplete setup.

---

## 🔄 Migration Files

Migration files in `/backend/database/migrations/` are kept for reference:
- `add_ai_tables.py` - AI-related table definitions
- `add_emr_summary_to_patients.py` - EMR enhancements

These are **automatically applied** by the main setup script and don't need to be run manually.

---

## ✅ Verification

After running the setup script, verify success by:

1. **Check user counts**: Script shows user distribution by role
2. **Test login**: Try logging in with admin credentials
3. **Database query**: Verify tables exist and have data
4. **Health check**: API `/health` endpoint should show database as connected

---

## 🎯 Production Deployment

For production environments:

1. Use a dedicated PostgreSQL database
2. Set strong passwords in environment variables
3. Run setup script once during initial deployment
4. Use `--skip-users` flag for schema-only updates
5. Never use `--reset` in production

---

## 📞 Support

If you encounter issues with database initialization:

1. Check PostgreSQL logs
2. Verify environment variables
3. Ensure database permissions
4. Run with `--verbose` flag for detailed output
5. Check `/backend/legacy_scripts/` if you need to reference old implementations

---

**🌟 The SeekWell database is now ready for AI-powered healthcare delivery across ASEAN communities!**
