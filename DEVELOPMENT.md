# SeekWell - Development Documentation

## 🛠️ Core Architecture

### **Backend**
- **Framework**: Python 3.11+ with FastAPI
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with role-based access (Admin, Doctor, Official, Patient)

### **Frontend**
- **Framework**: React with TypeScript
- **Styling**: Material-UI and Custom CSS

### **AI / Machine Learning**
- **Live Model**: `bnmbanhmi/seekwell-skin-cancer` on HuggingFace Spaces.
- **Interface**: Gradio

---

## 🚀 Getting Started

### **Prerequisites**
- Python 3.11+
- Node.js and npm
- PostgreSQL server running

### **1. Backend Setup**
```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the database setup script (initial setup)
# This will create tables and a default admin user.
python setup_seekwell_database.py
```

### **2. Frontend Setup**
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

---

## 🤖 AI Model Integration (HuggingFace)

Connecting to the HuggingFace/Gradio API requires a specific configuration discovered through trial and error.

### **Key Configuration Parameters**
- **API Prefix**: The service requires the `/gradio_api` prefix for all API calls.
- **Function Index**: The correct function to call is at `fn_index: 2`.
- **Payload Format**: Image data must be sent in a specific `gradio.FileData` format.

### **Correct Frontend Payload Example**
This is how to structure the `POST` request from the frontend to get a prediction.

```typescript
// The base URL for the deployed HuggingFace Space
const HF_SPACE_URL = "https://bnmbanhmi-seekwell-skin-cancer.hf.space";

// Generate a random session hash for the request
const sessionHash = Math.random().toString(36).substring(2);

// Construct the full API endpoint
const apiEndpoint = `${HF_SPACE_URL}/gradio_api/run/predict`;

// Create the payload with the correct structure
const payload = {
  fn_index: 2, // Critical: This index points to the correct prediction function
  session_hash: sessionHash,
  data: [{
    // The image data, base64-encoded
    path: null,
    url: `data:${file.type};base64,${base64String}`,
    size: file.size,
    orig_name: file.name,
    mime_type: file.type,
    is_stream: false,
    meta: { _type: "gradio.FileData" } // Critical: Required by Gradio
  }],
};

// After sending the initial request, you must poll the queue endpoint
// to get the result.
const pollUrl = `${HF_SPACE_URL}/gradio_api/queue/data?session_hash=${sessionHash}`;
```