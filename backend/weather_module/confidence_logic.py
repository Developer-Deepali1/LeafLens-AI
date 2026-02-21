from typing import Dict, List, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ConfidenceLogic:
    """Manages confidence scoring for weather alerts"""
    
    def __init__(self):
        self.min_confidence_threshold = 0.40
        self.prediction_history = []
    
    def calculate_confidence(
        self,
        model_confidence: float,
        api_reliability: float,
        historical_accuracy: Optional[float] = None,
        data_freshness: int = 0
    ) -> Dict:
        """Calculate overall confidence score"""
        
        weights = {
            'model': 0.40,
            'api': 0.25,
            'history': 0.20,
            'freshness': 0.15
        }
        
        freshness_score = self._calculate_freshness_score(data_freshness)
        
        if historical_accuracy is None:
            historical_accuracy = 0.75
        
        final_score = (
            model_confidence * weights['model'] +
            api_reliability * weights['api'] +
            historical_accuracy * weights['history'] +
            freshness_score * weights['freshness']
        )
        
        return {
            'overall_score': round(final_score, 3),
            'components': {
                'model_confidence': round(model_confidence, 3),
                'api_reliability': round(api_reliability, 3),
                'historical_accuracy': round(historical_accuracy, 3),
                'data_freshness_score': round(freshness_score, 3)
            },
            'confidence_level': self._score_to_confidence_level(final_score),
            'should_alert': final_score >= self.min_confidence_threshold,
            'recommendation': self._get_recommendation(final_score)
        }
    
    def _calculate_freshness_score(self, minutes_old: int) -> float:
        """Score data freshness"""
        if minutes_old <= 30:
            return 1.0
        elif minutes_old <= 60:
            return 0.95
        elif minutes_old <= 120:
            return 0.85
        elif minutes_old <= 360:
            return 0.70
        elif minutes_old <= 1440:
            return 0.40
        else:
            return 0.20
    
    def _score_to_confidence_level(self, score: float) -> str:
        """Convert score to confidence level"""
        if score >= 0.85:
            return "Very High 💯"
        elif score >= 0.70:
            return "High ✓"
        elif score >= 0.55:
            return "Moderate"
        elif score >= 0.40:
            return "Low"
        else:
            return "Very Low"
    
    def _get_recommendation(self, score: float) -> str:
        """Get recommendation based on confidence"""
        if score >= 0.85:
            return "Act immediately on advisory"
        elif score >= 0.70:
            return "Follow advisory with priority"
        elif score >= 0.55:
            return "Monitor closely and validate locally"
        else:
            return "Use as reference only"
    
    def apply_confidence_filter(
        self,
        advisories: List[Dict],
        min_confidence: float = 0.40
    ) -> List[Dict]:
        """Filter advisories by confidence threshold"""
        filtered = [
            a for a in advisories
            if a.get('confidence', 0) >= min_confidence
        ]
        
        logger.info(f"Filtered {len(advisories)} to {len(filtered)} advisories")
        return filtered