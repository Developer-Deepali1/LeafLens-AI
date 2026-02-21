"""
Flask Web Application for LeafLens-AI Weather Alert System + Mandi Price Awareness
Run: python app.py
Then open: http://localhost:5000
"""

from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import sys
import os
from datetime import datetime
import json
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add paths
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'weather_module'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'mandi_module'))

try:
    from weather_module.weather_api import WeatherAPI
    from weather_module.advisory_engine import AdvisoryEngine
    from weather_module.confidence_logic import ConfidenceLogic
    from weather_module.utils import WeatherAlertUtils
    from weather_module.location_detector import LocationDetector
    from mandi_module.mandi_api import MandiPriceAPI
    from config.config import OPENWEATHERMAP_API_KEY, DEFAULT_LOCATIONS
    logger.info("✓ All modules imported successfully")
except ImportError as e:
    logger.error(f"✗ Import error: {str(e)}")
    raise

# Initialize Flask app
app = Flask(__name__, 
            template_folder=os.path.join(os.path.dirname(__file__), 'templates'),
            static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# Configuration
app.config['JSON_SORT_KEYS'] = False
CORS(app)

# Initialize modules
logger.info("🚀 Initializing modules...")
try:
    weather_api = WeatherAPI(OPENWEATHERMAP_API_KEY)
    advisory_engine = AdvisoryEngine()
    confidence_logic = ConfidenceLogic()
    location_detector = LocationDetector()
    mandi_api = MandiPriceAPI()
    logger.info("✓ All modules initialized successfully")
except Exception as e:
    logger.error(f"✗ Module initialization error: {str(e)}")
    raise

# ==================== MAIN ROUTES ====================

@app.route('/')
def index():
    """Home page - Weather Dashboard"""
    logger.info("📍 Serving index.html - Weather Dashboard")
    return render_template('index.html')

@app.route('/mandi')
def mandi_dashboard():
    """Mandi Price Dashboard"""
    logger.info("📍 Serving mandi.html - Mandi Price Dashboard")
    return render_template('index.html')

# ==================== WEATHER API ROUTES ====================

@app.route('/api/detect-location', methods=['GET'])
def detect_location():
    """Detect user's current location"""
    try:
        logger.info("🌍 Detecting location...")
        location = location_detector.get_current_location()
        
        if location:
            logger.info(f"✓ Location detected: {location['city']}, {location['country']}")
            return jsonify({
                'success': True,
                'city': location['city'],
                'country': location['country'],
                'region': location['region'],
                'latitude': location['latitude'],
                'longitude': location['longitude']
            }), 200
        else:
            logger.warning("⚠ Could not detect location")
            return jsonify({
                'success': False,
                'message': 'Could not detect location. Please enter manually.'
            }), 400
    except Exception as e:
        logger.error(f"❌ Location detection error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error detecting location: {str(e)}'
        }), 500

