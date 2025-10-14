"""
Main prediction service for skin lesion classification.
Integrates the classifier with business logic and risk assessment.
"""

from PIL import Image
import logging
from typing import Dict, Optional
from ..models.skin_cancer_classifier import SkinCancerClassifier
from ..models.model_config import RISK_LEVELS, CONFIDENCE_THRESHOLDS
from .image_processing import ImageProcessor

logger = logging.getLogger(__name__)


class SkinLesionPredictor:
    """Main service for skin lesion prediction with risk assessment."""
    
    def __init__(self):
        self.classifier = SkinCancerClassifier()
        self.image_processor = ImageProcessor()
        self.is_initialized = False
    
    def initialize(self) -> bool:
        """
        Initialize the predictor by loading the AI model.
        
        Returns:
            True if initialization successful, False otherwise
        """
        try:
            logger.info("Initializing SkinLesionPredictor...")
            success = self.classifier.load_model()
            if success:
                self.is_initialized = True
                logger.info("✅ SkinLesionPredictor initialized successfully!")
            else:
                logger.error("❌ Failed to initialize SkinLesionPredictor")
            return success
        except Exception as e:
            logger.error(f"Error initializing predictor: {e}")
            return False
    
    def predict_lesion(self, image: Image.Image, body_region: Optional[str] = None) -> Dict:
        """
        Predict skin lesion classification with risk assessment.
        
        Args:
            image: PIL Image of the skin lesion
            body_region: Optional body region where lesion is located
            
        Returns:
            Dictionary containing prediction results, risk assessment, and recommendations
        """
        if not self.is_initialized:
            return {
                "success": False,
                "error": "Predictor not initialized. Call initialize() first.",
                "prediction": None,
                "risk_assessment": None,
                "recommendations": []
            }
        
        try:
            # Step 1: Validate image
            is_valid, validation_error = self.image_processor.validate_image(image)
            if not is_valid:
                return {
                    "success": False,
                    "error": f"Image validation failed: {validation_error}",
                    "prediction": None,
                    "risk_assessment": None,
                    "recommendations": []
                }
            
            # Step 2: Enhance and resize image
            enhanced_image = self.image_processor.enhance_image(image)
            processed_image = self.image_processor.resize_image(enhanced_image)
            
            # Step 3: Get AI prediction
            prediction_result = self.classifier.predict(processed_image)
            
            if not prediction_result["success"]:
                return {
                    "success": False,
                    "error": prediction_result["error"],
                    "prediction": None,
                    "risk_assessment": None,
                    "recommendations": []
                }
            
            # Step 4: Perform risk assessment
            risk_assessment = self._assess_risk(prediction_result, body_region)
            
            # Step 5: Generate recommendations
            recommendations = self._generate_recommendations(risk_assessment, body_region)
            
            return {
                "success": True,
                "error": None,
                "prediction": prediction_result,
                "risk_assessment": risk_assessment,
                "recommendations": recommendations,
                "body_region": body_region
            }
            
        except Exception as e:
            logger.error(f"Error in lesion prediction: {e}")
            return {
                "success": False,
                "error": str(e),
                "prediction": None,
                "risk_assessment": None,
                "recommendations": []
            }
    
    def _assess_risk(self, prediction_result: Dict, body_region: Optional[str] = None) -> Dict:
        """
        Assess risk level based on prediction results.
        
        Args:
            prediction_result: Results from the AI classifier
            body_region: Body region where lesion is located
            
        Returns:
            Risk assessment dictionary
        """
        top_prediction = prediction_result["top_prediction"]
        label = top_prediction["label"]
        confidence = top_prediction["confidence"]
        
        # Get base risk level from class
        base_risk = RISK_LEVELS.get(label, "MEDIUM")
        
        # Adjust risk based on confidence
        if confidence < CONFIDENCE_THRESHOLDS["LOW_CONFIDENCE"]:
            adjusted_risk = "UNCERTAIN"
            needs_review = True
        elif confidence < CONFIDENCE_THRESHOLDS["MEDIUM_CONFIDENCE"]:
            # Keep base risk but flag for review
            adjusted_risk = base_risk
            needs_review = True
        else:
            # High confidence, use base risk
            adjusted_risk = base_risk
            needs_review = base_risk in ["HIGH", "URGENT"]
        
        # Special considerations for body regions
        high_risk_regions = ["face", "neck", "hands", "feet", "genitals"]
        if body_region and body_region.lower() in high_risk_regions:
            if adjusted_risk == "LOW":
                adjusted_risk = "MEDIUM"
            needs_review = True
        
        return {
            "risk_level": adjusted_risk,
            "confidence_level": self._get_confidence_level(confidence),
            "needs_professional_review": needs_review,
            "needs_urgent_attention": adjusted_risk == "URGENT",
            "base_risk": base_risk,
            "confidence_score": confidence,
            "predicted_class": label
        }
    
    def _get_confidence_level(self, confidence: float) -> str:
        """Get human-readable confidence level."""
        if confidence >= CONFIDENCE_THRESHOLDS["HIGH_CONFIDENCE"]:
            return "HIGH"
        elif confidence >= CONFIDENCE_THRESHOLDS["MEDIUM_CONFIDENCE"]:
            return "MEDIUM"
        elif confidence >= CONFIDENCE_THRESHOLDS["LOW_CONFIDENCE"]:
            return "LOW"
        else:
            return "VERY_LOW"
    
    def _generate_recommendations(self, risk_assessment: Dict, body_region: Optional[str] = None) -> list:
        """
        Generate recommendations based on risk assessment.
        
        Args:
            risk_assessment: Risk assessment results
            body_region: Body region where lesion is located
            
        Returns:
            List of recommendation strings
        """
        recommendations = []
        risk_level = risk_assessment["risk_level"]
        needs_review = risk_assessment["needs_professional_review"]
        
        if risk_level == "URGENT":
            recommendations.extend([
                "⚠️ URGENT: Seek immediate medical attention",
                "Contact a dermatologist or visit emergency care",
                "Do not delay - this requires immediate professional evaluation"
            ])
        elif risk_level == "HIGH":
            recommendations.extend([
                "🔴 HIGH PRIORITY: Schedule dermatologist appointment within 1-2 weeks",
                "Monitor for any changes in size, color, or texture",
                "Take photos to track changes over time"
            ])
        elif risk_level == "MEDIUM":
            recommendations.extend([
                "🟡 MODERATE CONCERN: Consult with healthcare provider within 4-6 weeks",
                "Monitor the lesion for changes",
                "Consider dermatologist referral if changes occur"
            ])
        elif risk_level == "LOW":
            recommendations.extend([
                "🟢 LOW CONCERN: Monitor during regular health checkups",
                "Take photos for future comparison",
                "Watch for any changes in appearance"
            ])
        elif risk_level == "UNCERTAIN":
            recommendations.extend([
                "❓ UNCERTAIN RESULT: Professional evaluation recommended",
                "AI confidence is low - human expert review needed",
                "Schedule appointment with healthcare provider"
            ])
        
        # General recommendations
        recommendations.extend([
            "📱 Save this analysis for your healthcare provider",
            "🧴 Use sunscreen daily (SPF 30+)",
            "👕 Wear protective clothing when outdoors",
            "🔍 Perform monthly self-examinations"
        ])
        
        # Body region specific recommendations
        if body_region:
            if body_region.lower() in ["face", "neck"]:
                recommendations.append("☀️ Extra sun protection needed for this area")
            elif body_region.lower() in ["hands", "feet"]:
                recommendations.append("👀 This area requires regular monitoring")
        
        return recommendations
    
    def get_service_info(self) -> Dict:
        """Get information about the prediction service."""
        return {
            "is_initialized": self.is_initialized,
            "model_info": self.classifier.get_model_info() if self.is_initialized else None,
            "risk_levels": list(RISK_LEVELS.values()),
            "confidence_thresholds": CONFIDENCE_THRESHOLDS
        }
