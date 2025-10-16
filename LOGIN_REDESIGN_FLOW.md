# Login Page - User Flow Diagrams

## 🔄 Unified Login/Signup Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     USER OPENS PAGE                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Page loads in Vietnamese                        │
│         Shows: "Bắt đầu kiểm tra da"                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
                    ┌────────┐
                    │ User?  │
                    └────┬───┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   NEW USER        RETURNING USER     DEMO USER
        │                │                │
        ▼                ▼                ▼
```

---

## 🆕 New User Journey

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User enters Full Name                                     │
│    Input: "Nguyễn Văn A"                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. User enters Phone Number                                  │
│    Input: "0123456789"                                       │
│    Keyboard: Numeric keypad appears automatically            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. User creates Password                                     │
│    Input: "password123" (visible as typed)                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. User clicks "BẮT ĐẦU"                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. System attempts login                                     │
│    POST /auth/token                                          │
│    username: "0123456789"                                    │
│    password: "password123"                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
                    ┌────────┐
                    │ 401 ❌ │ (User not found)
                    └────┬───┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. System creates new account                                │
│    POST /auth/register/                                      │
│    {                                                         │
│      username: "0123456789",                                │
│      email: "0123456789@seekwell.temp",                     │
│      full_name: "Nguyễn Văn A",                             │
│      password: "password123",                               │
│      role: "PATIENT"                                        │
│    }                                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
                    ┌────────┐
                    │ 200 ✅ │ (Account created)
                    └────┬───┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. System auto-logs in new user                              │
│    POST /auth/token                                          │
│    username: "0123456789"                                    │
│    password: "password123"                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
                    ┌────────┐
                    │ 200 ✅ │ (Login successful)
                    └────┬───┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Store tokens in localStorage                              │
│    - accessToken                                             │
│    - role: "PATIENT"                                         │
│    - user_id                                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Show success toast                                        │
│    "Chào mừng đến với SeekWell! 🎉"                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. Navigate to Dashboard                                    │
│     navigate('/dashboard')                                   │
└─────────────────────────────────────────────────────────────┘

Total Steps: 4 user actions → Automatic account creation
Time: ~5 seconds
```

---

## 🔑 Returning User Journey

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User SKIPS Full Name field                                │
│    (Leaves it empty)                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. User enters Phone Number                                  │
│    Input: "0123456789"                                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. User enters Password                                      │
│    Input: "password123"                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. User clicks "BẮT ĐẦU"                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. System attempts login                                     │
│    POST /auth/token                                          │
│    username: "0123456789"                                    │
│    password: "password123"                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
                    ┌────────┐
                    │ 200 ✅ │ (User found & password correct)
                    └────┬───┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Store tokens in localStorage                              │
│    - accessToken                                             │
│    - role                                                    │
│    - user_id                                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Show success toast                                        │
│    "Chào mừng đến với SeekWell! 🎉"                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Navigate to Dashboard                                     │
│    navigate('/dashboard')                                    │
└─────────────────────────────────────────────────────────────┘

Total Steps: 3 user actions → Instant login
Time: ~2 seconds
```

---

## 🎮 Demo User Journey

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User clicks "Dùng thử không cần tài khoản"                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. System logs in with demo credentials                      │
│    POST /auth/token                                          │
│    username: "patient1@seekwell.health"                      │
│    password: "PatientDemo2025"                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
                    ┌────────┐
                    │ 200 ✅ │
                    └────┬───┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Store tokens & Navigate to Dashboard                      │
└─────────────────────────────────────────────────────────────┘

Total Steps: 1 user action → Instant access
Time: ~1 second
```

---

## ❌ Error Scenarios

### Wrong Password (Returning User)

```
┌─────────────────────────────────────────────────────────────┐
│ User enters: Phone + WRONG Password                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ POST /auth/token                                             │
│ Returns: 401 Unauthorized                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Show Error: "Số điện thoại hoặc mật khẩu không đúng"        │
│ User stays on login page                                     │
│ Can retry                                                    │
└─────────────────────────────────────────────────────────────┘
```

### Missing Full Name (New User)

```
┌─────────────────────────────────────────────────────────────┐
│ User enters: (NO NAME) + New Phone + Password                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ POST /auth/token                                             │
│ Returns: 401 (User not found)                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ System checks: fullName is empty                             │
│ Show Error: "Vui lòng nhập họ và tên cho lần đầu sử dụng"   │
│ User stays on login page                                     │
└─────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ User fills in Full Name and retries                          │
│ System proceeds with registration                            │
└─────────────────────────────────────────────────────────────┘
```