@app.route('/api/weather/<city>', methods=['GET'])
def get_weather(city):
    """Fetch weather and analyze disease risk"""
    try:
        logger.info(f"🌤️ Fetching weather for: {city}")
        
        # Validate API key
        if OPENWEATHERMAP_API_KEY == "YOUR_API_KEY_HERE":
            logger.error("❌ API Key not configured")
            return jsonify({
                'success': False,
                'message': 'API Key not configured. Please update config/config.py'
            }), 400
        
        # Fetch weather data
        logger.info(f"📡 Calling weather API for {city}...")
        weather_data = weather_api.get_current_weather(city)
        
        if not weather_data:
            logger.error(f"❌ No weather data for {city}")
            return jsonify({
                'success': False,
                'message': f'Could not fetch weather for {city}. Check city name.'
            }), 400
        
        logger.info(f"✓ Weather data received for {city}")
        
        # Extract weather parameters
        params = weather_api.extract_weather_params(weather_data)
        logger.debug(f"Weather params: {params}")
        
        # Assess disease risk
        logger.info("🔍 Assessing disease risk...")
        risks = advisory_engine.assess_disease_risk(params)
        logger.info(f"✓ {len(risks)} diseases assessed")
        
        # Calculate confidence score
        logger.info("📊 Calculating confidence score...")
        conf = confidence_logic.calculate_confidence(
            model_confidence=0.85,
            api_reliability=0.95,
            data_freshness=5
        )
        logger.info(f"✓ Confidence: {conf['overall_score']:.2f}")
        
        # Generate advisories
        logger.info("📋 Generating advisories...")
        advisories = advisory_engine.generate_advisory(
            location=city,
            risks=risks,
            confidence=conf['overall_score']
        )
        
        # Apply confidence filter
        final_advisories = confidence_logic.apply_confidence_filter(advisories)
        logger.info(f"✓ {len(final_advisories)} advisories generated")
        
        return jsonify({
            'success': True,
            'city': city,
            'weather': {
                'temperature': params.get('temperature'),
                'humidity': params.get('humidity'),
                'rainfall': params.get('rainfall'),
                'wind_speed': params.get('wind_speed'),
                'clouds': params.get('clouds'),
                'condition': params.get('condition'),
                'pressure': params.get('pressure')
            },
            'risks': {
                disease: {
                    'risk_level': data['risk_level'],
                    'risk_score': data['risk_score'],
                    'management_tips': data['management_tips']
                }
                for disease, data in risks.items()
            },
            'confidence': {
                'overall_score': conf['overall_score'],
                'confidence_level': conf['confidence_level'],
                'recommendation': conf['recommendation'],
                'components': conf['components']
            },
            'advisories': final_advisories,
            'timestamp': datetime.now().isoformat()
        }), 200
    
    except Exception as e:
        logger.error(f"❌ Weather error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

@app.route('/api/multi-city', methods=['POST'])
def multi_city_analysis():
    """Analyze multiple cities at once"""
    try:
        logger.info("🌐 Starting multi-city analysis...")
        
        data = request.get_json() or {}
        cities = data.get('cities') or DEFAULT_LOCATIONS
        
        logger.info(f"📍 Analyzing {len(cities)} cities: {cities}")
        
        results = []
        
        for city in cities:
            try:
                logger.info(f"🔄 Processing {city}...")
                
                weather_data = weather_api.get_current_weather(city)
                
                if weather_data:
                    params = weather_api.extract_weather_params(weather_data)
                    risks = advisory_engine.assess_disease_risk(params)
                    conf = confidence_logic.calculate_confidence(
                        model_confidence=0.85,
                        api_reliability=0.95,
                        data_freshness=5
                    )
                    advisories = advisory_engine.generate_advisory(
                        location=city,
                        risks=risks,
                        confidence=conf['overall_score']
                    )
                    final_advisories = confidence_logic.apply_confidence_filter(advisories)
                    
                    results.append({
                        'city': city,
                        'weather': {
                            'temperature': params.get('temperature'),
                            'humidity': params.get('humidity'),
                            'condition': params.get('condition')
                        },
                        'advisories_count': len(final_advisories),
                        'confidence': conf['overall_score'],
                        'advisories': final_advisories
                    })
                    logger.info(f"✓ {city} processed successfully")
            except Exception as e:
                logger.error(f"⚠ Error processing {city}: {str(e)}")
        
        logger.info(f"✓ Multi-city analysis complete: {len(results)} cities processed")
        
        return jsonify({
            'success': True,
            'total_cities': len(cities),
            'processed_cities': len(results),
            'results': results
        }), 200
    
    except Exception as e:
        logger.error(f"❌ Multi-city error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/export/<city>', methods=['GET'])
def export_report(city):
    """Export weather report as JSON"""
    try:
        logger.info(f"📥 Exporting report for {city}...")
        
        weather_data = weather_api.get_current_weather(city)
        
        if not weather_data:
            logger.error(f"❌ No weather data for {city}")
            return jsonify({'success': False, 'message': 'No data available'}), 400
        
        params = weather_api.extract_weather_params(weather_data)
        risks = advisory_engine.assess_disease_risk(params)
        conf = confidence_logic.calculate_confidence(
            model_confidence=0.85,
            api_reliability=0.95,
            data_freshness=5
        )
        advisories = advisory_engine.generate_advisory(
            location=city,
            risks=risks,
            confidence=conf['overall_score']
        )
        
        report = {
            'city': city,
            'timestamp': datetime.now().isoformat(),
            'weather': params,
            'disease_risks': risks,
            'confidence': conf,
            'advisories': advisories
        }
        
        logger.info(f"✓ Report exported for {city}")
        return jsonify(report), 200
    
    except Exception as e:
        logger.error(f"❌ Export error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

# ==================== MANDI PRICE API ROUTES ====================

@app.route('/api/mandi/crops', methods=['GET'])
def get_crops():
    """Get all available crops"""
    try:
        logger.info("🌾 Fetching all crops...")
        crops = mandi_api.get_all_crops()
        logger.info(f"✓ {len(crops)} crops retrieved")
        
        return jsonify({
            'success': True,
            'crops': crops,
            'count': len(crops)
        }), 200
    except Exception as e:
        logger.error(f"❌ Error getting crops: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/mandi/mandis', methods=['GET'])
def get_mandis():
    """Get all available mandis"""
    try:
        logger.info("🏪 Fetching all mandis...")
        mandis = mandi_api.get_all_mandis()
        odisha_mandis = [m for m in mandis if m['state'] == 'Odisha']
        logger.info(f"✓ {len(mandis)} mandis retrieved (including {len(odisha_mandis)} Odisha mandis)")
        
        return jsonify({
            'success': True,
            'mandis': mandis,
            'count': len(mandis)
        }), 200
    except Exception as e:
        logger.error(f"❌ Error getting mandis: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/mandi/add-price', methods=['POST'])
def add_price():
    """Add a new price entry"""
    try:
        data = request.json
        crop_id = data.get('crop_id')
        mandi_id = data.get('mandi_id')
        price = data.get('price')
        
        if not crop_id or not mandi_id or price is None:
            logger.warning("⚠ Missing required fields for price entry")
            return jsonify({
                'success': False,
                'message': 'Missing required fields: crop_id, mandi_id, price'
            }), 400
        
        logger.info(f"💰 Adding price: {crop_id} @ {mandi_id} = ₹{price}")
        result = mandi_api.add_price_entry(crop_id, mandi_id, float(price))
        
        if result['success']:
            logger.info(f"✓ Price entry added successfully")
            return jsonify(result), 200
        else:
            return jsonify(result), 400
    
    except Exception as e:
        logger.error(f"❌ Error adding price: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/mandi/prices/<crop_id>', methods=['GET'])
def get_market_prices(crop_id):
    """Get current prices for a crop across all markets"""
    try:
        logger.info(f"📊 Fetching market prices for {crop_id}...")
        result = mandi_api.get_market_prices(crop_id)
        
        if result['success']:
            logger.info(f"✓ {result['count']} prices retrieved")
            return jsonify(result), 200
        else:
            return jsonify(result), 400
    
    except Exception as e:
        logger.error(f"❌ Error getting market prices: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/mandi/comparison/<crop_id>', methods=['GET'])
def get_price_comparison(crop_id):
    """Get price comparison and statistics"""
    try:
        logger.info(f"📈 Analyzing price comparison for {crop_id}...")
        result = mandi_api.get_price_comparison(crop_id)
        
        if result['success']:
            logger.info(f"✓ Price analysis complete")
            return jsonify(result), 200
        else:
            return jsonify(result), 400
    
    except Exception as e:
        logger.error(f"❌ Error getting price comparison: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/mandi/mandi/<mandi_id>', methods=['GET'])
def get_mandi_all_prices(mandi_id):
    """Get all prices for a specific mandi"""
    try:
        logger.info(f"🏪 Fetching prices for mandi: {mandi_id}...")
        result = mandi_api.get_mandi_prices(mandi_id)
        
        if result['success']:
            logger.info(f"✓ {result['count']} prices retrieved for {result['mandi_name']}")
            return jsonify(result), 200
        else:
            return jsonify(result), 400
    
    except Exception as e:
        logger.error(f"❌ Error getting mandi prices: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/mandi/load-sample-data', methods=['POST'])
def load_sample_data():
    """Load sample price data including Odisha mandis"""
    try:
        logger.info("📊 Loading sample mandi price data...")
        result = mandi_api.load_sample_data()
        
        if result['success']:
            mandis = mandi_api.get_all_mandis()
            crops = mandi_api.get_all_crops()
            odisha_mandis = [m for m in mandis if m['state'] == 'Odisha']
            
            logger.info(f"✓ {result['count']} sample price entries loaded")
            logger.info(f"✓ Including prices for {len(odisha_mandis)} Odisha mandis")
            
            return jsonify({
                'success': True,
                'message': result['message'],
                'count': result['count'],
                'mandis': mandis,
                'crops': crops,
                'odisha_mandis_count': len(odisha_mandis)
            }), 200
        else:
            return jsonify(result), 400
    
    except Exception as e:
        logger.error(f"❌ Error loading sample data: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

# ==================== MISSING ALERT ENDPOINTS ====================

@app.route('/api/mandi/alerts', methods=['GET'])
def get_alerts():
    """Get all active alerts (stub for now)"""
    try:
        logger.info("📢 Fetching active alerts...")
        return jsonify({
            'success': True,
            'alerts': [],
            'count': 0
        }), 200
    except Exception as e:
        logger.error(f"❌ Error getting alerts: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/mandi/set-alert', methods=['POST'])
def set_price_alert():
    """Set a price alert for a crop (stub for now)"""
    try:
        data = request.json
        crop_id = data.get('crop_id')
        target_price = data.get('target_price')
        alert_type = data.get('alert_type', 'above')
        
        if not crop_id or target_price is None:
            return jsonify({
                'success': False,
                'message': 'Missing required fields: crop_id, target_price'
            }), 400
        
        logger.info(f"🔔 Setting alert: {crop_id} - {alert_type} ₹{target_price}")
        
        return jsonify({
            'success': True,
            'message': f'Alert set for {crop_id}'
        }), 200
    
    except Exception as e:
        logger.error(f"❌ Error setting alert: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/mandi/delete-alert/<int:alert_id>', methods=['DELETE'])
def delete_alert(alert_id):
    """Delete an alert (stub for now)"""
    try:
        logger.info(f"🗑️ Deleting alert: {alert_id}")
        
        return jsonify({
            'success': True,
            'message': 'Alert deleted'
        }), 200
    
    except Exception as e:
        logger.error(f"❌ Error deleting alert: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

# ==================== HEALTH CHECK ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        mandis = mandi_api.get_all_mandis()
        crops = mandi_api.get_all_crops()
        
        return jsonify({
            'success': True,
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'modules': {
                'weather_api': 'active',
                'mandi_api': 'active',
                'advisory_engine': 'active'
            },
            'data': {
                'mandis': len(mandis),
                'crops': len(crops)
            }
        }), 200
    except Exception as e:
        logger.error(f"❌ Health check failed: {str(e)}")
        return jsonify({
            'success': False,
            'status': 'unhealthy',
            'message': str(e)
        }), 500

# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(error):
    """404 error handler"""
    logger.warning(f"404 Error: {error}")
    return jsonify({
        'success': False,
        'error': 'Not found',
        'message': 'The requested resource was not found'
    }), 404

@app.errorhandler(500)
def server_error(error):
    """500 error handler"""
    logger.error(f"500 Error: {error}")
    return jsonify({
        'success': False,
        'error': 'Server error',
        'message': 'An internal server error occurred'
    }), 500

@app.errorhandler(400)
def bad_request(error):
    """400 error handler"""
    logger.warning(f"400 Error: {error}")
    return jsonify({
        'success': False,
        'error': 'Bad request',
        'message': 'The request was invalid'
    }), 400

# ==================== STARTUP ====================

def print_banner():
    """Print startup banner"""
    print("\n" + "="*90)
    print("🌾 LEAFLENS-AI SYSTEM - WEATHER ALERTS + MANDI PRICES 🌾".center(90))
    print("="*90)
    print("\n[+] System Status:")
    
    if OPENWEATHERMAP_API_KEY == "YOUR_API_KEY_HERE":
        print("    ⚠️  API Key NOT configured!")
        print("    → Update config/config.py with your OpenWeatherMap API key")
    else:
        print(f"    ✓ API Key configured: {OPENWEATHERMAP_API_KEY[:10]}...")
    
    try:
        mandis = mandi_api.get_all_mandis()
        crops = mandi_api.get_all_crops()
        odisha_mandis = [m for m in mandis if m['state'] == 'Odisha']
        
        print("\n[+] Available Data:")
        print(f"    ✓ Total Mandis: {len(mandis)}")
        print(f"    ✓ Odisha Mandis: {len(odisha_mandis)}")
        print(f"    ✓ Crops Available: {len(crops)}")
    except Exception as e:
        print(f"    ⚠️  Could not load mandi data: {str(e)}")
    
    print("\n[+] Active Modules:")
    print("    ✓ Weather Alert System")
    print("    ✓ Mandi Price System (with Odisha integration)")
    print("    ✓ Disease Risk Assessment")
    print("    ✓ Price Comparison & Analytics")
    
    print("\n[+] Available Endpoints:")
    print("    🌤️  Weather Dashboard: http://localhost:5000")
    print("    💰 Mandi Dashboard: http://localhost:5000/mandi")
    print("    ⚙️  API Health: http://localhost:5000/api/health")
    
    print("\n[+] Quick Links:")
    print("    📡 Get Weather: /api/weather/<city>")
    print("    📊 Price Comparison: /api/mandi/comparison/<crop_id>")
    print("    🏪 Mandi Prices: /api/mandi/prices/<crop_id>")
    print("    📥 Load Sample Data: POST /api/mandi/load-sample-data")
    
    print("\n[+] Controls:")
    print("    ▶️  Server running at http://127.0.0.1:5000")
    print("    ⏹️  Press Ctrl+C to stop the server")
    
    print("\n" + "="*90 + "\n")

if __name__ == '__main__':
    print_banner()
    
    logger.info("🚀 Starting Flask application server...")
    logger.info("📍 Address: http://127.0.0.1:5000")
    
    app.run(
        debug=True,
        host='127.0.0.1',
        port=5000,
        use_reloader=True,
        use_debugger=True
    )