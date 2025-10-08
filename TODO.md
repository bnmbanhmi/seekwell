# TODO

**Updated:** Oct 9, 2025

## Active

### #1: Vietnamese i18n
**Status:** 60% | **ETA:** 3-5h

**Done:**
- Translation files created (en.json, vi.json - 600+ strings)
- i18n config created
- LanguageSwitcher component 🇺🇸 🇻🇳
- LoginPage converted (use as template)

**Next:**
1. Install: `npm install react-i18next i18next i18next-browser-languagedetector`
2. Convert 14 components:
   - RegisterPage, ForgotPasswordPage, ResetPasswordPage
   - Dashboard, AISkinAnalysisPage
   - PatientDashboard, DoctorDashboard, OfficialDashboard, AdminDashboard
   - MobileNavigation, Profile, PatientSearch, UserManagement, ReportsAnalytics
3. Test switching & persistence

**Pattern:**
```typescript
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
return <h1>{t('dashboard.title')}</h1>;
```

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
