import gradio as gr
import torch
from transformers import AutoImageProcessor, AutoModelForImageClassification
from PIL import Image

# --- Configuration ---
PROCESSOR_NAME = "google/vit-base-patch16-224"
MODEL_NAME = "bnmbanhmi/seekwell_skincancer_v2"

# --- Model Loading ---
# This block attempts to load the models and stores the result.
print("Loading model and processor...")
try:
    processor = AutoImageProcessor.from_pretrained(PROCESSOR_NAME)
    model = AutoModelForImageClassification.from_pretrained(MODEL_NAME)
    print("✅ Model and processor loaded successfully!")
    # Global flag to indicate success
    model_loaded_successfully = True
except Exception as e:
    print(f"❌ CRITICAL ERROR: Could not load model or processor. Error: {e}")
    # If loading fails, store the error message
    model_loaded_successfully = False
    loading_error_message = str(e)


# --- Prediction Function ---
def predict(image: Image.Image):
    """
    This function performs the prediction and is carefully designed to
    ALWAYS return a single, simple string to avoid bugs in old Gradio versions.
    """
    # If the model failed to load at startup, return the error string.
    if not model_loaded_successfully:
        return f"MODEL LOADING FAILED:\n\n{loading_error_message}"

    # Handle the case where the user clicks "Submit" without an image.
    if image is None:
        return "Please upload an image first."

    try:
        # The main prediction logic
        inputs = processor(images=image, return_tensors="pt")
        with torch.no_grad():
            outputs = model(**inputs)
        
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
        scores = probs[0].tolist()
        labels = model.config.id2label

        # Format the successful results into a multi-line string.
        result_string = "Classification Results:\n\n"
        for i in range(len(labels)):
            label_name = labels[i]
            score = scores[i]
            result_string += f"{label_name}: {score*100:.2f}%\n"
        
        return result_string

    except Exception as e:
        # If an error happens during prediction, return it as a simple string.
        return f"An error occurred during prediction:\n\n{str(e)}"


# --- Gradio Interface ---
# We use a simple gr.Textbox for output to ensure maximum compatibility.
demo = gr.Interface(
    fn=predict,
    inputs=gr.Image(type="pil", label="Upload Skin Lesion Image"),
    outputs=gr.Textbox(lines=7, label="Classification Results"),
    title="Skin Cancer Image Classification",
    description="""
    <p style='text-align: center;'>
    Upload an image of a skin lesion to classify it.
    </p>
    <p style='text-align: center; color: red;'>
    <b>Disclaimer:</b> This application is for educational purposes only and not a substitute for professional medical advice.
    </p>
    """,
    allow_flagging="never"
)

# --- Launch the App ---
# We must use share=True to prevent the localhost crash in this environment.
if __name__ == "__main__":
    demo.launch(share=True)