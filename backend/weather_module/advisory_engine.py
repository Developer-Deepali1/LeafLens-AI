from typing import Dict, List
from enum import Enum
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AlertSeverity(Enum):
    CRITICAL = "🔴 Critical"
    HIGH = "🟠 High"
    MEDIUM = "🟡 Medium"
    LOW = "🟢 Low"
    INFO = "ℹ️ Info"

class AdvisoryEngine:
    """Generates weather-based agricultural advisories"""
    
    def __init__(self):
        self.disease_thresholds = {
            'early_blight': {
                'temp_min': 15, 'temp_max': 25,
                'humidity_min': 85, 'rainfall_min': 2.5
            },
            'late_blight': {
                'temp_min': 10, 'temp_max': 20,
                'humidity_min': 90, 'rainfall_min': 2.0
            },
            'powdery_mildew': {
                'temp_min': 15, 'temp_max': 27,
                'humidity_min': 60, 'rainfall_min': 0
            },
            'rust': {
                'temp_min': 5, 'temp_max': 25,
                'humidity_min': 80, 'rainfall_min': 1.5
            },
            'leaf_spot': {
                'temp_min': 20, 'temp_max': 28,
                'humidity_min': 85, 'rainfall_min': 3.0
            }
        }
    
    def assess_disease_risk(self, weather_data: Dict) -> Dict:
        """Assess disease risk based on weather conditions"""
        risks = {}
        
        for disease, thresholds in self.disease_thresholds.items():
            risk_score = self._calculate_risk_score(weather_data, thresholds)
            risk_level = self._score_to_risk_level(risk_score)
            
            risks[disease] = {
                'risk_level': risk_level,
                'risk_score': round(risk_score, 2),
                'management_tips': self._get_management_tips(disease)
            }
        
        return risks
    
    def _calculate_risk_score(self, weather_data: Dict, thresholds: Dict) -> float:
        """Calculate risk score (0-100)"""
        score = 0
        weight_total = 0
        
        if 'temperature' in weather_data and weather_data['temperature']:
            temp = weather_data['temperature']
            if thresholds['temp_min'] <= temp <= thresholds['temp_max']:
                score += 25
            weight_total += 25
        
        if 'humidity' in weather_data and weather_data['humidity']:
            humidity = weather_data['humidity']
            if humidity >= thresholds['humidity_min']:
                score += 35
            weight_total += 35
        
        if 'rainfall' in weather_data and weather_data['rainfall']:
            rainfall = weather_data['rainfall']
            if rainfall >= thresholds['rainfall_min']:
                score += 20
            weight_total += 20
        
        if 'clouds' in weather_data and weather_data['clouds']:
            clouds = weather_data['clouds']
            if clouds >= 70:
                score += 5
            weight_total += 10
        
        return (score / weight_total * 100) if weight_total > 0 else 0
    
    def _score_to_risk_level(self, score: float) -> str:
        """Convert numeric score to risk level"""
        if score >= 80:
            return "Very High ⚠️"
        elif score >= 60:
            return "High ⚠️"
        elif score >= 40:
            return "Moderate"
        elif score >= 20:
            return "Low"
        else:
            return "Very Low ✓"
    
    def _get_management_tips(self, disease: str) -> List[str]:
        """Get disease management recommendations"""
        tips = {
            'early_blight': [
                'Remove infected leaves immediately',
                'Improve air circulation',
                'Apply copper-based fungicide',
                'Practice crop rotation'
            ],
            'late_blight': [
                '🚨 URGENT: Apply systemic fungicide immediately',
                'Remove infected plants',
                'Monitor daily for spread'
            ],
            'powdery_mildew': [
                'Spray sulfur-based fungicide',
                'Increase sunlight exposure',
                'Improve drainage'
            ],
            'rust': [
                'Apply protective fungicide',
                'Remove lower infected leaves',
                'Improve air circulation'
            ],
            'leaf_spot': [
                'Apply copper fungicide',
                'Practice good sanitation',
                'Avoid overhead watering'
            ]
        }
        return tips.get(disease, [])
    
    def generate_advisory(self, location: str, risks: Dict, confidence: float) -> List[Dict]:
        """Generate actionable advisories"""
        advisories = []
        
        for disease, risk_data in risks.items():
            risk_level_str = risk_data['risk_level']
            
            if 'High' in risk_level_str or 'Very High' in risk_level_str:
                severity = self._determine_severity(risk_data['risk_score'], confidence)
                
                advisory = {
                    'disease': disease,
                    'location': location,
                    'risk_level': risk_level_str,
                    'severity': severity.value,
                    'confidence': round(confidence, 2),
                    'message': f"⚠️ {disease.replace('_', ' ').title()} risk detected in {location}",
                    'recommendations': risk_data['management_tips']
                }
                advisories.append(advisory)
        
        return advisories
    
    def _determine_severity(self, risk_score: float, confidence: float) -> AlertSeverity:
        """Determine alert severity"""
        adjusted = risk_score * confidence
        
        if adjusted >= 80:
            return AlertSeverity.CRITICAL
        elif adjusted >= 70:
            return AlertSeverity.HIGH
        elif adjusted >= 50:
            return AlertSeverity.MEDIUM
        elif adjusted >= 30:
            return AlertSeverity.LOW
        else:
            return AlertSeverity.INFO