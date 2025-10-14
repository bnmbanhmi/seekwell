# SeekWell Quick Setup Guide

This guide will get you up and running with SeekWell in under 10 minutes.

## Prerequisites

- **Python 3.11+** - [Download](https://www.python.org/downloads/)
- **Node.js 16+** - [Download](https://nodejs.org/)
- **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/)

## Step 1: Clone Repository

```bash
git clone https://github.com/bnmbanhmi/seekwell.git
cd seekwell
```

## Step 2: Database Setup

### Create PostgreSQL Database

```bash
# macOS (if using Homebrew)
brew services start postgresql

# Create database
createdb seekwell_db

# Or using psql:
psql postgres
CREATE DATABASE seekwell_db;
\q
```

### Update Connection String

Your database URL format:
```
postgresql://username:password@localhost:5432/seekwell_db
```

Default PostgreSQL credentials are usually:
- **Username**: Your macOS username or `postgres`
- **Password**: (empty) or what you set during installation
- **Host**: `localhost`
- **Port**: `5432`

## Step 3: Backend Setup

```bash
cd backend

# Create Python virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate  # macOS/Linux
# OR
.venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env file - REQUIRED FIELDS:
# 1. DATABASE_URL - Your PostgreSQL connection string
# 2. SECRET_KEY - Generate with: openssl rand -hex 32
```

### Generate Secret Key

```bash
# Run this command and copy the output to SECRET_KEY in .env
openssl rand -hex 32
```

### Initialize Database

```bash
# This creates tables and default accounts
python setup_seekwell_database.py

# You should see: ✅ Database setup completed successfully!
```

### Start Backend Server

```bash
uvicorn app.main:app --reload
```

✅ Backend running at: **http://localhost:8000**
📚 API docs at: **http://localhost:8000/docs**

## Step 4: Frontend Setup

Open a **new terminal** (keep backend running):

```bash
cd frontend

# Install dependencies
npm install

# (Optional) Create .env for custom config
cp .env.example .env

# Start development server
npm start
```

✅ Frontend running at: **http://localhost:3000**

## Step 5: Test the Application

### Default Login Accounts

After running `setup_seekwell_database.py`, use these accounts:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@seekwell.health | SeekWell2025! |
| **Doctor** | dermatologist@seekwell.health | DermExpert2025 |
| **Official** | cadre.thailand@seekwell.health | CadreThailand2025 |

### Test Basic Flow

1. **Login** as admin at http://localhost:3000
2. **Navigate** to AI Skin Analysis (Patient view)
3. **Upload** a test image
4. **View** AI prediction results
5. **Check** Dashboard for analysis history

## Troubleshooting

### Backend won't start

**Error**: `sqlalchemy.exc.OperationalError: could not connect to server`
- **Solution**: Make sure PostgreSQL is running
  ```bash
  # macOS
  brew services start postgresql
  
  # Check status
  psql -U postgres -c "SELECT version();"
  ```

**Error**: `ImportError: No module named 'fastapi'`
- **Solution**: Activate virtual environment and reinstall
  ```bash
  source .venv/bin/activate
  pip install -r requirements.txt
  ```

**Error**: `Could not validate credentials`
- **Solution**: Check SECRET_KEY in .env matches between sessions

### Frontend won't start

**Error**: `npm ERR! code ENOENT`
- **Solution**: Delete node_modules and reinstall
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

**Error**: CORS errors in browser console
- **Solution**: Add `http://localhost:3000` to ALLOWED_ORIGINS in backend/.env

### Database issues

**Error**: `relation "users" does not exist`
- **Solution**: Run database setup script
  ```bash
  cd backend
  python setup_seekwell_database.py
  ```

**Error**: `column "specialization" does not exist`
- **Solution**: Re-run setup script or run update script
  ```bash
  python setup_seekwell_database.py --skip-users
  ```

## Next Steps

- 📖 Read [DEVELOPMENT.md](../DEVELOPMENT.md) for detailed technical docs
- 🤖 Check [.github/copilot-instructions.md](../.github/copilot-instructions.md) for AI coding agent guidance
- ✅ Review [TODO.md](../TODO.md) for current development priorities
- 🔐 Set up email (optional) for password reset functionality

## Development Commands

### Backend
```bash
cd backend
source .venv/bin/activate

# Run server
uvicorn app.main:app --reload

# Run with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Reset database (⚠️ DESTROYS DATA)
python setup_seekwell_database.py --reset
```

### Frontend
```bash
cd frontend

# Development server
npm start

# Production build
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

## Optional: Email Configuration (Password Reset)

If you want password reset functionality:

1. **Use Gmail App Password** (not your regular Gmail password)
   - Go to https://myaccount.google.com/apppasswords
   - Create app password for "Mail"
   - Copy 16-character password

2. **Update backend/.env**:
   ```bash
   MAIL_SERVER=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=your-16-char-app-password
   MAIL_USE_TLS=True
   MAIL_FROM=noreply@seekwell.health
   ```

3. **Restart backend** for changes to take effect

---

**Need help?** Check the troubleshooting section or review the full documentation in DEVELOPMENT.md.
