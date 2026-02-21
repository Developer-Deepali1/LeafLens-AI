"""
Main demo script to test Weather Alert System on Windows
Run: python main_demo.py
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
from config.config import OPENWEATHERMAP_API_KEY, DEFAULT_LOCATIONS

def print_header(title):
    """Print formatted header"""
    print("\n" + "="*80)
    print(f"  {title}".center(80))
    print("="*80 + "\n")

def demo_with_api_key():
    """Run demo with real API key"""
    print_header("LEAFLENS-AI WEATHER ALERT SYSTEM - LIVE DEMO")
    
    if OPENWEATHERMAP_API_KEY == "YOUR_API_KEY_HERE":
        print("ERROR: API Key not configured!")
        print("\nTo use this demo:")
        print("   1. Go to: https://openweathermap.org/api")
        print("   2. Sign up for free account")
        print("   3. Get your API key")
        print("   4. Update config/config.py with your API key")
        print("   5. Run: python main_demo.py\n")
        return False
    
    # Initialize modules
    weather_api = WeatherAPI(OPENWEATHERMAP_API_KEY)
    advisory_engine = AdvisoryEngine()
    confidence_logic = ConfidenceLogic()
    
    # Process locations
    all_advisories = []
    
    for location in DEFAULT_LOCATIONS:
        print(f"\n[*] Processing: {location}")
        print("-" * 80)
        
        # Get weather
        weather_data = weather_api.get_current_weather(location)
        
        if not weather_data:
            print(f"   [-] Failed to fetch weather for {location}")
            continue
        
        # Extract parameters
        params = weather_api.extract_weather_params(weather_data)
        
        # Display weather data
        print(f"   Temperature: {params.get('temperature')}C")
        print(f"   Humidity: {params.get('humidity')}%")
        print(f"   Rainfall: {params.get('rainfall')} mm")
        print(f"   Wind Speed: {params.get('wind_speed')} m/s")
        print(f"   Cloud Cover: {params.get('clouds')}%")
        print(f"   Condition: {params.get('condition')}")
        
        # Assess disease risk
        risks = advisory_engine.assess_disease_risk(params)
        
        print(f"\n   Disease Risk Assessment:")
        for disease, risk_data in risks.items():
            print(f"      * {disease.replace('_', ' ').title()}: {risk_data['risk_level']} "
                  f"(Score: {risk_data['risk_score']}/100)")
        
        # Calculate confidence
        conf = confidence_logic.calculate_confidence(
            model_confidence=0.85,
            api_reliability=0.95,
            data_freshness=5
        )
        
        print(f"\n   Confidence Assessment:")
        print(f"      Overall Score: {conf['overall_score']} ({conf['confidence_level']})")
        print(f"      Model Confidence: {conf['components']['model_confidence']}")
        print(f"      API Reliability: {conf['components']['api_reliability']}")
        print(f"      Recommendation: {conf['recommendation']}")
        
        # Generate advisories - FIXED: changed confidence_score to confidence
        advisories = advisory_engine.generate_advisory(
            location=location,
            risks=risks,
            confidence=conf['overall_score']
        )
        
        # Filter by confidence
        final_advisories = confidence_logic.apply_confidence_filter(advisories)
        
        if final_advisories:
            print(f"\n   [+] Generated {len(final_advisories)} Advisory(ies):")
            for adv in final_advisories:
                print(f"\n{WeatherAlertUtils.format_advisory_for_display(adv)}")
                all_advisories.append(adv)
        else:
            print(f"\n   [+] No high-risk advisories generated")
    
    # Export results
    print_header("EXPORT & SAVE RESULTS")
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Save to JSON
    json_file = f"output/advisories_{timestamp}.json"
    WeatherAlertUtils.export_to_json(all_advisories, json_file)
    
    # Save to TXT
    txt_file = f"output/advisories_{timestamp}.txt"
    WeatherAlertUtils.export_to_txt(all_advisories, txt_file)
    
    print(f"\n[+] Results saved:")
    print(f"    JSON: {json_file}")
    print(f"    TXT: {txt_file}")
    
    return True

def demo_without_api_key():
    """Run demo with mock data (no API key needed)"""
    print_header("LEAFLENS-AI WEATHER ALERT SYSTEM - MOCK DEMO")
    print("(No internet required - using sample weather data)\n")
    
    # Initialize modules
    advisory_engine = AdvisoryEngine()
    confidence_logic = ConfidenceLogic()
    
    # Mock weather data
    mock_weather_data = {
        'Delhi': {
            'temperature': 18,
            'humidity': 92,
            'rainfall': 3.5,
            'wind_speed': 8,
            'clouds': 85,
            'condition': 'Cloudy'
        },
        'Pune': {
            'temperature': 22,
            'humidity': 88,
            'rainfall': 2.0,
            'wind_speed': 6,
            'clouds': 70,
            'condition': 'Rainy'
        },
        'Bangalore': {
            'temperature': 25,
            'humidity': 70,
            'rainfall': 0.5,
            'wind_speed': 5,
            'clouds': 40,
            'condition': 'Partly Cloudy'
        },
        'Chennai': {
            'temperature': 28,
            'humidity': 75,
            'rainfall': 1.5,
            'wind_speed': 7,
            'clouds': 50,
            'condition': 'Sunny'
        },
        'Ludhiana': {
            'temperature': 16,
            'humidity': 95,
            'rainfall': 4.0,
            'wind_speed': 9,
            'clouds': 90,
            'condition': 'Rainy'
        }
    }
    
    all_advisories = []
    
    for location, weather_params in mock_weather_data.items():
        print(f"\n[*] Processing: {location}")
        print("-" * 80)
        
        # Display weather
        print(f"   Temperature: {weather_params['temperature']}C")
        print(f"   Humidity: {weather_params['humidity']}%")
        print(f"   Rainfall: {weather_params['rainfall']} mm")
        print(f"   Wind Speed: {weather_params['wind_speed']} m/s")
        print(f"   Cloud Cover: {weather_params['clouds']}%")
        print(f"   Condition: {weather_params['condition']}")
        
        # Assess risk
        risks = advisory_engine.assess_disease_risk(weather_params)
        
        print(f"\n   Disease Risk Assessment:")
        for disease, risk_data in risks.items():
            print(f"      * {disease.replace('_', ' ').title()}: {risk_data['risk_level']} "
                  f"(Score: {risk_data['risk_score']}/100)")
        
        # Calculate confidence
        conf = confidence_logic.calculate_confidence(
            model_confidence=0.82,
            api_reliability=1.0,
            data_freshness=10
        )
        
        print(f"\n   Confidence Assessment:")
        print(f"      Overall Score: {conf['overall_score']} ({conf['confidence_level']})")
        print(f"      Recommendation: {conf['recommendation']}")
        
        # Generate advisories - FIXED: changed confidence_score to confidence
        advisories = advisory_engine.generate_advisory(
            location=location,
            risks=risks,
            confidence=conf['overall_score']
        )
        
        filtered = confidence_logic.apply_confidence_filter(advisories)
        
        if filtered:
            print(f"\n   [+] Generated {len(filtered)} Advisory(ies):")
            for adv in filtered:
                print(f"\n{WeatherAlertUtils.format_advisory_for_display(adv)}")
                all_advisories.append(adv)
        else:
            print(f"\n   [+] No high-risk advisories")
    
    # Export
    print_header("EXPORT & SAVE RESULTS")
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    json_file = f"output/mock_advisories_{timestamp}.json"
    txt_file = f"output/mock_advisories_{timestamp}.txt"
    
    WeatherAlertUtils.export_to_json(all_advisories, json_file)
    WeatherAlertUtils.export_to_txt(all_advisories, txt_file)
    
    print(f"\n[+] Results saved:")
    print(f"    JSON: {json_file}")
    print(f"    TXT: {txt_file}")

def main():
    """Main entry point"""
    print("\n" + "="*80)
    print("LEAFLENS-AI WEATHER ALERT SYSTEM".center(80))
    print("="*80)
    
    print("\nSelect mode:")
    print("  1. Live mode (requires OpenWeatherMap API key)")
    print("  2. Mock mode (no API needed - demo with sample data)")
    print("  3. Exit")
    
    choice = input("\nEnter your choice (1-3): ").strip()
    
    if choice == '1':
        success = demo_with_api_key()
        if not success:
            print("\nTip: You can still run in mock mode (choice 2) to see the system working!")
    elif choice == '2':
        demo_without_api_key()
    elif choice == '3':
        print("Goodbye!")
    else:
        print("Invalid choice!")
    
    print("\n" + "="*80 + "\n")

if __name__ == "__main__":
    main()