### Phone Already Exists (New User with Wrong Password)

```
┌─────────────────────────────────────────────────────────────┐
│ User enters: Name + EXISTING Phone + WRONG Password          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ POST /auth/token → 401                                       │
│ System tries to register                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ POST /auth/register/ → 400                                   │
│ Error: "Username already registered"                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Show Error: "Số điện thoại hoặc mật khẩu không đúng"        │
│ (Translates backend error to user-friendly message)         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🌐 Language Switching Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Page loads in Vietnamese (default)                           │
│ Button shows: [English]                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ User clicks [English]                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ i18n.changeLanguage('en')                                    │
│ localStorage.setItem('preferredLanguage', 'en')              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Page updates to English                                      │
│ Button now shows: [Tiếng Việt]                               │
│                                                              │
│ Title: "Bắt đầu kiểm tra da" → "Start Skin Check"           │
│ Placeholders update to English                               │
│ Buttons update to English                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ User can continue in English                                 │
│ Language persists on page reload                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Flow Comparison: Old vs New

### Old Design Flow

```
Landing Page
    │
    ├─→ Login → Fill Email → Fill Password → Click Login
    │                                    │
    │                                    ├─→ Success → Dashboard
    │                                    └─→ Fail → Error
    │
    ├─→ Register → Navigate to /register
    │              Fill Name → Fill Email → Fill Password
    │              Click Register → Success → Back to Login
    │              Fill Email again → Fill Password again
    │              Click Login → Dashboard
    │
    └─→ Demo → Read credentials → Click "Fill Demo"
               → Credentials auto-filled → Click Login → Dashboard

New User: 11 steps
Returning User: 5 steps
Demo User: 4 steps
```

### New Design Flow

```
Landing Page (Unified)
    │
    ├─→ New User → Fill Name + Phone + Password → Click START
    │              → Auto-register + Auto-login → Dashboard
    │              [4 steps]
    │
    ├─→ Returning User → Fill Phone + Password → Click START
    │                    → Login → Dashboard
    │                    [3 steps]
    │
    └─→ Demo User → Click "Try without account"
                    → Dashboard
                    [1 step]

New User: 4 steps (64% faster) ✨
Returning User: 3 steps (40% faster) ✨
Demo User: 1 step (75% faster) ✨
```

---

## 🎯 Decision Tree

```
                        START
                          │
                          ▼
                  ┌───────────────┐
                  │  Needs Demo?  │
                  └───────┬───────┘
                          │
                   ┌──────┴──────┐
                   │             │
                  YES           NO
                   │             │
                   ▼             ▼
          ┌─────────────┐  ┌─────────────┐
          │ Click Demo  │  │ Has Account?│
          │   Button    │  └──────┬──────┘
          └──────┬──────┘         │
                 │          ┌─────┴─────┐
                 │         YES          NO
                 │          │            │
                 │          ▼            ▼
                 │   ┌────────────┐  ┌────────────┐
                 │   │ Fill Phone │  │  Fill Name │
                 │   │ + Password │  │ + Phone +  │
                 │   └─────┬──────┘  │  Password  │
                 │         │         └─────┬──────┘
                 │         │               │
                 │         └───────┬───────┘
                 │                 │
                 │                 ▼
                 │          ┌────────────┐
                 │          │Click START │
                 │          └─────┬──────┘
                 │                │
                 └────────────────┼────────┐
                                  │        │
                                  ▼        ▼
                           ┌──────────────────┐
                           │    DASHBOARD     │
                           └──────────────────┘

All paths lead to success! 🎉
```

---

## 📈 Success Metrics

| Metric | Old Design | New Design | Improvement |
|--------|-----------|------------|-------------|
| New User Steps | 11 | 4 | ⬇️ 64% |
| Login Steps | 5 | 3 | ⬇️ 40% |
| Demo Steps | 4 | 1 | ⬇️ 75% |
| UI Elements | 15 | 8 | ⬇️ 47% |
| Form Fields | 2 | 3 | ⬆️ +1 (but simpler) |
| Action Buttons | 3 | 2 | ⬇️ 33% |
| User Confusion | High | Low | ⬇️ Minimal |

**Overall UX Improvement: 🚀 Massive**
