from flask import jsonify, current_app
from app.system import system_bp
from datetime import datetime


@system_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify API is running"""
    return jsonify({
        'status': 'healthy',
        'message': 'Quick Fix API is running',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'version': '1.0.0'
    }), 200


@system_bp.route('/routes', methods=['GET'])
def list_routes():
    """List all available API routes"""
    routes = []
    
    # Iterate through all registered routes in the Flask app
    for rule in current_app.url_map.iter_rules():
        # Skip static files and internal Flask routes
        if rule.endpoint == 'static' or rule.endpoint.startswith('_'):
            continue
        
        # Get the methods, excluding HEAD and OPTIONS (auto-generated)
        methods = [method for method in rule.methods if method not in ['HEAD', 'OPTIONS']]
        
        route_info = {
            'path': str(rule.rule),
            'methods': sorted(methods),
            'endpoint': rule.endpoint
        }
        
        routes.append(route_info)
    
    # Sort routes by path for better readability
    routes.sort(key=lambda x: x['path'])
    
    return jsonify({
        'message': 'Quick Fix API Routes',
        'total_routes': len(routes),
        'routes': routes
    }), 200


@system_bp.route('/', methods=['GET'])
@system_bp.route('/api', methods=['GET'])
def api_info():
    """API information endpoint"""
    return jsonify({
        'name': 'Quick Fix API',
        'version': '1.0.0',
        'description': 'Backend API for Quick Fix - On-demand service platform',
        'documentation': {
            'health_check': '/health',
            'routes_list': '/routes'
        },
        'status': 'operational',
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    }), 200
