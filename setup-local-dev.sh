#!/bin/bash

# SeekWell Local Development Quick Start Script
# This script helps you set up your local development environment

set -e  # Exit on error

echo "🚀 SeekWell Local Development Setup"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Error: Please run this script from the SeekWell root directory${NC}"
    exit 1
fi

echo "Step 1: Backend Environment Setup"
echo "-----------------------------------"

# Backend .env setup
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        echo -e "${YELLOW}📝 Creating backend/.env from template...${NC}"
        cp backend/.env.example backend/.env
        echo -e "${GREEN}✅ Created backend/.env${NC}"
        echo -e "${YELLOW}⚠️  IMPORTANT: Edit backend/.env with your settings:${NC}"
        echo "   1. DATABASE_URL (your local PostgreSQL)"
        echo "   2. SECRET_KEY (generate with: openssl rand -hex 32)"
        echo "   3. GOOGLE_API_KEY (if using chatbot features)"
        echo ""
        read -p "Press Enter after you've edited backend/.env..."
    else
        echo -e "${RED}❌ backend/.env.example not found${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ backend/.env already exists${NC}"
fi

echo ""
echo "Step 2: Frontend Environment Setup"
echo "-----------------------------------"

# Frontend .env setup
if [ ! -f "frontend/.env" ]; then
    if [ -f "frontend/.env.example" ]; then
        echo -e "${YELLOW}📝 Creating frontend/.env from template...${NC}"
        cp frontend/.env.example frontend/.env
        echo -e "${GREEN}✅ Created frontend/.env${NC}"
    else
        echo -e "${RED}❌ frontend/.env.example not found${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ frontend/.env already exists${NC}"
fi

echo ""
echo "Step 3: Database Setup"
echo "----------------------"

# Check if PostgreSQL is running
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL is installed${NC}"
    
    # Try to create database
    echo "Creating seekwell_db database..."
    if createdb seekwell_db 2>/dev/null; then
        echo -e "${GREEN}✅ Database 'seekwell_db' created${NC}"
    else
        echo -e "${YELLOW}⚠️  Database might already exist or PostgreSQL is not running${NC}"
        echo "   Run: brew services start postgresql"
    fi
else
    echo -e "${RED}❌ PostgreSQL not found. Please install it first:${NC}"
    echo "   macOS: brew install postgresql"
    echo "   Ubuntu: sudo apt-get install postgresql"
    exit 1
fi

echo ""
echo "Step 4: Python Environment & Dependencies"
echo "------------------------------------------"

cd backend

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
    echo -e "${GREEN}✅ Virtual environment created${NC}"
else
    echo -e "${GREEN}✅ Virtual environment already exists${NC}"
fi

# Activate virtual environment and install dependencies
echo "Installing Python dependencies..."
source .venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo -e "${GREEN}✅ Python dependencies installed${NC}"

echo ""
echo "Step 5: Initialize Database"
echo "---------------------------"

# Initialize database
echo "Running database setup script..."
if python setup_seekwell_database.py; then
    echo -e "${GREEN}✅ Database initialized with default accounts${NC}"
else
    echo -e "${RED}❌ Database setup failed. Check your DATABASE_URL in backend/.env${NC}"
    cd ..
    exit 1
fi

cd ..

echo ""
echo "Step 6: Node.js Dependencies"
echo "----------------------------"

cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
    echo -e "${GREEN}✅ Node.js dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Node.js dependencies already installed${NC}"
fi

cd ..

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. Start the backend (Terminal 1):"
echo "   cd backend"
echo "   source .venv/bin/activate"
echo "   uvicorn app.main:app --reload"
echo ""
echo "2. Start the frontend (Terminal 2):"
echo "   cd frontend"
echo "   npm start"
echo ""
echo "3. Open http://localhost:3000"
echo ""
echo "4. Login with:"
echo "   Email: admin@seekwell.health"
echo "   Password: SeekWell2025!"
echo ""
echo -e "${YELLOW}📚 More info:${NC}"
echo "   - Local dev guide: LOCAL_DEVELOPMENT.md"
echo "   - Setup guide: SETUP.md"
echo "   - Deployment: DEPLOYMENT.md"
echo ""
