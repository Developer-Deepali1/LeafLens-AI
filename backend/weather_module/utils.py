import json
import logging
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class WeatherAlertUtils:
    """Utility functions for weather alert system"""
    
    @staticmethod
    def validate_location(location: str) -> bool:
        """Validate location format"""
        if isinstance(location, str):
            if ',' in location:
                try:
                    parts = location.split(',')
                    if len(parts) == 2:
                        lat, lon = float(parts[0]), float(parts[1])
                        return -90 <= lat <= 90 and -180 <= lon <= 180
                except ValueError:
                    return False
            return len(location) > 0
        return False
    
    @staticmethod
    def format_advisory_for_display(advisory: Dict) -> str:
        """Format advisory for farmer display"""
        disease = advisory.get('disease', 'Unknown').title().replace('_', ' ')
        severity = advisory.get('severity', 'Unknown')
        location = advisory.get('location', '')
        confidence = advisory.get('confidence', 0) * 100
        
        formatted = f"""
{'='*70}
DISEASE ALERT NOTIFICATION
{'='*70}
Disease: {disease.upper()}
Location: {location}
Severity Level: {severity}
Confidence: {confidence:.1f}%

Alert Message: {advisory.get('message', '')}

RECOMMENDED ACTIONS:
"""
        for i, rec in enumerate(advisory.get('recommendations', []), 1):
            formatted += f"\n   {i}. {rec}"
        
        formatted += f"\n\nGenerated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        formatted += f"{'='*70}\n"
        
        return formatted
    
    @staticmethod
    def export_to_json(data: List[Dict], filepath: str) -> bool:
        """Export advisories to JSON file"""
        try:
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2, default=str)
            logger.info(f"Exported to {filepath}")
            return True
        except Exception as e:
            logger.error(f"Export failed: {str(e)}")
            return False
    
    @staticmethod
    def export_to_txt(advisories: List[Dict], filepath: str) -> bool:
        """Export advisories to text file"""
        try:
            with open(filepath, 'w') as f:
                for adv in advisories:
                    f.write(WeatherAlertUtils.format_advisory_for_display(adv))
                    f.write("\n\n")
            logger.info(f"Exported to {filepath}")
            return True
        except Exception as e:
            logger.error(f"Export failed: {str(e)}")
            return False