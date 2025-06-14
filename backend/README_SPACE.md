---
title: SeekWell Skin Cancer Classification
emoji: 🔬
colorFrom: blue
colorTo: purple
sdk: gradio
sdk_version: 4.44.0
app_file: app.py
pinned: false
license: apache-2.0
---

# SeekWell Skin Cancer Classification

An AI-powered skin cancer classification tool built for the SeekWell healthcare platform.

## Model Information

- **Model**: `bnmbanhmi/seekwell_skincancer_v2`
- **Base Model**: Vision Transformer (ViT) fine-tuned for skin cancer classification
- **Accuracy**: ~69% on evaluation set
- **Classes**: Multiple skin condition classifications

## Usage

1. Upload an image of a skin lesion
2. The AI will analyze the image and provide classification probabilities
3. Review the results with confidence scores

## Medical Disclaimer

⚠️ **This tool is for educational and research purposes only.**
- Always consult qualified healthcare professionals for medical diagnosis
- This AI model should not replace professional medical advice
- Results are for informational purposes and may not be accurate

## About SeekWell

SeekWell is a healthcare access platform designed for rural communities, providing AI-assisted preliminary health screening tools.

## API Usage

Once deployed, you can use this Space via API:

```python
import requests

def predict_via_space(image_path, space_url):
    with open(image_path, 'rb') as f:
        files = {'data': f}
        response = requests.post(f"{space_url}/api/predict", files=files)
        return response.json()

# Example usage
result = predict_via_space("skin_image.jpg", "https://bnmbanhmi-seekwell-skin-cancer.hf.space")
print(result)
```
