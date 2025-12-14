from flask import Blueprint, jsonify, request
from integrations import fetch_venmo_payments, fetch_paypal_payments, fetch_zelle_payments, remap_existing_payments
from database import load_payment_accounts, save_payment_accounts, load_payment_logs, add_account

payments_bp = Blueprint('payments', __name__, url_prefix='/api/payments')

@payments_bp.route('/accounts/<service>', methods=['GET'])
def get_accounts(service):
    if service not in ['venmo', 'zelle', 'paypal']:
        return jsonify({'error': 'Invalid service'}), 400
    accounts = load_payment_accounts(service)
    # Remove passwords before sending to frontend
    clean = [{k: v for k, v in acc.items() if k != 'password'} for acc in accounts]
    return jsonify(clean)

@payments_bp.route('/accounts/<service>', methods=['POST'])
def create_account(service):
    if service not in ['venmo', 'zelle', 'paypal']:
        return jsonify({'error': 'Invalid service'}), 400
    data = request.json
    result = add_account(service, data)
    return jsonify({'message': 'Account added', 'account': result}), 201

@payments_bp.route('/accounts/<service>/<int:account_id>', methods=['DELETE'])
def delete_account(service, account_id):
    if service not in ['venmo', 'zelle', 'paypal']: return jsonify({'error': 'Invalid service'}), 400
    accounts = load_payment_accounts(service)
    accounts = [acc for acc in accounts if acc.get('id') != account_id]
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

# --- NEW: REMAP ROUTE ---
@payments_bp.route('/remap', methods=['POST'])
def remap_payments():
    try:
        count = remap_existing_payments()
        return jsonify({'message': f'Remapped {count} payments successfully.'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500