# Login Page Redesign - Testing Guide

## Pre-Testing Checklist

✅ Translations updated (both EN & VI)
✅ Component rewritten with unified login/signup flow
✅ CSS cleaned up and simplified
✅ No TypeScript errors
✅ No lint errors

## Testing Scenarios

### 1. Language Switching
**Steps:**
1. Open login page (should default to Vietnamese)
2. Click "English" button in top-right
3. Verify all text switches to English
4. Click "Tiếng Việt" button
5. Verify all text switches back to Vietnamese

**Expected Results:**
- Language toggle works instantly
- Button text changes to opposite language
- All form placeholders update
- All button text updates

---

### 2. New User Registration (First Time)
**Steps:**
1. Enter full name: "Nguyễn Văn A"
2. Enter phone: "0123456789"
3. Enter password: "password123"
4. Click "BẮT ĐẦU"

**Expected Results:**
- Account created successfully
- User automatically logged in
- Redirected to dashboard
- Toast message: "Chào mừng đến với SeekWell! 🎉"

**Backend Verification:**
```sql
SELECT * FROM users WHERE username = '0123456789';
-- Should show:
-- username: 0123456789
-- email: 0123456789@seekwell.temp
-- full_name: Nguyễn Văn A
-- role: PATIENT
```

---

### 3. Returning User Login
**Steps:**
1. Leave full name field empty
2. Enter phone: "0123456789" (from previous test)
3. Enter password: "password123"
4. Click "BẮT ĐẦU"

**Expected Results:**
- Login successful
- Redirected to dashboard
- Toast message: "Chào mừng đến với SeekWell! 🎉"

---

### 4. Wrong Password (Error Handling)
**Steps:**
1. Enter phone: "0123456789"
2. Enter password: "wrongpassword"
3. Click "BẮT ĐẦU"

**Expected Results:**
- Error message: "Số điện thoại hoặc mật khẩu không đúng"
- Red error banner appears
- User stays on login page

---

### 5. New User Without Full Name (Error)
**Steps:**
1. Leave full name empty
2. Enter phone: "0999999999" (new number)
3. Enter password: "test123"
4. Click "BẮT ĐẦU"

**Expected Results:**
- Error message: "Vui lòng nhập họ và tên cho lần đầu sử dụng"
- User stays on login page
- Can correct and retry

---

### 6. Demo Account Access
**Steps:**
1. Click "Dùng thử không cần tài khoản" button
2. Wait for response

**Expected Results:**
- Instant login (no form filling)
- Redirected to dashboard
- Logged in as: patient1@seekwell.health
- Toast message appears

---

### 7. Missing Phone Number
**Steps:**
1. Leave phone field empty
2. Enter password: "test123"
3. Click "BẮT ĐẦU"

**Expected Results:**
- Error message: "Vui lòng nhập số điện thoại"
- Form validation prevents submission

---

### 8. Missing Password
**Steps:**
1. Enter phone: "0123456789"
2. Leave password empty
3. Click "BẮT ĐẦU"

**Expected Results:**
- Error message: "Vui lòng nhập mật khẩu"
- Form validation prevents submission

---

### 9. Mobile Keyboard Check
**Test on actual mobile device:**
1. Tap full name field
   - ✅ Should show: Full QWERTY keyboard
2. Tap phone number field
   - ✅ Should show: Numeric keypad (0-9)
3. Tap password field
   - ✅ Should show: Full QWERTY keyboard
   - ✅ Characters should be visible (not dots)

---

### 10. Visual Verification Checklist

#### Header:
- [ ] Language switcher button visible top-right
- [ ] Shows "English" when page is in Vietnamese
- [ ] Shows "Tiếng Việt" when page is in English

#### Branding:
- [ ] "SeekWell" logo centered
- [ ] New tagline: "Kiểm tra các nốt ruồi đáng ngờ ngay trên điện thoại"

