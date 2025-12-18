from flask import Blueprint, jsonify, request
from integrations import fetch_venmo_payments, fetch_paypal_payments, fetch_zelle_payments, process_payment
from database import load_users, load_payment_logs, save_users, save_data

payments_bp = Blueprint('payments', __name__, url_prefix='/api/payments')

@payments_bp.route('/venmo/fetch', methods=['POST'])
def fetch_venmo():
    return jsonify(fetch_venmo_payments())

@payments_bp.route('/paypal/fetch', methods=['POST'])
def fetch_paypal():
    return jsonify(fetch_paypal_payments())

@payments_bp.route('/zelle/fetch', methods=['POST'])
def fetch_zelle():
    return jsonify(fetch_zelle_payments())

@payments_bp.route('/remap', methods=['POST'])
def remap_payments():
    users = load_users()
    logs = load_payment_logs()
    count = 0
    for log in logs:
        if log.get('status') != 'Matched':
            # Re-run process logic without saving database every single iteration
            # We save at the end
            if process_payment(users, log['sender'], log['amount'], log['date'], log['service'], existing_logs=logs, save_db=False):
                count += 1
    
    save_users(users)
    save_data('payment_logs', logs)
    return jsonify({'message': f'Remapped {count} payments'})