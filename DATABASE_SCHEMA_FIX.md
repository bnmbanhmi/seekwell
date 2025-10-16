# 🔧 Database Schema Mismatch - FIXED

## Problem Identified

### Error:
```
psycopg.errors.DatatypeMismatch: column "class_role" is of type class but expression is of type character varying
```

### Root Cause:
The `patients.class_role` column in PostgreSQL database is of type `class` (a custom ENUM), but the Python code was trying to insert a string `"NORMAL"`.

**Database Schema:**
```sql
Column: class_role
Type: USER-DEFINED (ENUM)
Name: class
Values: ASSISTED, NORMAL, FREE, OTHER
```

**Python Code (Before Fix):**
```python
class_role = "NORMAL"  # ❌ String, not ENUM
```

---

## Solution Applied

### 1. Created PatientClass Enum

**File**: `backend/app/database.py`

```python
class PatientClass(str, enum.Enum):
    """Patient classification for legacy schema compatibility"""
    ASSISTED = "ASSISTED"
    NORMAL = "NORMAL"
    FREE = "FREE"
    OTHER = "OTHER"
```

### 2. Updated Patient Model

**File**: `backend/app/models.py`

**Before:**
```python
from .database import Gender, UserRole, Base
...
class_role = Column(String(50), nullable=True)  # ❌ Wrong type
```

**After:**
```python
from .database import Gender, UserRole, Base, PatientClass
...
class_role = Column(Enum(PatientClass), nullable=True)  # ✅ Correct ENUM type
```

### 3. Updated CRUD Function

**File**: `backend/app/crud.py`

**Before:**
```python
from .database import pwd_context, UserRole, Gender
...
class_role="NORMAL"  # ❌ String
```

**After:**
```python
from .database import pwd_context, UserRole, Gender, PatientClass
...
class_role=PatientClass.NORMAL  # ✅ ENUM value
```

---

## ⚠️ ACTION REQUIRED

### Restart Backend Server:

```bash
# In the terminal running backend (Python terminal):
# 1. Press Ctrl+C to stop
# 2. Restart with:
cd /Users/mac/Git/seekwell/backend
source .venv/bin/activate  # If not already activated
uvicorn app.main:app --reload
```

---

## ✅ Verification

After restarting backend, try registering again:

### Test Registration:
1. Name: "Bạch Nhật Minh"
2. Phone: "0975082804"
3. Password: "02122004"
4. Click: "BẮT ĐẦU"

### Expected Result:
```
✅ Account created successfully
✅ Auto-logged in
✅ Redirected to dashboard
```

### Check Backend Logs:
```
Registering user: 0975082804, email: 0975082804@seekwell.temp, ...
User created successfully: ID=38, Name=Bạch Nhật Minh, Role=PATIENT
INFO:     127.0.0.1 - "POST /auth/register/ HTTP/1.1" 200 OK
```

---

## 🔍 Files Modified

| File | Changes |
|------|---------|
| `backend/app/database.py` | ✅ Added `PatientClass` enum |
| `backend/app/models.py` | ✅ Updated `Patient.class_role` to use ENUM |
| `backend/app/crud.py` | ✅ Updated `create_user()` to use `PatientClass.NORMAL` |

---

## 📊 Database Schema Info

### PatientClass ENUM Values:
```
ASSISTED  - For patients receiving assistance
NORMAL    - Regular patients (default) ✅
FREE      - Free service patients
OTHER     - Other classifications
```

### Current Default:
- New patients are created with: `class_role = PatientClass.NORMAL`

---

## 🎯 What This Fix Does

### Before:
```python
# Python tries to insert string into ENUM column
db_patient = models.Patient(
    class_role="NORMAL"  # ❌ Type mismatch
)
# Database rejects: "expression is of type character varying"
```

### After:
```python
# Python correctly uses ENUM value
db_patient = models.Patient(
    class_role=PatientClass.NORMAL  # ✅ Correct type
)
# Database accepts: ENUM value matches column type
```

---

## 🚨 Common Issues

### Issue: "ModuleNotFoundError: No module named 'psycopg'"
**Solution:** Use backend virtual environment:
```bash
cd backend
source .venv/bin/activate
```

### Issue: Still getting same error after fix
**Solution:** Backend server not restarted. Must restart to load new code.

### Issue: Different database error
**Solution:** Check database schema matches:
```bash
cd backend
source .venv/bin/activate
python setup_seekwell_database.py
```

---

## 📝 Summary

✅ **Root cause**: Database column type (ENUM) vs Python type (String) mismatch  
✅ **Solution**: Created `PatientClass` enum and updated all references  
✅ **Status**: Code fixed, backend restart required  
⏳ **Next**: Restart backend → Test registration → Success!

---

## 🔄 Quick Test Checklist

After restarting backend:

- [ ] Backend starts without errors
- [ ] Can register new user (phone + name + password)
- [ ] Registration creates user in database
- [ ] Auto-login works after registration
- [ ] No more "DatatypeMismatch" errors

---

**Fix Applied**: October 16, 2025
**Status**: ✅ Complete - Awaiting backend restart
