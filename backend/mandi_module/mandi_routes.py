from flask import Blueprint, jsonify, request
import logging
from .mandi_api import MandiPriceAPI

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
mandi_bp = Blueprint('mandi', __name__, url_prefix='/api/mandi')

# Initialize API
api = MandiPriceAPI()

# ==================== SAMPLE DATA ====================

@mandi_bp.route('/load-sample-data', methods=['POST'])
def load_sample_data():
    """Load sample mandi price data"""
    try:
        logger.info("📊 Loading sample data...")
        result = api.load_sample_data()
        
        if result['success']:
            # Get the loaded data to return
            mandis = api.get_all_mandis()
            crops = api.get_all_crops()
            
            return jsonify({
                'success': True,
                'message': result['message'],
                'count': result['count'],
                'mandis': mandis,
                'crops': crops
            }), 200
        else:
            return jsonify(result), 400
    except Exception as e:
        logger.error(f"❌ Error loading sample data: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

# ==================== MANDIS ====================

@mandi_bp.route('/mandis', methods=['GET'])
def get_mandis():
    """Get all mandis"""
    try:
        mandis = api.get_all_mandis()
        return jsonify({
            'success': True,
            'mandis': mandis,
            'count': len(mandis)
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ==================== CROPS ====================

@mandi_bp.route('/crops', methods=['GET'])
def get_crops():
    """Get all crops"""
    try:
        crops = api.get_all_crops()
        return jsonify({
            'success': True,
            'crops': crops,
            'count': len(crops)
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ==================== PRICES ====================

@mandi_bp.route('/add-price', methods=['POST'])
def add_price():
    """Add a new price entry"""
    try:
        data = request.json
        crop_id = data.get('crop_id')
        mandi_id = data.get('mandi_id')
        price = data.get('price')
        
        if not all([crop_id, mandi_id, price]):
            return jsonify({
                'success': False,
                'message': 'Missing required fields: crop_id, mandi_id, price'
            }), 400
        
        result = api.add_price_entry(crop_id, mandi_id, float(price))
        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@mandi_bp.route('/prices/<crop_id>', methods=['GET'])
def get_prices(crop_id):
    """Get prices for a crop"""
    try:
        result = api.get_market_prices(crop_id)
        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@mandi_bp.route('/comparison/<crop_id>', methods=['GET'])
def get_comparison(crop_id):
    """Get price comparison for a crop"""
    try:
        result = api.get_price_comparison(crop_id)
        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@mandi_bp.route('/mandi-prices/<mandi_id>', methods=['GET'])
def get_mandi_prices(mandi_id):
    """Get prices for a mandi"""
    try:
        result = api.get_mandi_prices(mandi_id)
        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500