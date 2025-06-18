# SeekWell Skin Cancer Detection

This is the HuggingFace Space for SeekWell's AI-powered skin cancer detection system.

## Model Information

- **Model**: `bnmbanhmi/seekwell_skincancer_v2`
- **Architecture**: Vision Transformer (ViT)
- **Classes**: 6 skin lesion types
- **Accuracy**: 69%
- **Training Dataset**: PAD-UFES-20 skin cancer dataset

## API Documentation

### Using Python Gradio Client

1. Install the python client:
```bash
pip install gradio_client
```

2. Use the API:
```python
from gradio_client import Client, handle_file

client = Client("bnmbanhmi/seekwell-skin-cancer")
result = client.predict(
    image=handle_file('path/to/your/image.jpg'),
    api_name="/predict"
)
print(result)
```

### API Endpoint Details

- **API Name**: `/predict`
- **Input**: Image file (dict format with path/url, size, mime_type, etc.)
- **Output**: String containing classification results
- **Method**: POST to `https://bnmbanhmi-seekwell-skin-cancer.hf.space/api/predict`

## Supported Classes

1. **ACK** - Actinic keratoses (Precancerous lesions)
2. **BCC** - Basal cell carcinoma (Common skin cancer)
3. **MEL** - Melanoma (Most serious skin cancer)
4. **NEV** - Nevus/Mole (Benign lesions)
5. **SCC** - Squamous cell carcinoma (Skin cancer)
6. **SEK** - Seborrheic keratosis (Benign lesions)

## Risk Levels

- **🚨 URGENT**: Melanoma - requires immediate medical attention
- **🔴 HIGH**: BCC, SCC - schedule dermatologist within 1-2 weeks  
- **🟡 MEDIUM**: ACK - monitor and consider professional consultation
- **🟢 LOW**: NEV, SEK - routine monitoring sufficient

## Usage

1. Upload a clear image of the skin lesion
2. The AI will analyze and provide:
   - Classification with confidence scores
   - Risk assessment 
   - Medical recommendations
   - Follow-up guidance

## Disclaimer

⚠️ **This application is for educational and research purposes only.**

- NOT a substitute for professional medical diagnosis
- Always consult healthcare providers for medical decisions
- AI predictions should be verified by medical professionals
- Developed for the ASEAN Data Science Explorers Competition

## Technical Details

- **Framework**: PyTorch + Transformers
- **Processor**: Google ViT Base Patch16-224
- **Interface**: Gradio
- **API Format**: RESTful HTTP API with JSON payloads
- **Response Format**: Plain text string with classification results
- **Developer**: SeekWell Team

## API Integration Examples

### JavaScript/TypeScript Frontend
```javascript
// Using fetch API
const formData = new FormData();
formData.append('data', JSON.stringify([imageFile]));

const response = await fetch(
  'https://bnmbanhmi-seekwell-skin-cancer.hf.space/api/predict',
  {
    method: 'POST',
    body: formData
  }
);
const result = await response.json();
```

### cURL Example
```bash
curl -X POST \
  -F "data=@image.jpg" \
  https://bnmbanhmi-seekwell-skin-cancer.hf.space/api/predict
```

## Integration

This model is integrated into the full SeekWell healthcare platform which includes:
- Multi-tier review system (Patient → Local Cadre → Doctor)
- Electronic health records
- Telemedicine capabilities
- Mobile-first design for underserved communities

---

*Developed by Team SeekWell for ASEAN DSE 2025*
