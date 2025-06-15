"""
Skin Lesion Service
Business logic for handling skin lesion analysis and management.
"""

from typing import Dict, List, Optional
from PIL import Image
import logging
from .ai_integration import ai_service

logger = logging.getLogger(__name__)


class SkinLesionService:
    """Service for managing skin lesion analysis workflow."""
    
    def __init__(self):
        self.ai_service = ai_service
    
    async def analyze_skin_lesion(
        self,
        image: Image.Image,
        patient_id: int,
        body_region: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Dict:
        """
        Analyze a skin lesion image for a patient.
        
        Args:
            image: PIL Image of the skin lesion
            patient_id: ID of the patient
            body_region: Body region where lesion is located
            notes: Additional notes about the lesion
            
        Returns:
            Dictionary containing analysis results
        """
        try:
            logger.info(f"Starting skin lesion analysis for patient {patient_id}")
            
            # Get AI prediction
            ai_result = await self.ai_service.predict_skin_lesion(
                image=image,
                patient_id=patient_id,
                body_region=body_region
            )
            
            if not ai_result["success"]:
                return {
                    "success": False,
                    "error": ai_result["error"],
                    "analysis_id": None,
                    "needs_cadre_review": True,
                    "needs_doctor_review": True
                }
            
            # Process the AI results
            risk_assessment = ai_result["risk_assessment"]
            
            # Determine review requirements
            needs_cadre_review = risk_assessment["needs_professional_review"]
            needs_doctor_review = risk_assessment["needs_urgent_attention"]
            
            # Create analysis summary
            analysis_summary = {
                "patient_id": patient_id,
                "body_region": body_region,
                "notes": notes,
                "ai_prediction": ai_result["prediction"]["top_prediction"],
                "risk_level": risk_assessment["risk_level"],
                "confidence_level": risk_assessment["confidence_level"],
                "needs_cadre_review": needs_cadre_review,
                "needs_doctor_review": needs_doctor_review,
                "recommendations": ai_result["recommendations"],
                "timestamp": ai_result["timestamp"]
            }
            
            logger.info(f"Skin lesion analysis completed for patient {patient_id}")
            
            return {
                "success": True,
                "error": None,
                "analysis_summary": analysis_summary,
                "full_ai_result": ai_result,
                "needs_cadre_review": needs_cadre_review,
                "needs_doctor_review": needs_doctor_review
            }
            
        except Exception as e:
            logger.error(f"Error in skin lesion analysis for patient {patient_id}: {e}")
            return {
                "success": False,
                "error": str(e),
                "analysis_id": None,
                "needs_cadre_review": True,
                "needs_doctor_review": True
            }
    
    def get_risk_priority_queue(self, risk_levels: List[str] = None) -> Dict:
        """
        Get queue of lesions that need review, ordered by risk priority.
        
        Args:
            risk_levels: Filter by specific risk levels
            
        Returns:
            Dictionary containing prioritized queue
        """
        # This would integrate with the database to get pending reviews
        # For now, return a placeholder structure
        
        if risk_levels is None:
            risk_levels = ["URGENT", "HIGH", "MEDIUM", "LOW"]
        
        priority_order = {
            "URGENT": 1,
            "HIGH": 2,
            "MEDIUM": 3,
            "LOW": 4,
            "UNCERTAIN": 2  # Treat uncertain as high priority
        }
        
        return {
            "queue_info": {
                "total_pending": 0,
                "urgent_count": 0,
                "high_priority_count": 0,
                "medium_priority_count": 0,
                "low_priority_count": 0
            },
            "pending_reviews": [],
            "priority_order": priority_order
        }
    
    def format_analysis_for_display(self, analysis_result: Dict) -> Dict:
        """
        Format analysis results for frontend display.
        
        Args:
            analysis_result: Results from analyze_skin_lesion
            
        Returns:
            Formatted results for UI display
        """
        if not analysis_result["success"]:
            return {
                "success": False,
                "error": analysis_result["error"],
                "display_data": None
            }
        
        summary = analysis_result["analysis_summary"]
        ai_result = analysis_result["full_ai_result"]
        
        # Format predictions for display
        predictions_display = []
        for pred in ai_result["prediction"]["predictions"][:3]:  # Top 3
            predictions_display.append({
                "label": pred["label"],
                "percentage": f"{pred['percentage']:.1f}%",
                "confidence_bar": self._create_confidence_bar(pred["percentage"])
            })
        
        # Format risk assessment
        risk_display = {
            "level": summary["risk_level"],
            "confidence": summary["confidence_level"],
            "color": self._get_risk_color(summary["risk_level"]),
            "icon": self._get_risk_icon(summary["risk_level"]),
            "message": self._get_risk_message(summary["risk_level"])
        }
        
        # Format recommendations
        recommendations_display = []
        for rec in summary["recommendations"][:5]:  # Top 5
            recommendations_display.append({
                "text": rec,
                "type": self._categorize_recommendation(rec)
            })
        
        return {
            "success": True,
            "error": None,
            "display_data": {
                "predictions": predictions_display,
                "risk_assessment": risk_display,
                "recommendations": recommendations_display,
                "review_status": {
                    "needs_cadre_review": summary["needs_cadre_review"],
                    "needs_doctor_review": summary["needs_doctor_review"]
                },
                "metadata": {
                    "body_region": summary["body_region"],
                    "timestamp": summary["timestamp"],
                    "patient_id": summary["patient_id"]
                }
            }
        }
    
    def _create_confidence_bar(self, percentage: float) -> str:
        """Create a visual confidence bar."""
        bar_length = int(percentage / 5)  # Scale to 20 chars max
        return "█" * bar_length + "░" * (20 - bar_length)
    
    def _get_risk_color(self, risk_level: str) -> str:
        """Get color code for risk level."""
        colors = {
            "URGENT": "#ff4444",
            "HIGH": "#ff8800",
            "MEDIUM": "#ffcc00",
            "LOW": "#44ff44",
            "UNCERTAIN": "#8888ff"
        }
        return colors.get(risk_level, "#888888")
    
    def _get_risk_icon(self, risk_level: str) -> str:
        """Get icon for risk level."""
        icons = {
            "URGENT": "🚨",
            "HIGH": "🔴",
            "MEDIUM": "🟡",
            "LOW": "🟢",
            "UNCERTAIN": "❓"
        }
        return icons.get(risk_level, "⚪")
    
    def _get_risk_message(self, risk_level: str) -> str:
        """Get message for risk level."""
        messages = {
            "URGENT": "Immediate medical attention required",
            "HIGH": "Schedule dermatologist appointment soon",
            "MEDIUM": "Consult healthcare provider within weeks",
            "LOW": "Monitor during regular checkups",
            "UNCERTAIN": "Professional evaluation recommended"
        }
        return messages.get(risk_level, "Professional assessment needed")
    
    def _categorize_recommendation(self, recommendation: str) -> str:
        """Categorize recommendation for styling."""
        if "URGENT" in recommendation or "🚨" in recommendation:
            return "urgent"
        elif "HIGH" in recommendation or "🔴" in recommendation:
            return "high"
        elif "📱" in recommendation or "🧴" in recommendation:
            return "general"
        else:
            return "standard"


# Global instance
lesion_service = SkinLesionService()
