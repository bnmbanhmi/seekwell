# Image Storage Implementation Plan

## Current Issue
- Images are processed by AI but not permanently stored
- Only AI analysis results are saved in localStorage 
- Images are lost after processing, making history viewing incomplete

## Proposed Solution: Google Cloud Storage Integration

### 1. Backend Setup (Python/FastAPI)

#### Install dependencies:
```bash
pip install google-cloud-storage pillow
```

#### Create GCS service in backend:
```python
# backend/app/services/image_storage.py
from google.cloud import storage
from PIL import Image
import io
import uuid
from datetime import datetime

class ImageStorageService:
    def __init__(self):
        self.client = storage.Client()
        self.bucket_name = "seekwell-patient-images"
        
    async def upload_image(self, image_file, patient_id: int, analysis_id: str):
        """Upload image to GCS and return public URL"""
        bucket = self.client.bucket(self.bucket_name)
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"patients/{patient_id}/analyses/{analysis_id}_{timestamp}.jpg"
        
        # Optimize image before upload
        image = Image.open(image_file)
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize if too large (max 1024x1024)
        image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
        
        # Save to bytes
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='JPEG', quality=85)
        img_byte_arr.seek(0)
        
        # Upload to GCS
        blob = bucket.blob(filename)
        blob.upload_from_file(img_byte_arr, content_type='image/jpeg')
        
        # Make public (or use signed URLs for security)
        blob.make_public()
        
        return blob.public_url
```

#### Add to backend router:
```python
# backend/app/routers/ai_analysis.py
from .services.image_storage import ImageStorageService

@router.post("/analyze")
async def analyze_skin_image(
    file: UploadFile,
    patient_id: int,
    current_user = Depends(get_current_user)
):
    # Generate analysis ID
    analysis_id = str(uuid.uuid4())
    
    # Upload image to GCS first
    storage_service = ImageStorageService()
    image_url = await storage_service.upload_image(file.file, patient_id, analysis_id)
    
    # Perform AI analysis
    ai_result = await huggingface_service.analyze(file.file)
    
    # Save to database with image URL
    analysis_record = {
        "id": analysis_id,
        "patient_id": patient_id,
        "image_url": image_url,
        "ai_result": ai_result,
        "created_at": datetime.now()
    }
    
    # Save to database
    db.analyses.insert(analysis_record)
    
    return {
        "analysis_id": analysis_id,
        "image_url": image_url,
        "ai_result": ai_result
    }
```

### 2. Frontend Integration

#### Update the service to use backend endpoint:
```typescript
// frontend/src/services/ImageStorageService.ts
import { BACKEND_URL } from '../config/api';

export class ImageStorageService {
  static async uploadAndAnalyze(file: File, patientId: number): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patient_id', patientId.toString());
    
    const response = await fetch(`${BACKEND_URL}/api/ai/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload and analyze image');
    }
    
    return response.json();
  }
  
  static async getAnalysisHistory(patientId: number): Promise<any[]> {
    const response = await fetch(`${BACKEND_URL}/api/ai/history/${patientId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    return response.json();
  }
}
```

### 3. Database Schema Updates

#### Add analyses table:
```sql
CREATE TABLE analyses (
    id UUID PRIMARY KEY,
    patient_id INTEGER REFERENCES users(id),
    image_url TEXT NOT NULL,
    ai_predictions JSONB,
    risk_level VARCHAR(20),
    confidence FLOAT,
    body_region VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analyses_patient_id ON analyses(patient_id);
CREATE INDEX idx_analyses_risk_level ON analyses(risk_level);
CREATE INDEX idx_analyses_created_at ON analyses(created_at);
```

### 4. Environment Setup

#### Backend environment variables:
```env
# .env
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
GCS_BUCKET_NAME=seekwell-patient-images
```

#### GCS Bucket Setup:
```bash
# Create bucket
gsutil mb gs://seekwell-patient-images

# Set bucket permissions (for public access or signed URLs)
gsutil iam ch allUsers:objectViewer gs://seekwell-patient-images
```

### 5. Security Considerations

- Use signed URLs instead of public URLs for patient privacy
- Implement image access control based on user roles
- Add image retention policies (auto-delete after X years)
- Implement image encryption at rest

### 6. Implementation Steps

1. **Phase 1**: Set up GCS bucket and service account
2. **Phase 2**: Implement backend image upload service
3. **Phase 3**: Create database migrations for analyses table
4. **Phase 4**: Update frontend to use backend endpoint
5. **Phase 5**: Migrate existing localStorage data to backend
6. **Phase 6**: Add image viewing in analysis history

This will solve both the "My Result" viewing issue and provide proper image storage for the application.
