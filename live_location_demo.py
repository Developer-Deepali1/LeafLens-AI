"""
Live Location Demo - Fetches weather for your current location
Run: python live_location_demo.py
"""

import sys
import os
from datetime import datetime

# Add paths
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'weather_module'))

from weather_module.weather_api import WeatherAPI
from weather_module.advisory_engine import AdvisoryEngine
from weather_module.confidence_logic import ConfidenceLogic
from weather_module.utils import WeatherAlertUtils
from weather_module.location_detector import LocationDetector
from config.config import OPENWEATHERMAP_API_KEY

def print_header(title):
    """Print formatted header"""
    print("\n" + "="*80)
    print(f"  {title}".center(80))
    print("="*80 + "\n")

def demo_live_location():
    """Run demo with live location detection"""
    print_header("LEAFLENS-AI WEATHER ALERT SYSTEM - LIVE LOCATION MODE")
    
    if OPENWEATHERMAP_API_KEY == "YOUR_API_KEY_HERE":
        print("ERROR: API Key not configured!")
        print("\nTo use this demo:")
        print("   1. Go to: https://openweathermap.org/api")
        print("   2. Sign up for free account")
        print("   3. Get your API key")
        print("   4. Update config/config.py with your API key")
        print("   5. Run: python live_location_demo.py\n")
        return False
    
    # Step 1: Detect current location
    print("[*] Detecting your current location...")
    print("-" * 80)
    
    location_detector = LocationDetector()
    location_info = location_detector.get_current_location()
    
    if not location_info:
        print("✗ Failed to detect your location")
        print("Please enter your city name manually:")
        city_name = input("Enter city name: ").strip()
        if not city_name:
            print("No city provided. Exiting.")
            return False
    else:
        city_name = location_info['city']
        print(f"✓ Location detected!")
        print(f"   City: {location_info['city']}")
        print(f"   Region: {location_info['region']}")
        print(f"   Country: {location_info['country']}")
        print(f"   Coordinates: {location_info['latitude']}, {location_info['longitude']}")
    
    # Step 2: Initialize modules
    weather_api = WeatherAPI(OPENWEATHERMAP_API_KEY)
    advisory_engine = AdvisoryEngine()
    confidence_logic = ConfidenceLogic()
    
    # Step 3: Fetch weather for detected location
    print(f"\n[*] Fetching weather data for {city_name}...")
    print("-" * 80)
    
    weather_data = weather_api.get_current_weather(city_name)
    
    if not weather_data:
        print(f"✗ Failed to fetch weather for {city_name}")
        return False
    
    # Extract parameters
    params = weather_api.extract_weather_params(weather_data)
    
    # Display weather data
    print(f"✓ Weather data received!")
    print(f"\n   Temperature: {params.get('temperature')}°C")
    print(f"   Humidity: {params.get('humidity')}%")
    print(f"   Rainfall: {params.get('rainfall')} mm")
    print(f"   Wind Speed: {params.get('wind_speed')} m/s")
    print(f"   Cloud Cover: {params.get('clouds')}%")
    print(f"   Pressure: {params.get('pressure')} hPa")
    print(f"   Condition: {params.get('condition')}")
    
    # Step 4: Assess disease risk
    print(f"\n[*] Analyzing disease risk...")
    print("-" * 80)
    
    risks = advisory_engine.assess_disease_risk(params)
    
    print(f"\nDisease Risk Assessment for {city_name}:")
    for disease, risk_data in risks.items():
        print(f"   • {disease.replace('_', ' ').title()}: {risk_data['risk_level']} "
              f"(Score: {risk_data['risk_score']}/100)")
    
    # Step 5: Calculate confidence
    print(f"\n[*] Calculating confidence score...")
    print("-" * 80)
    
    conf = confidence_logic.calculate_confidence(
        model_confidence=0.85,
        api_reliability=0.95,
        data_freshness=5
    )
    
    print(f"\nConfidence Assessment:")
    print(f"   Overall Score: {conf['overall_score']} ({conf['confidence_level']})")
    print(f"   Model Confidence: {conf['components']['model_confidence']}")
    print(f"   API Reliability: {conf['components']['api_reliability']}")
    print(f"   Historical Accuracy: {conf['components']['historical_accuracy']}")
    print(f"   Data Freshness: {conf['components']['data_freshness_score']}")
    print(f"   Recommendation: {conf['recommendation']}")
    
    # Step 6: Generate advisories
    print(f"\n[*] Generating advisories...")
    print("-" * 80)
    
    advisories = advisory_engine.generate_advisory(
        location=city_name,
        risks=risks,
        confidence=conf['overall_score']
    )
    
    # Filter by confidence
    final_advisories = confidence_logic.apply_confidence_filter(advisories)
    
    print(f"\nAdvisories Generated: {len(final_advisories)}")
    
    if final_advisories:
        print(f"\n[+] Generated {len(final_advisories)} Advisory(ies):\n")
        for adv in final_advisories:
            print(WeatherAlertUtils.format_advisory_for_display(adv))
    else:
        print(f"\n[+] No high-risk advisories for current weather conditions")
        print("   This means the weather is favorable for crops at the moment.")
    
    # Step 7: Export results
    print_header("EXPORT & SAVE RESULTS")
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Save to JSON
    json_file = f"output/live_location_advisories_{timestamp}.json"
    WeatherAlertUtils.export_to_json(final_advisories, json_file)
    
    # Save to TXT
    txt_file = f"output/live_location_advisories_{timestamp}.txt"
    WeatherAlertUtils.export_to_txt(final_advisories, txt_file)
    
    print(f"[+] Results saved:")
    print(f"    JSON: {json_file}")
    print(f"    TXT: {txt_file}")
    print(f"\n[+] You can view these files in the output/ folder")
    
    return True

def main():
    """Main entry point"""
    print("\n" + "="*80)
    print("LEAFLENS-AI WEATHER ALERT SYSTEM - LIVE LOCATION".center(80))
    print("="*80)
    
    demo_live_location()
    
    print("\n" + "="*80 + "\n")

if __name__ == "__main__":
    main()