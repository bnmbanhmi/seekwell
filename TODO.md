# TODO

**Updated:** Oct 9, 2025

## Active

### #1: Vietnamese i18n
**Status:** ✅ **100% COMPLETE** | **Completed:** Oct 9, 2025

**Summary:**
- ✅ Translation files created (en.json, vi.json - 800+ strings)
- ✅ i18n config created and integrated
- ✅ LanguageSwitcher component 🇺🇸 🇻🇳 added to all pages
- ✅ ALL 15 components converted to support English/Vietnamese
- ✅ TypeScript compatibility resolved (i18next v23.15.1)
- ✅ Development server running successfully

**Converted Components (15/15):**
1. ✅ LoginPage (pre-existing template)
2. ✅ RegisterPage
3. ✅ ForgotPasswordPage
4. ✅ ResetPasswordPage
5. ✅ Profile
6. ✅ PatientDashboard
7. ✅ DoctorDashboard
8. ✅ OfficialDashboard
9. ✅ AdminDashboard
10. ✅ AISkinAnalysisPage
11. ✅ MobileNavigation
12. ✅ PatientSearch
13. ✅ UserManagement
14. ✅ ReportsAnalytics
15. ✅ Dashboard (router)

**See:** `i18n-conversion-summary.md` for detailed report

---

### #2: Simplify Login
**Status:** Not Started | **ETA:** 3-4h

**Goal:** Username-only login. Email optional.

**Backend:**
- [ ] auth.py - authenticate by username
- [ ] models.py - email nullable
- [ ] schemas.py - email Optional
- [ ] dependencies.py - query by username

**Frontend:**
- [ ] LoginPage - "Email" → "Username"
- [ ] RegisterPage - email optional
- [ ] Profile - email optional

---

## Backlog

**Security:**
- Rate limiting
- Input validation
- DB indexes
- Caching
- Logging

**Features:**
- PDF export
- Email notifications
- Dark mode
- Mobile app
- Multi-image upload

**Testing:**
- Unit tests (API + components)
- E2E tests
- Load testing

---

## Completed

- [x] MVP deployed
- [x] JWT auth
- [x] Role-based dashboards
- [x] AI integration
- [x] Analysis history
- [x] Urgent alerts
