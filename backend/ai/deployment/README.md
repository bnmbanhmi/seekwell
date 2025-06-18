# SeekWell Skin Cancer Detection

This is the HuggingFace Space for SeekWell's AI-powered skin cancer detection system.

## Model Information

- **Model**: `bnmbanhmi/seekwell_skincancer_v2`
- **Architecture**: Vision Transformer (ViT)
- **Classes**: 6 skin lesion types
- **Accuracy**: 69%
- **Training Dataset**: PAD-UFES-20 skin cancer dataset

## API Documentation

### Official HuggingFace Gradio API

According to the official HuggingFace API documentation:

**API Name**: `/predict`  
**Space URL**: `bnmbanhmi/seekwell-skin-cancer`

### Using Python Gradio Client (Recommended)

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

### API Input/Output Specification

**Input Parameter:**
- `image` - dict with the following structure:
  - `path`: str | None (Path to a local file)
  - `url`: str | None (Publicly available url or base64 encoded image)  
  - `size`: int | None (Size of image in bytes)
  - `orig_name`: str | None (Original filename)
  - `mime_type`: str | None (mime type of image)
  - `is_stream`: bool (Can always be set to False)
  - `meta`: dict(str, Any)

**Output:**
- `str` - Classification results as plain text

### HTTP API Access

For direct HTTP access (alternative to gradio_client):
```javascript
// Note: Exact endpoint may vary - use gradio_client for production
// Check HuggingFace Space interface for current HTTP endpoints
```

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
- **API Access**: Via gradio_client or HuggingFace Inference API
- **Response Format**: Plain text string with classification results
- **Developer**: SeekWell Team

## Important Notes

⚠️ **API Access**: The `/api/predict` endpoint may not be available on all Gradio spaces. Use the `gradio_client` library for guaranteed compatibility.

For web applications, consider:
1. Using gradio_client on the backend
2. Using HuggingFace Inference API
3. Checking the actual available endpoints via the HuggingFace Space interface

## Integration

This model is integrated into the full SeekWell healthcare platform which includes:
- Multi-tier review system (Patient → Local Cadre → Doctor)
- Electronic health records
- Telemedicine capabilities
- Mobile-first design for underserved communities

---

*Developed by Team SeekWell for ASEAN DSE 2025*
