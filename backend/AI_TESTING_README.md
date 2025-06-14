# AI Prediction API Testing

This directory contains scripts to test the integration of your Hugging Face skin cancer classification model with your FastAPI backend.

## Quick Start

### 1. Setup Environment

```bash
# Navigate to backend directory
cd backend

# Make setup script executable and run it
chmod +x setup_test.sh
./setup_test.sh
```

### 2. Get Hugging Face API Token

1. Go to [Hugging Face Settings](https://huggingface.co/settings/tokens)
2. Create a new token with "Read" permissions
3. Add it to your `.env` file:
   ```
   HUGGINGFACE_API_KEY=hf_your_token_here
   ```

### 3. Start Your Server

```bash
# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

### 4. Run Tests

```bash
# Test local server
python simple_test.py

# Test deployed server
python simple_test.py https://your-app.onrender.com
```

## Test Scripts

### `simple_test.py`
- Comprehensive test suite using only standard libraries
- Tests server connectivity, health checks, predictions, and error handling
- Works with both local and deployed servers

### `test_ai_prediction.py`
- Advanced test suite with async support
- Requires additional dependencies (aiohttp, PIL)
- More detailed testing including file size limits

## API Endpoints Added

### `/ai/health` (GET)
Health check for AI prediction service
```json
{
  "status": "healthy",
  "model": "bnmbanhmi/seekwell_skincancer_v2",
  "api_configured": true
}
```

### `/ai/predict` (POST)
Predict skin cancer from uploaded image

**Request:**
- Form data with `file` field containing image
- Supported formats: JPEG, PNG, etc.
- Max file size: 10MB

**Response:**
```json
[
  {
    "label": "melanoma",
    "score": 0.85
  },
  {
    "label": "benign",
    "score": 0.15
  }
]
```

## Integration with Frontend

Add this component to your React frontend:

```tsx
import { useState } from 'react';

export default function SkinCancerPredictor() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    if (!selectedFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/predict`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setPrediction(result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setSelectedFile(e.target.files[0])}
      />
      <button onClick={handlePredict} disabled={!selectedFile || loading}>
        {loading ? 'Analyzing...' : 'Analyze Image'}
      </button>
      {prediction && (
        <div className="mt-4">
          <h3>Results:</h3>
          {prediction.map((result, index) => (
            <div key={index}>
              {result.label}: {(result.score * 100).toFixed(2)}%
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Deployment

### Backend (Render/Railway)
1. Push code to GitHub
2. Connect to deployment service
3. Add environment variables:
   - `HUGGINGFACE_API_KEY=your_token`
4. Deploy

### Frontend (Vercel)
1. Add environment variable:
   - `NEXT_PUBLIC_API_URL=https://your-backend-url.com`
2. Deploy

## Troubleshooting

### Common Issues

1. **"Model is loading" (503 error)**
   - First request to HF model takes time to load
   - Wait 30-60 seconds and try again
   - This is normal behavior

2. **"API key not configured"**
   - Check `.env` file has correct `HUGGINGFACE_API_KEY`
   - Restart server after adding key

3. **"Connection refused"**
   - Server not running
   - Check server is on correct port (8000)
   - Verify URL is correct

4. **"Invalid file type"**
   - Only image files accepted
   - Check file is actual image format

### Test Individual Components

```bash
# Test direct HF API
curl -X POST \
  "https://api-inference.huggingface.co/models/bnmbanhmi/seekwell_skincancer_v2" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --data-binary @test_image.jpg

# Test health endpoint
curl http://localhost:8000/ai/health

# Test prediction endpoint
curl -X POST \
  -F "file=@test_image.jpg" \
  http://localhost:8000/ai/predict
```

## Model Information

- **Model**: `bnmbanhmi/seekwell_skincancer_v2`
- **Type**: Image Classification
- **Input**: Images (JPEG, PNG)
- **Output**: Classification scores for skin conditions
- **Provider**: Hugging Face Inference API

## Free Hosting Limits

- **Hugging Face**: Free inference API with rate limits
- **Render**: 750 hours/month free tier
- **Vercel**: Unlimited for personal projects
- **Railway**: 500 hours/month free tier

Perfect for prototyping and demo purposes!
