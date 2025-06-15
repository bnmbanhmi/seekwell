#!/bin/bash

# SeekWell Deployment Helper Script
# Run this script to set up and deploy SeekWell to production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command_exists git; then
        log_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    if ! command_exists node; then
        log_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    if ! command_exists python3; then
        log_error "Python 3 is not installed. Please install Python 3.11+ first."
        exit 1
    fi
    
    if ! command_exists npm; then
        log_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    log_success "All prerequisites are installed."
}

# Setup frontend for deployment
setup_frontend() {
    log_info "Setting up frontend for deployment..."
    
    cd frontend
    
    # Install dependencies
    log_info "Installing frontend dependencies..."
    npm ci
    
    # Run tests
    log_info "Running frontend tests..."
    npm run test -- --coverage --watchAll=false
    
    # Type check
    log_info "Running TypeScript type checking..."
    npm run type-check
    
    # Test build
    log_info "Testing frontend build..."
    REACT_APP_BACKEND_URL=https://seekwell-backend.onrender.com npm run build
    
    cd ..
    log_success "Frontend setup complete."
}

# Setup backend for deployment
setup_backend() {
    log_info "Setting up backend for deployment..."
    
    cd backend
    
    # Check if virtual environment exists
    if [ ! -d ".venv" ]; then
        log_info "Creating Python virtual environment..."
        python3 -m venv .venv
    fi
    
    # Activate virtual environment
    source .venv/bin/activate
    
    # Install dependencies
    log_info "Installing backend dependencies..."
    pip install -r ../requirements.txt
    
    # Run linting
    log_info "Running backend code quality checks..."
    pip install black flake8
    black --check . || log_warning "Code formatting issues found. Run 'black .' to fix."
    flake8 . || log_warning "Linting issues found. Please review and fix."
    
    cd ..
    log_success "Backend setup complete."
}

# Install deployment tools
install_deployment_tools() {
    log_info "Installing deployment tools..."
    
    # Install Vercel CLI
    if ! command_exists vercel; then
        log_info "Installing Vercel CLI..."
        npm install -g vercel
    else
        log_success "Vercel CLI already installed."
    fi
    
    # Check if user is logged in to Vercel
    if ! vercel whoami >/dev/null 2>&1; then
        log_warning "Please login to Vercel by running: vercel login"
    else
        log_success "Vercel authentication verified."
    fi
}

# Deploy frontend to Vercel
deploy_frontend() {
    log_info "Deploying frontend to Vercel..."
    
    cd frontend
    
    # Deploy to production
    if [ "$1" = "production" ]; then
        log_info "Deploying to production..."
        vercel --prod
    else
        log_info "Deploying preview version..."
        vercel
    fi
    
    cd ..
    log_success "Frontend deployment complete."
}

# Generate environment template
generate_env_template() {
    log_info "Generating environment configuration templates..."
    
    # Backend environment template
    cat > backend/.env.template << EOF
# Backend Environment Configuration
# Copy this to .env and fill in your values

DATABASE_URL=postgresql://username:password@host:port/database
SECRET_KEY=your-super-secret-key-minimum-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALLOWED_ORIGINS=["https://seekwell.vercel.app"]
HUGGINGFACE_API_KEY=your-huggingface-api-key
ENVIRONMENT=production
PORT=8000
EOF

    # Frontend environment template
    cat > frontend/.env.template << EOF
# Frontend Environment Configuration
# Set these in Vercel dashboard

REACT_APP_BACKEND_URL=https://seekwell-backend.onrender.com
REACT_APP_AI_CONFIDENCE_THRESHOLD=0.8
REACT_APP_HUGGINGFACE_SPACE_URL=https://bnmbanhmi-seekwell-skin-cancer.hf.space
REACT_APP_ENABLE_OFFLINE_MODE=true
REACT_APP_ENABLE_PWA=true
REACT_APP_ENVIRONMENT=production
EOF

    log_success "Environment templates generated."
}

# Validate deployment
validate_deployment() {
    log_info "Validating deployment..."
    
    # Check if URLs are provided
    if [ -z "$FRONTEND_URL" ] || [ -z "$BACKEND_URL" ]; then
        log_warning "Deployment URLs not provided. Skipping validation."
        return
    fi
    
    # Test frontend
    log_info "Testing frontend at $FRONTEND_URL..."
    if curl -f -s "$FRONTEND_URL" > /dev/null; then
        log_success "Frontend is accessible."
    else
        log_error "Frontend is not accessible at $FRONTEND_URL"
    fi
    
    # Test backend health
    log_info "Testing backend health at $BACKEND_URL/health..."
    if curl -f -s "$BACKEND_URL/health" > /dev/null; then
        log_success "Backend health check passed."
    else
        log_error "Backend health check failed at $BACKEND_URL/health"
    fi
}

# Main deployment function
main() {
    echo -e "${BLUE}"
    echo "🩺 SeekWell Deployment Helper"
    echo "=============================="
    echo -e "${NC}"
    
    case "$1" in
        "setup")
            check_prerequisites
            setup_frontend
            setup_backend
            install_deployment_tools
            generate_env_template
            log_success "Setup complete! Please configure environment variables before deploying."
            ;;
        "deploy")
            check_prerequisites
            install_deployment_tools
            setup_frontend
            deploy_frontend "$2"
            log_success "Deployment complete!"
            ;;
        "validate")
            FRONTEND_URL="$2"
            BACKEND_URL="$3"
            validate_deployment
            ;;
        "help"|*)
            echo "Usage: $0 [command] [options]"
            echo ""
            echo "Commands:"
            echo "  setup                  - Set up project for deployment"
            echo "  deploy [production]    - Deploy to Vercel (add 'production' for prod)"
            echo "  validate <frontend_url> <backend_url> - Validate deployment"
            echo "  help                   - Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 setup"
            echo "  $0 deploy"
            echo "  $0 deploy production"
            echo "  $0 validate https://seekwell.vercel.app https://seekwell-backend.onrender.com"
            ;;
    esac
}

# Run main function with all arguments
main "$@"