#### Form Title:
- [ ] Displays: "Bắt đầu kiểm tra da"
- [ ] No subtitle below title

#### Input Fields (All without labels):
- [ ] Full name placeholder: "Điền họ và tên của bạn (nếu đây là lần đầu)"
- [ ] Phone placeholder: "Điền số điện thoại của bạn"
- [ ] Password placeholder: "Tạo mật khẩu dễ nhớ"
- [ ] Password text is visible (not hidden)

#### Buttons:
- [ ] Primary button: "BẮT ĐẦU" (green)
- [ ] Secondary button: "Dùng thử không cần tài khoản" (white with green border)

#### Elements NOT Present:
- [ ] ❌ No "Forgot Password" link
- [ ] ❌ No "or" divider
- [ ] ❌ No separate "Sign Up" button
- [ ] ❌ No password show/hide toggle
- [ ] ❌ No demo credentials box
- [ ] ❌ No "Fill Demo Credentials" button
- [ ] ❌ No field labels above inputs

---

## Browser Testing Matrix

| Browser | Desktop | Mobile | Status |
|---------|---------|--------|--------|
| Chrome  | ✅      | ✅     |        |
| Safari  | ✅      | ✅     |        |
| Firefox | ✅      | N/A    |        |
| Edge    | ✅      | N/A    |        |

---

## Performance Checks

### Load Time:
- [ ] Page loads in < 2 seconds
- [ ] No console errors
- [ ] All translations load correctly

### Responsiveness:
- [ ] Works on 320px width (iPhone SE)
- [ ] Works on 375px width (iPhone 12)
- [ ] Works on 414px width (iPhone 12 Pro Max)
- [ ] Works on 768px width (iPad)
- [ ] Works on 1024px+ width (Desktop)

---

## Accessibility Testing

### Keyboard Navigation:
1. Tab through all fields
   - [ ] Focus visible on each element
   - [ ] Tab order: Full Name → Phone → Password → START button → Demo button
2. Press Enter on START button
   - [ ] Form submits

### Screen Reader (Optional):
- [ ] Field placeholders are announced
- [ ] Button purposes are clear
- [ ] Error messages are announced

---

## Backend Integration Verification

### API Endpoints Used:
1. `POST /auth/token` (login)
2. `POST /auth/register/` (registration)

### Data Flow:
```
Frontend Phone Input: "0123456789"
    ↓
Backend username field: "0123456789"
Backend email field: "0123456789@seekwell.temp"
    ↓
Database stores both
```

---

## Common Issues & Solutions

### Issue: "Username already registered"
**Solution:** This is actually fine - it means the system tried to register but the username exists. The error should say "Số điện thoại hoặc mật khẩu không đúng" instead.

### Issue: Form doesn't submit
**Solution:** Check browser console for errors. Ensure API_CONFIG.BACKEND_URL is correct.

### Issue: Language doesn't persist
**Solution:** Check localStorage for 'preferredLanguage' key.

### Issue: Demo button doesn't work
**Solution:** Verify demo account exists in database with correct credentials.

---

## Success Criteria

✅ All 10 test scenarios pass
✅ No console errors
✅ Mobile keyboard optimization works
✅ Language switching works
✅ Visual checklist complete
✅ Browser compatibility confirmed
✅ Performance targets met

---

## Post-Testing

After successful testing:
1. Document any edge cases found
2. Update README.md if needed
3. Test on real devices (not just emulators)
4. Get user feedback from non-tech-savvy testers
5. Monitor backend logs for any errors

---

## Rollback Plan

If critical issues found:
1. Revert to previous LoginPage.tsx from git history
2. Revert translation changes
3. Investigate issues
4. Fix and re-test

---

## Notes for Developers

- Password validation should be relaxed on backend (min 6-8 chars)
- Phone numbers are stored as `username` in database
- Email format: `{phoneNumber}@seekwell.temp`
- Demo credentials unchanged: `patient1@seekwell.health` / `PatientDemo2025`
