"""
Model configuration for SeekWell skin cancer classification model.
"""

from typing import Dict, List, Optional
import os

# Model configuration
MODEL_CONFIG = {
    "model_name": "bnmbanhmi/seekwell_skincancer_v2",
    "base_model_name": "Anwarkh1/Skin_Cancer-Image_Classification",
    "processor_name": "google/vit-base-patch16-224",
    "device": "cpu",  # Can be changed to "cuda" if GPU available
    "input_size": (224, 224),
    "use_fast_processor": True
}

# Class labels mapping (updated based on your model)
CLASS_LABELS = {
    0: "ACK (Actinic keratoses)",
    1: "BCC (Basal cell carcinoma)", 
    2: "MEL (Melanoma)",
    3: "NEV (Nevus/Mole)",
    4: "SCC (Squamous cell carcinoma)",
    5: "SEK (Seborrheic keratosis)"
}

# Risk levels mapping
RISK_LEVELS = {
    "ACK (Actinic keratoses)": "MEDIUM",
    "BCC (Basal cell carcinoma)": "HIGH", 
    "MEL (Melanoma)": "URGENT",
    "NEV (Nevus/Mole)": "LOW",
    "SCC (Squamous cell carcinoma)": "HIGH",
    "SEK (Seborrheic keratosis)": "LOW"
}

# Confidence thresholds
CONFIDENCE_THRESHOLDS = {
    "HIGH_CONFIDENCE": 0.8,
    "MEDIUM_CONFIDENCE": 0.6,
    "LOW_CONFIDENCE": 0.4,
    "VERY_LOW_CONFIDENCE": 0.2
}

# Risk assessment parameters
RISK_ASSESSMENT_CONFIG = {
    "urgent_threshold": 0.3,  # Melanoma or high-risk lesions above this confidence
    "professional_review_threshold": 0.5,  # All predictions below this need review
    "high_risk_regions": ["face", "neck", "hands", "feet", "genitals"],
    "follow_up_days": {
        "URGENT": 1,
        "HIGH": 7,
        "MEDIUM": 30,
        "LOW": 90
    }
}

# Recommendations based on predictions
RECOMMENDATIONS = {
    "MEL (Melanoma)": [
        "⚠️ URGENT: Seek immediate medical attention",
        "Contact a dermatologist within 24 hours",
        "This type of lesion requires urgent evaluation",
        "Do not delay - early detection saves lives"
    ],
    "BCC (Basal cell carcinoma)": [
        "Schedule appointment with dermatologist soon",
        "This requires professional medical evaluation",
        "Treatment is very effective when caught early",
        "Follow-up within 1-2 weeks recommended"
    ],
    "SCC (Squamous cell carcinoma)": [
        "Schedule dermatologist appointment promptly",
        "Professional evaluation needed",
        "Early treatment prevents complications",
        "Monitor for rapid growth or changes"
    ],
    "ACK (Actinic keratoses)": [
        "Monitor for changes in size, color, or texture",
        "Use sun protection to prevent progression",
        "Consider dermatologist consultation",
        "Regular skin checks recommended"
    ],
    "SEK (Seborrheic keratosis)": [
        "Generally benign but monitor for changes",
        "Routine skin check sufficient",
        "Use sun protection",
        "Follow-up if lesion changes significantly"
    ],
    "NEV (Nevus/Mole)": [
        "Common benign moles - monitor regularly",
        "Use ABCDE rule for monitoring changes",
        "Regular self-examination recommended",
        "Annual dermatologist check if many moles"
    ]
}

# Model metadata
MODEL_METADATA = {
    "version": "2.0",
    "accuracy": 0.69,
    "training_date": "2024",
    "description": "Fine-tuned Vision Transformer for skin cancer classification",
    "dataset": "ISIC skin cancer dataset",
    "architecture": "Vision Transformer (ViT)",
    "total_classes": 6
}

def get_risk_level(predicted_class: str, confidence: float, body_region: Optional[str] = None) -> str:
    """
    Determine risk level based on prediction, confidence, and body region.
    
    Args:
        predicted_class: The predicted skin lesion class
        confidence: Model confidence score (0-1)
        body_region: Optional body region where lesion is located
        
    Returns:
        Risk level: URGENT, HIGH, MEDIUM, LOW, or UNCERTAIN
    """
    base_risk = RISK_LEVELS.get(predicted_class, "UNCERTAIN")
    
    # Upgrade risk for high-risk body regions
    if body_region and body_region.lower() in RISK_ASSESSMENT_CONFIG["high_risk_regions"]:
        if base_risk == "LOW":
            base_risk = "MEDIUM"
        elif base_risk == "MEDIUM":
            base_risk = "HIGH"
    
    # Handle low confidence predictions
    if confidence < CONFIDENCE_THRESHOLDS["LOW_CONFIDENCE"]:
        return "UNCERTAIN"
    
    # Urgent cases: Melanoma with reasonable confidence
    if "MEL" in predicted_class and confidence > RISK_ASSESSMENT_CONFIG["urgent_threshold"]:
        return "URGENT"
    
    return base_risk

def get_confidence_level(confidence: float) -> str:
    """
    Convert numerical confidence to categorical level.
    
    Args:
        confidence: Model confidence score (0-1)
        
    Returns:
        Confidence level: VERY_LOW, LOW, MEDIUM, or HIGH
    """
    if confidence >= CONFIDENCE_THRESHOLDS["HIGH_CONFIDENCE"]:
        return "HIGH"
    elif confidence >= CONFIDENCE_THRESHOLDS["MEDIUM_CONFIDENCE"]:
        return "MEDIUM"
    elif confidence >= CONFIDENCE_THRESHOLDS["LOW_CONFIDENCE"]:
        return "LOW"
    else:
        return "VERY_LOW"

def needs_professional_review(predicted_class: str, confidence: float) -> bool:
    """
    Determine if prediction needs professional review.
    
    Args:
        predicted_class: The predicted skin lesion class
        confidence: Model confidence score (0-1)
        
    Returns:
        True if professional review needed
    """
    # Always review high-risk lesions
    if any(risk_type in predicted_class for risk_type in ["MEL", "BCC", "SCC"]):
        return True
    
    # Review low confidence predictions
    if confidence < RISK_ASSESSMENT_CONFIG["professional_review_threshold"]:
        return True
    
    return False

def get_recommendations(predicted_class: str, confidence: float, body_region: Optional[str] = None) -> List[str]:
    """
    Get recommendations based on prediction results.
    
    Args:
        predicted_class: The predicted skin lesion class
        confidence: Model confidence score (0-1)
        body_region: Optional body region where lesion is located
        
    Returns:
        List of recommendation strings
    """
    base_recommendations = RECOMMENDATIONS.get(predicted_class, [
        "Unknown lesion type detected",
        "Professional medical evaluation recommended",
        "Monitor for any changes",
        "Follow-up with healthcare provider"
    ]).copy()
    
    # Add confidence-based recommendations
    if confidence < CONFIDENCE_THRESHOLDS["MEDIUM_CONFIDENCE"]:
        base_recommendations.append("⚠️ Low confidence prediction - professional review strongly recommended")
    
    # Add body region specific recommendations
    if body_region and body_region.lower() in RISK_ASSESSMENT_CONFIG["high_risk_regions"]:
        base_recommendations.append(f"📍 Lesion in high-visibility area ({body_region}) - consider aesthetic concerns")
    
    return base_recommendations
