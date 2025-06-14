import gradio as gr
import torch
from transformers import AutoImageProcessor, AutoModelForImageClassification
from PIL import Image
import numpy as np
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load the model and processor
model_name = "bnmbanhmi/seekwell_skincancer_v2"

try:
    logger.info(f"Loading model: {model_name}")
    processor = AutoImageProcessor.from_pretrained(model_name)
    model = AutoModelForImageClassification.from_pretrained(model_name)
    logger.info("Model loaded successfully!")
except Exception as e:
    logger.error(f"Error loading model: {e}")
    raise e

def predict_skin_cancer(image):
    """
    Predict skin cancer from uploaded image
    """
    try:
        logger.info("Processing image for prediction...")
        
        # Ensure image is in RGB format
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Preprocess the image
        inputs = processor(images=image, return_tensors="pt")
        
        # Make prediction
        logger.info("Making prediction...")
        with torch.no_grad():
            outputs = model(**inputs)
            predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
        
        # Get the predicted class and confidence scores
        scores = predictions[0].tolist()
        
        # Get labels (if available) or use indices
        if hasattr(model.config, 'id2label') and model.config.id2label:
            labels = model.config.id2label
        else:
            # Fallback to common skin cancer labels
            labels = {
                0: "Benign",
                1: "Malignant", 
                2: "Melanoma",
                3: "Other"
            }
        
        # Create results dictionary
        results = []
        for i, score in enumerate(scores):
            label = labels.get(i, f"Class_{i}")
            results.append({
                "label": label,
                "score": float(score)
            })
        
        # Sort by confidence score (descending)
        results = sorted(results, key=lambda x: x["score"], reverse=True)
        
        logger.info(f"Prediction completed. Top result: {results[0]}")
        return results
        
    except Exception as e:
        logger.error(f"Error in prediction: {e}")
        return [{"label": "Error", "score": str(e)}]

# Create Gradio interface
demo = gr.Interface(
    fn=predict_skin_cancer,
    inputs=gr.Image(type="pil", label="Upload Skin Lesion Image"),
    outputs=gr.JSON(label="Prediction Results"),
    title="🔬 SeekWell Skin Cancer Classification",
    description="""
    Upload an image of a skin lesion to get AI-powered classification results. 
    
    **How to use:**
    1. Click on the image upload area
    2. Select or drag an image file (JPG, PNG, etc.)
    3. Wait for the AI analysis
    4. Review the confidence scores for different classifications
    
    This tool uses a fine-tuned Vision Transformer model for skin cancer detection.
    """,
    examples=[],
    article="""
    ### ⚠️ **Medical Disclaimer** 
    This tool is for **educational and research purposes only**. 
    - Always consult qualified healthcare professionals for medical diagnosis
    - This AI model should not replace professional medical advice
    - Results are for informational purposes and may not be accurate
    
    ### 🔬 **Model Information**
    - **Model**: bnmbanhmi/seekwell_skincancer_v2
    - **Base Model**: Vision Transformer (ViT)
    - **Training**: Fine-tuned on skin cancer datasets
    - **Accuracy**: ~69% on evaluation set
    
    ### 🏥 **About SeekWell**
    SeekWell is a healthcare access platform designed for rural communities, 
    providing AI-assisted preliminary health screening tools.
    """,
    theme=gr.themes.Soft(),
    allow_flagging="never"
)

if __name__ == "__main__":
    demo.launch()
