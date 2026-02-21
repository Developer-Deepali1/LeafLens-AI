"""
Module to detect user's current location using IP geolocation
No additional packages required - uses free API
"""

import requests
import logging
from typing import Dict, Optional, Tuple

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LocationDetector:
    """Detects user's current location using IP geolocation"""
    
    def __init__(self):
        # Free geolocation APIs (no API key needed)
        self.primary_url = "https://ipapi.co/json/"
        self.backup_url = "https://ip-api.com/json/"
        self.timeout = 5
    
    def get_current_location(self) -> Optional[Dict]:
        """
        Get current location using IP geolocation
        
        Returns:
            Dictionary with city, latitude, longitude, country
        """
        # Try primary API first
        location_info = self._fetch_from_ipapi()
        
        # If primary fails, try backup API
        if not location_info:
            location_info = self._fetch_from_ip_api_backup()
        
        return location_info
    
    def _fetch_from_ipapi(self) -> Optional[Dict]:
        """Fetch location from ipapi.co"""
        try:
            response = requests.get(self.primary_url, timeout=self.timeout)
            
            if response.status_code == 200:
                data = response.json()
                location_info = {
                    'city': data.get('city'),
                    'country': data.get('country_name'),
                    'latitude': data.get('latitude'),
                    'longitude': data.get('longitude'),
                    'region': data.get('region'),
                    'isp': data.get('org')
                }
                logger.info(f"✓ Location detected: {location_info['city']}, {location_info['country']}")
                return location_info
            
        except requests.exceptions.RequestException as e:
            logger.warning(f"Primary API failed: {str(e)}")
        
        return None
    
    def _fetch_from_ip_api_backup(self) -> Optional[Dict]:
        """Fetch location from ip-api.com (backup)"""
        try:
            response = requests.get(self.backup_url, timeout=self.timeout)
            
            if response.status_code == 200:
                data = response.json()
                location_info = {
                    'city': data.get('city'),
                    'country': data.get('country'),
                    'latitude': data.get('lat'),
                    'longitude': data.get('lon'),
                    'region': data.get('regionName'),
                    'isp': data.get('isp')
                }
                logger.info(f"✓ Location detected: {location_info['city']}, {location_info['country']}")
                return location_info
            
        except requests.exceptions.RequestException as e:
            logger.warning(f"Backup API failed: {str(e)}")
        
        return None
    
    def get_city_name(self) -> Optional[str]:
        """Get only the city name"""
        location = self.get_current_location()
        if location and location['city']:
            return location['city']
        return None
    
    def get_coordinates(self) -> Optional[Tuple[float, float]]:
        """Get latitude and longitude"""
        location = self.get_current_location()
        if location and location['latitude'] and location['longitude']:
            return (location['latitude'], location['longitude'])
        return None
    
    def get_location_summary(self) -> str:
        """Get formatted location summary"""
        location = self.get_current_location()
        if location:
            return f"{location['city']}, {location['region']}, {location['country']}"
        return "Unknown Location"