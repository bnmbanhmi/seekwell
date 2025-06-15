"""
AI Integration Service
Provides interface between FastAPI app and AI module.
"""

from typing import Dict, Optional
from PIL import Image
import logging
from datetime import datetime
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# Import AI module components (these will work once AI dependencies are installed)
try:
    from ...ai.services.prediction_service import SkinLesionPredictor
    AI_AVAILABLE = True
except ImportError:
    AI_AVAILABLE = False
    logger.warning("AI dependencies not available. AI functionality will be limited.")


class AIIntegrationService:
    """Service to integrate AI predictions with the main application."""
    
    def __init__(self):
        self.predictor = None
        self.is_initialized = False
    
    async def initialize(self) -> bool:
        """
        Initialize the AI prediction service.
        
        Returns:
            True if initialization successful, False otherwise
        """
        if not AI_AVAILABLE:
            logger.warning("AI dependencies not available. Cannot initialize AI service.")
            return False
            
        try:
            logger.info("Initializing AI Integration Service...")
            self.predictor = SkinLesionPredictor()
            success = self.predictor.initialize()
            
            if success:
                self.is_initialized = True
                logger.info("✅ AI Integration Service initialized successfully!")
            else:
                logger.error("❌ Failed to initialize AI Integration Service")
                
            return success
            
        except Exception as e:
            logger.error(f"Error initializing AI service: {e}")
            return False
    
    async def predict_skin_lesion(
        self, 
        image: Image.Image, 
        patient_id: int,
        body_region: Optional[str] = None,
        db: Optional[Session] = None
    ) -> Dict:
        """
        Predict skin lesion classification for a patient.
        
        Args:
            image: PIL Image of the skin lesion
            patient_id: ID of the patient
            body_region: Optional body region where lesion is located
            db: Database session for saving results
            
        Returns:
            Dictionary containing prediction results and metadata
        """
        if not self.is_initialized:
            return {
                "success": False,
                "error": "AI service not initialized",
                "patient_id": patient_id,
                "prediction": None,
                "risk_assessment": None,
                "recommendations": []
            }
        
        try:
            # Get prediction from AI service using the new analyze_lesion method
            result = self.predictor.predict_lesion(image, body_region)
            
            # Add patient context
            result["patient_id"] = patient_id
            result["timestamp"] = self._get_current_timestamp()
            
            # If database session provided, save the results
            if db and result["success"]:
                try:
                    self._save_ai_results_to_db(db, result, patient_id, body_region)
                except Exception as db_error:
                    logger.warning(f"Failed to save results to database: {db_error}")
                    # Don't fail the whole request if DB save fails
                    result["db_save_warning"] = "Results not saved to database"
            
            logger.info(f"Prediction completed for patient {patient_id}")
            return result
            
        except Exception as e:
            logger.error(f"Error in AI prediction for patient {patient_id}: {e}")
            return {
                "success": False,
                "error": str(e),
                "patient_id": patient_id,
                "prediction": None,
                "risk_assessment": None,
                "recommendations": []
            }
    
    def _save_ai_results_to_db(self, db: Session, result: Dict, patient_id: int, body_region: Optional[str] = None) -> None:
        """Save AI prediction results to database."""
        try:
            from .. import crud, schemas
            
            # Extract key information from AI result
            if "prediction" in result and result["prediction"]:
                prediction_data = result["prediction"]
                risk_data = result.get("risk_assessment", {})
                
                # Create AI assessment record using our enhanced schemas
                assessment_data = {
                    "patient_id": patient_id,
                    "predicted_class": risk_data.get("predicted_class", "Unknown"),
                    "confidence_score": risk_data.get("confidence_score", 0.0),
                    "risk_level": risk_data.get("risk_level", "UNCERTAIN"),
                    "confidence_level": risk_data.get("confidence_level", "VERY_LOW"),
                    "needs_professional_review": risk_data.get("needs_professional_review", True),
                    "needs_urgent_attention": risk_data.get("needs_urgent_attention", False),
                    "body_region": body_region
                }
                
                logger.info(f"AI results formatted for database save: {assessment_data}")
                # Actual database save would happen here when tables are ready
                
        except Exception as e:
            logger.error(f"Error saving AI results to database: {e}")
            raise
    
    def get_service_status(self) -> Dict:
        """Get current status of the AI integration service."""
        status = {
            "is_initialized": self.is_initialized,
            "service_name": "AI Integration Service",
            "version": "1.0.0",
            "ai_dependencies_available": AI_AVAILABLE
        }
        
        if self.is_initialized and self.predictor:
            try:
                status.update(self.predictor.get_service_info())
            except Exception as e:
                logger.error(f"Error getting predictor service info: {e}")
        
        return status
    
    def _get_current_timestamp(self) -> str:
        """Get current timestamp in ISO format."""
        return datetime.utcnow().isoformat()


# Global instance
ai_service = AIIntegrationService()
