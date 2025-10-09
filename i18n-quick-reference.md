# 🌐 i18n Quick Reference Guide

## Adding Translations to New Components

### 1. Import Dependencies
```typescript
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../common/LanguageSwitcher'; // adjust path
```

### 2. Add Hook
```typescript
const MyComponent = () => {
  const { t } = useTranslation();
  // ... rest of component
```

### 3. Replace Hardcoded Strings
```typescript
// Before
<h1>Welcome to Dashboard</h1>
<p>View your health data</p>

// After
<h1>{t('dashboard.title')}</h1>
<p>{t('dashboard.subtitle')}</p>
```

### 4. Add LanguageSwitcher (optional but recommended)
```typescript
return (
  <div className={styles.container}>
    <div className={styles.header}>
      <div>
        <h1>{t('dashboard.title')}</h1>
      </div>
      <LanguageSwitcher />
    </div>
    {/* rest of component */}
  </div>
);
```

### 5. Add Translation Keys

**en.json:**
```json
{
  "dashboard": {
    "title": "Welcome to Dashboard",
    "subtitle": "View your health data"
  }
}
```

**vi.json:**
```json
{
  "dashboard": {
    "title": "Chào Mừng Đến Bảng Điều Khiển",
    "subtitle": "Xem dữ liệu sức khỏe của bạn"
  }
}
```

---

## Common Patterns

### Dynamic Content
```typescript
// With variable
{t('welcome.message', { name: userName })}

// Translation file
"welcome": {
  "message": "Hello, {{name}}!"
}
```

### Pluralization
```typescript
{t('items.count', { count: items.length })}

// Translation file
"items": {
  "count_one": "{{count}} item",
  "count_other": "{{count}} items"
}
```

### Conditional Text
```typescript
{loading ? t('common.loading') : t('common.submit')}
```

### Form Placeholders
```typescript
<input
  placeholder={t('form.emailPlaceholder')}
  value={email}
/>
```

### Button Labels
```typescript
<button onClick={handleSubmit}>
  {loading ? t('common.saving') : t('common.save')}
</button>
```

---

## Namespace Organization

### Current Structure:
```
common.*          // Shared buttons, actions (24 keys)
login.*           // Login page (14 keys)
register.*        // Registration flow (60+ keys)
forgotPassword.*  // Password reset request (8 keys)
resetPassword.*   // Password reset form (10 keys)
profile.*         // User profile (50+ keys)
dashboard.patient.*   // Patient dashboard (15 keys)
dashboard.doctor.*    // Doctor dashboard (18 keys)
dashboard.official.*  // Official dashboard (13 keys)
dashboard.admin.*     // Admin dashboard (14 keys)
aiAnalysis.*      // AI analysis component (30 keys)
aiAnalysisPage.*  // AI analysis page wrapper (8 keys)
mobileNav.*       // Mobile navigation (16 keys)
patientSearch.*   // Patient search (45 keys)
navigation.*      // Main navigation (11 keys)
```

### Naming Conventions:
- Use camelCase: `dashboard.newAnalysis`
- Use descriptive names: `createButton` not `btn1`
- Group related keys: `errors.emailRequired`, `errors.emailInvalid`
- Use nested objects for sub-features

---

## Testing Checklist

- [ ] Component renders without errors in English
- [ ] Component renders without errors in Vietnamese
- [ ] LanguageSwitcher toggles language correctly
- [ ] Language preference persists after page refresh
- [ ] All user-facing text is translated (no hardcoded strings)
- [ ] Dynamic content (variables) displays correctly
- [ ] Form validation messages appear in correct language
- [ ] No console errors or missing translation warnings

---

## Troubleshooting

### Missing Translation Warning
```
i18next: key "xyz" not found
```
**Solution:** Add the key to both en.json and vi.json

### Translation Not Updating
**Solution:** 
1. Check key spelling in component
2. Verify key exists in translation files
3. Restart dev server (`npm start`)
4. Clear browser cache

### TypeScript Errors
**Solution:** Ensure using i18next v23.15.1 (not v24) for TS 4.9.5

### LanguageSwitcher Not Working
**Solution:**
1. Check i18n config is imported in index.tsx
2. Verify localStorage is enabled in browser
3. Check console for initialization errors

---

## Resources

- **Translation Files:** `frontend/src/i18n/locales/`
- **Config:** `frontend/src/i18n/config.ts`
- **LanguageSwitcher:** `frontend/src/components/common/LanguageSwitcher.tsx`
- **Documentation:** https://react.i18next.com/
- **Complete Report:** See `i18n-conversion-summary.md`

---

## Quick Commands

```bash
# Install dependencies (if needed)
npm install react-i18next i18next i18next-browser-languagedetector

# Start dev server
npm start

# Build for production
npm run build

# Find untranslated strings (basic grep)
grep -r ">\s*[A-Z][a-zA-Z\s]*<" src/components/
```

---

**Last Updated:** October 9, 2025  
**i18n Version:** v23.15.1  
**Project:** SeekWell
