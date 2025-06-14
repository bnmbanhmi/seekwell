#!/bin/bash

echo "🚀 Setting up AI Prediction API Test Environment"
echo "=============================================="

# Check if we're in the backend directory
if [ ! -f "app/main.py" ]; then
    echo "❌ Please run this script from the backend directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file template..."
    cat > .env << EOL
# Add your Hugging Face API token here
HUGGINGFACE_API_KEY=your_token_here

# Database URL (if needed)
DATABASE_URL=sqlite:///./test.db

# Other environment variables
SECRET_KEY=your-secret-key-here
EOL
    echo "✅ Created .env file. Please add your HUGGINGFACE_API_KEY"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🔧 Setup complete! Next steps:"
echo ""
echo "1. Add your Hugging Face API key to .env file:"
echo "   HUGGINGFACE_API_KEY=your_token_here"
echo ""
echo "2. Start the FastAPI server:"
echo "   uvicorn app.main:app --reload --port 8000"
echo ""
echo "3. Run the tests:"
echo "   python simple_test.py"
echo ""
echo "4. Or test with deployed URL:"
echo "   python simple_test.py https://your-app.onrender.com"
echo ""
echo "📚 Get your HF token at: https://huggingface.co/settings/tokens"
