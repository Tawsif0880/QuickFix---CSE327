from flask import request, jsonify
from app.credits import credits_bp
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from app.models.user import User
from app.models.customer import Customer


@credits_bp.route('/balance', methods=['GET'])
@jwt_required()
def get_balance():
    """Get current customer credit balance"""
    current_user = get_jwt_identity()
    user = User.query.get(current_user['id'])
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user.role != 'customer':
        return jsonify({'error': 'Customer access required'}), 403
    
    if not user.customer:
        return jsonify({'error': 'Customer profile not found'}), 404
    
    return jsonify({
        'credits': user.customer.credits
    }), 200


@credits_bp.route('/purchase', methods=['POST'])
@jwt_required()
def purchase_credits():
    """Purchase credits using bank transfer (simulated)"""
    current_user = get_jwt_identity()
    user = User.query.get(current_user['id'])
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user.role != 'customer':
        return jsonify({'error': 'Customer access required'}), 403
    
    if not user.customer:
        return jsonify({'error': 'Customer profile not found'}), 404
    
    data = request.get_json()
    
    # Validate required fields
    if not data.get('amount'):
        return jsonify({'error': 'Credit amount is required'}), 400
    
    if not data.get('payment_method'):
        return jsonify({'error': 'Payment method is required'}), 400
    
    amount = int(data['amount'])
    payment_method = data['payment_method'].lower()
    
    # Validate amount (must be one of the predefined packages)
    valid_packages = [50, 100, 250]
    if amount not in valid_packages:
        return jsonify({'error': f'Invalid credit amount. Must be one of: {valid_packages}'}), 400
    
    # Validate payment method
    if payment_method != 'bank_transfer':
        return jsonify({'error': 'Only Bank Transfer payment method is supported'}), 400
    
    try:
        # Add credits immediately (simulated bank transfer - no verification)
        customer = user.customer
        customer.credits += amount
        db.session.commit()
        
        return jsonify({
            'message': 'Credits purchased successfully',
            'credits': customer.credits,
            'amount_added': amount
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

