# SeekWell AI Coding Agent Instructions

## Core Principles
- **Be minimal**: No unnecessary lengthy descriptions
- **DRY**: Don't repeat README.md content - reference it instead
- **Update README.md only**: When new project details emerge, edit README.md (keep it minimal)
- **No new markdown files**: All documentation goes in README.md or here

## Project Context
FastAPI backend + React/TypeScript frontend + HuggingFace AI model. See README.md for setup, deployment, and architecture.

## Critical Implementation Patterns

### HuggingFace Gradio API (CRITICAL)
Uses queue-based SSE protocol. Implementation in `frontend/src/services/HuggingFaceAIService.ts`:

```typescript
const imageData = {
  path: uploadedFiles[0],
  meta: { _type: "gradio.FileData" }  // REQUIRED
};

await fetch(`${HF_URL}/gradio_api/run/predict`, {
  body: JSON.stringify({
    fn_index: 2,  // REQUIRED
    session_hash: sessionHash,
    data: [imageData]
  })
});
```

**Must use**: `/gradio_api` prefix, `fn_index: 2`, `meta._type: "gradio.FileData"`

### JWT Auth Pattern
Token payload: `{"sub": email, "role": role}`. Middleware in `backend/app/dependencies.py`:
- `get_current_user()` - extracts user from token
- `get_current_active_doctor()` - role-specific guard
- Use `Depends(get_current_active_doctor)` in routes

### i18n Pattern
```typescript
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
<h1>{t('login.title')}</h1>
```

**TypeScript workaround**: Use `@ts-ignore` before `.use()` calls (TS 4.9.5 compatibility issue)

### API Router Pattern
```python
@router.get("/endpoint", tags=["Tag"])
async def handler(
    current_user: models.User = Depends(get_current_active_doctor),
    db: Session = Depends(get_db)
):
    ...
```

### Frontend Service Pattern
Centralize API calls in `frontend/src/services/`, not components. Use axios with Bearer token from localStorage.

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| ImageData validation error | Add `meta: { _type: "gradio.FileData" }` |
| JWT validation fails | Check token has `sub` and `role` fields |
| CORS errors | Update `ALLOWED_ORIGINS` in backend `.env` |
| Database column missing | Run `python setup_seekwell_database.py` |
| i18next TypeScript error | Use `@ts-ignore` before `.use()` calls |

## File Locations
- API routes: `backend/app/routers/`
- Models: `backend/app/models.py`
- Schemas: `backend/app/schemas.py`
- Frontend services: `frontend/src/services/`
- i18n: `frontend/src/i18n/locales/{en,vi}.json`

## Testing
Manual UI testing only. Default accounts in README.md. Use Swagger UI at `http://localhost:8000/docs` for API testing.

## Reference
See **README.md** for setup, deployment, environment variables, database initialization, and all other details.
