"""
Skin Cancer Classification Model
Handles loading and inference for the SeekWell skin cancer detection model.
"""

import torch
from transformers import AutoImageProcessor, AutoModelForImageClassification
from PIL import Image
import logging
from typing import Dict, List, Tuple, Optional
from .model_config import (
    MODEL_CONFIG, CLASS_LABELS, get_risk_level, get_confidence_level, 
    get_recommendations, needs_professional_review
)

logger = logging.getLogger(__name__)


class SkinCancerClassifier:
    """Main classifier for skin cancer detection using Vision Transformer model."""
    
    def __init__(self):
        self.model = None
        self.processor = None
        self.model_name = MODEL_CONFIG["model_name"]
        self.base_model_name = MODEL_CONFIG["base_model_name"]
        self.fallback_processor = MODEL_CONFIG["processor_name"]
        self.device = MODEL_CONFIG["device"]
        self.is_loaded = False
    
    def load_model(self) -> bool:
        """
        Load the model and processor.
        Returns True if successful, False otherwise.
        """
        try:
            logger.info(f"Loading model: {self.model_name}")
            logger.info(f"Loading processor from: {self.base_model_name}")
            
            # Try to load processor from the base model
            self.processor = AutoImageProcessor.from_pretrained(self.base_model_name)
            # Load the fine-tuned model
            self.model = AutoModelForImageClassification.from_pretrained(self.model_name)
            
            logger.info("✅ Model and processor loaded successfully!")
            self.is_loaded = True
            return True
            
        except Exception as e:
            logger.warning(f"❌ Error loading model: {e}")
            # Fallback: try with a generic ViT processor
            try:
                logger.info("🔄 Trying with generic ViT processor...")
                self.processor = AutoImageProcessor.from_pretrained(self.fallback_processor)
                self.model = AutoModelForImageClassification.from_pretrained(self.model_name)
                logger.info("✅ Model loaded with generic ViT processor!")
                self.is_loaded = True
                return True
            except Exception as e2:
                logger.error(f"❌ Fallback also failed: {e2}")
                self.is_loaded = False
                return False
    
    def preprocess_image(self, image: Image.Image) -> torch.Tensor:
        """
        Preprocess the image for model input.
        
        Args:
            image: PIL Image to preprocess
            
        Returns:
            Preprocessed tensor ready for model input
        """
        if not self.is_loaded:
            raise RuntimeError("Model not loaded. Call load_model() first.")
        
        # Ensure image is in RGB format
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Preprocess the image
        inputs = self.processor(images=image, return_tensors="pt")
        return inputs
    
    def predict(self, image: Image.Image) -> Dict:
        """
        Predict skin cancer classification for an image.
        
        Args:
            image: PIL Image to classify
            
        Returns:
            Dictionary containing predictions and metadata
        """
        if not self.is_loaded:
            raise RuntimeError("Model not loaded. Call load_model() first.")
        
        try:
            logger.info("🔍 Processing image for prediction...")
            
            # Preprocess the image
            inputs = self.preprocess_image(image)
            
            # Make prediction
            logger.info("🤖 Making prediction...")
            with torch.no_grad():
                outputs = self.model(**inputs)
                predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
            
            # Get the predicted class and confidence scores
            scores = predictions[0].tolist()
            
            # Create results
            results = []
            for idx, score in enumerate(scores):
                label = CLASS_LABELS.get(idx, f"Class_{idx}")
                results.append({
                    "class_id": idx,
                    "label": label,
                    "confidence": float(score),
                    "percentage": float(score * 100)
                })
            
            # Sort by confidence
            results.sort(key=lambda x: x["confidence"], reverse=True)
            
            # Get top prediction
            top_prediction = results[0]
            
            prediction_result = {
                "predictions": results,
                "top_prediction": top_prediction,
                "model_version": self.model_name,
                "success": True,
                "error": None
            }
            
            logger.info(f"✅ Prediction completed! Top result: {top_prediction['label']} ({top_prediction['percentage']:.1f}%)")
            return prediction_result
            
        except Exception as e:
            logger.error(f"❌ Error in prediction: {e}")
            return {
                "predictions": [],
                "top_prediction": None,
                "model_version": self.model_name,
                "success": False,
                "error": str(e)
            }
    
    def analyze_lesion(self, image: Image.Image, body_region: Optional[str] = None) -> Dict:
        """
        Complete lesion analysis including risk assessment and recommendations.
        
        Args:
            image: PIL Image to analyze
            body_region: Optional body region where lesion is located
            
        Returns:
            Complete analysis results with risk assessment and recommendations
        """
        # Get basic prediction
        prediction_result = self.predict(image)
        
        if not prediction_result["success"]:
            return prediction_result
        
        top_prediction = prediction_result["top_prediction"]
        predicted_class = top_prediction["label"]
        confidence = top_prediction["confidence"]
        
        logger.info(f"🔍 Analyzing lesion: {predicted_class} with {confidence:.3f} confidence")
        
        # Risk assessment
        risk_level = get_risk_level(predicted_class, confidence, body_region)
        confidence_level = get_confidence_level(confidence)
        needs_review = needs_professional_review(predicted_class, confidence)
        
        # Get recommendations
        recommendations = get_recommendations(predicted_class, confidence, body_region)
        
        # Determine urgency and review needs
        needs_urgent_attention = risk_level == "URGENT"
        needs_cadre_review = needs_review and risk_level != "LOW"
        needs_doctor_review = needs_urgent_attention or risk_level in ["HIGH", "URGENT"]
        
        # Enhanced analysis result
        analysis_result = {
            **prediction_result,
            "analysis": {
                "predicted_class": predicted_class,
                "confidence": confidence,
                "body_region": body_region,
                "analysis_timestamp": "2025-06-15T00:00:00Z"  # You can use datetime.utcnow().isoformat()
            },
            "risk_assessment": {
                "risk_level": risk_level,
                "confidence_level": confidence_level,
                "needs_professional_review": needs_review,
                "needs_urgent_attention": needs_urgent_attention,
                "base_risk": risk_level,
                "confidence_score": confidence,
                "predicted_class": predicted_class
            },
            "recommendations": recommendations,
            "workflow": {
                "needs_cadre_review": needs_cadre_review,
                "needs_doctor_review": needs_doctor_review,
                "priority_level": risk_level.lower(),
                "estimated_follow_up_days": self._get_follow_up_days(risk_level)
            }
        }
        
        logger.info(f"📊 Analysis completed: Risk={risk_level}, Cadre Review={needs_cadre_review}, Doctor Review={needs_doctor_review}")
        
        return analysis_result
    
    def _get_follow_up_days(self, risk_level: str) -> int:
        """Get recommended follow-up days based on risk level."""
        from .model_config import RISK_ASSESSMENT_CONFIG
        return RISK_ASSESSMENT_CONFIG["follow_up_days"].get(risk_level, 30)
    
    def health_check(self) -> Dict:
        """
        Perform health check on the model.
        
        Returns:
            Health check results
        """
        try:
            if not self.is_loaded:
                return {
                    "status": "unhealthy",
                    "message": "Model not loaded",
                    "is_ready": False
                }
            
            # Test with a small dummy image
            dummy_image = Image.new('RGB', (224, 224), color='white')
            test_result = self.predict(dummy_image)
            
            if test_result["success"]:
                return {
                    "status": "healthy",
                    "message": "Model is ready for inference",
                    "is_ready": True,
                    "test_prediction": test_result["top_prediction"]["label"]
                }
            else:
                return {
                    "status": "unhealthy", 
                    "message": f"Model test failed: {test_result.get('error', 'Unknown error')}",
                    "is_ready": False
                }
                
        except Exception as e:
            return {
                "status": "unhealthy",
                "message": f"Health check failed: {str(e)}",
                "is_ready": False
            }

    def get_model_info(self) -> Dict:
        """Get comprehensive information about the loaded model."""
        from .model_config import MODEL_METADATA
        
        info = {
            "model_name": self.model_name,
            "base_model_name": self.base_model_name,
            "is_loaded": self.is_loaded,
            "device": self.device,
            "class_labels": CLASS_LABELS,
            "num_classes": len(CLASS_LABELS),
            **MODEL_METADATA
        }
        
        if self.model and hasattr(self.model, 'config'):
            info["model_architecture"] = getattr(self.model.config, 'architectures', ['Unknown'])[0] if hasattr(self.model.config, 'architectures') else 'Unknown'
        
        return info
