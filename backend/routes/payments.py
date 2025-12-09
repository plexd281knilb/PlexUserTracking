from flask import Blueprint, jsonify

payments_bp = Blueprint('payments', __name__, url_prefix='/api/payment_emails')

@payments_bp.route('/venmo', methods=['GET'])
def venmo():
    return jsonify([])

@payments_bp.route('/zelle', methods=['GET'])
def zelle():
    return jsonify([])

@payments_bp.route('/paypal', methods=['GET'])
def paypal():
    return jsonify([])
