# 🚀 Quick Start Guide - SeekWell Login Testing

## 🔥 CRITICAL: Restart Frontend Server

Your frontend is currently using old configuration. **You MUST restart it:**

### In the terminal running `npm start`:
```bash
# 1. Stop the server
Press: Ctrl + C

# 2. Start it again
npm start
```

**The browser will auto-reload to: http://localhost:3000**

---

## ✅ What Was Fixed

### Problem:
```
❌ Frontend connecting to: https://seekwell-backend.onrender.com
✅ Backend running at:     http://localhost:8000
```

### Solution:
Created `frontend/.env.local` to point frontend to local backend.

---

## 🧪 Test the Login (After Restart)

### Option 1: New User (Registration + Auto-Login)
```
1. Full Name:   Test User
2. Phone:       0999888777
3. Password:    test123
4. Click:       BẮT ĐẦU
5. Result:      ✅ Auto-registered → Auto-logged in → Dashboard
```

### Option 2: Demo Account (One Click)
```
1. Click:       Dùng thử không cần tài khoản
2. Result:      ✅ Instant login → Dashboard
```

### Option 3: Existing User Login
```
1. Full Name:   (leave empty)
2. Phone:       patient1@seekwell.health
3. Password:    PatientDemo2025
4. Click:       BẮT ĐẦU
5. Result:      ✅ Login → Dashboard
```

---

## 🔍 Verify Configuration

### After restarting frontend, check browser console:

You should see:
```javascript
🔧 API Configuration: {
  BACKEND_URL: "http://localhost:8000",  // ✅ NOT seekwell-backend.onrender.com
  ...
}
```

---

## 📊 System Status

### Backend Status: ✅ Running
```bash
curl http://localhost:8000/health
# Response: {"status":"healthy",...}
```

### CORS Configuration: ✅ Configured
```json
Allowed origins: [
  "http://localhost:3000",      ✅
  "http://127.0.0.1:3000",      ✅
  "https://seekwell.vercel.app" ✅
]
```

### Environment Files: ✅ Created
```
frontend/.env.local     ✅ Points to localhost:8000
frontend/.env.example   ✅ Template file
.gitignore             ✅ Already ignores .env files
```

---

## 🐛 If Problems Persist

### Check 1: Backend Running?
```bash
curl http://localhost:8000/health
```
- ✅ Should return: `{"status":"healthy",...}`
- ❌ If error: Start backend with `cd backend && uvicorn app.main:app --reload`

### Check 2: Frontend Restarted?
- ✅ Did you stop (Ctrl+C) and restart `npm start`?
- ❌ Environment variables only load on server start

### Check 3: Browser Console
- ✅ Check `🔧 API Configuration` log shows `localhost:8000`
- ❌ If shows `seekwell-backend.onrender.com`: Frontend not restarted

### Check 4: Database Setup?
```bash
cd backend
python3 setup_seekwell_database.py
```

---

## 📝 Expected Behavior

### New User Flow:
```
Enter Name + Phone + Password
    ↓
Click BẮT ĐẦU
    ↓
System tries login → 401 (user not found)
    ↓
System creates account automatically
    ↓
System logs in automatically
    ↓
Navigate to Dashboard ✅
```

### Existing User Flow:
```
Enter Phone + Password (skip name)
    ↓
Click BẮT ĐẦU
    ↓
System tries login → 200 (success)
    ↓
Navigate to Dashboard ✅
```

### Demo Flow:
```
Click "Dùng thử không cần tài khoản"
    ↓
Instant login with demo credentials
    ↓
Navigate to Dashboard ✅
```

---

## 🎯 Success Criteria

After restarting frontend:

- [ ] Browser console shows `BACKEND_URL: "http://localhost:8000"`
- [ ] Login attempts hit `http://localhost:8000` (not `.onrender.com`)
- [ ] No CORS errors in console
- [ ] Can create new user and auto-login
- [ ] Demo button works instantly

---

## 📚 Reference

- **Frontend Config**: `frontend/.env.local`
- **Backend Health**: `http://localhost:8000/health`
- **API Docs**: `http://localhost:8000/docs`
- **Fix Details**: `LOGIN_ISSUE_FIXED.md`

---

## ⚡ TL;DR

1. **Restart frontend server** (Ctrl+C, then `npm start`)
2. **Wait for browser to reload** (`http://localhost:3000`)
3. **Test login** with any of the 3 options above
4. **Should work!** ✅

---

**Status**: 🟡 Configuration fixed, waiting for frontend restart
**Next**: 🔄 Restart frontend → 🧪 Test login → ✅ Success!
