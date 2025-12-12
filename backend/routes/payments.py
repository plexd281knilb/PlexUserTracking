from flask import Blueprint, jsonify, request
from database import load_payment_accounts, add_account, save_payment_accounts
# Import all fetch functions
from integrations import fetch_venmo_payments, fetch_paypal_payments, fetch_zelle_payments

payments_bp = Blueprint('payments', __name__, url_prefix='/api/payment_emails')

@payments_bp.route('/<service>', methods=['GET'])
def get_accounts(service):
    if service not in ['venmo', 'zelle', 'paypal']:
        return jsonify({'error': 'Invalid service'}), 400
    accounts = load_payment_accounts(service)
    clean = [{k: v for k, v in acc.items() if k != 'password'} for acc in accounts]
    return jsonify(clean)

@payments_bp.route('/<service>', methods=['POST'])
def create_account(service):
    if service not in ['venmo', 'zelle', 'paypal']:
        return jsonify({'error': 'Invalid service'}), 400
    data = request.json
    add_account(service, data)
    return jsonify({'message': 'Account added'}), 201

@payments_bp.route('/<service>/<int:account_id>', methods=['DELETE'])
def delete_account(service, account_id):
    if service not in ['venmo', 'zelle', 'paypal']: return jsonify({'error': 'Invalid service'}), 400
    accounts = load_payment_accounts(service)
    accounts = [acc for acc in accounts if acc['id'] != account_id]
    save_payment_accounts(service, accounts)
    return jsonify({'message': 'Deleted'}), 200

@payments_bp.route('/scan/<service>', methods=['POST'])
def trigger_scan(service):
    """Manually triggers the email scan for a specific service."""
    count = 0
    try:
        if service == 'venmo':
            count = fetch_venmo_payments()
        elif service == 'paypal':
            count = fetch_paypal_payments()
        elif service == 'zelle':
            count = fetch_zelle_payments()
        else:
            return jsonify({'error': 'Unknown service'}), 400
        
        return jsonify({
            'message': f'Scan complete for {service}. Found {count} new payments.',
            'payments_found': count
        }), 200
    except Exception as e:
        print(f"Scan Error: {e}")
        return jsonify({'error': str(e)}), 500