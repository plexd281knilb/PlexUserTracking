from flask import Blueprint, jsonify, request
from ..database import load_payment_accounts, add_account, save_payment_accounts
from ..payment_scanner import scan_for_payments

payments_bp = Blueprint('payments', __name__, url_prefix='/api/payment_emails')

# --- Account CRUD Endpoints ---

@payments_bp.route('/<service>', methods=['GET'])
def get_accounts(service):
    """Returns all configured accounts for a service (venmo/zelle/paypal)."""
    accounts = load_payment_accounts(service)
    # Censor password before sending to frontend
    clean_accounts = [{k: v for k, v in acc.items() if k != 'password'} for acc in accounts]
    return jsonify(clean_accounts)

@payments_bp.route('/<service>', methods=['POST'])
def create_account(service):
    """Adds a new account."""
    data = request.json
    # Validate required fields
    if not all(key in data for key in ['email', 'password', 'imap_server', 'port']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    new_account = add_account(service, data)
    return jsonify({
        'message': f'Account {new_account["email"]} added successfully.',
        'account_id': new_account['id']
    }), 201

@payments_bp.route('/<service>/<int:account_id>', methods=['DELETE'])
def delete_account(service, account_id):
    """Deletes an account by ID."""
    accounts = load_payment_accounts(service)
    initial_count = len(accounts)
    
    accounts = [acc for acc in accounts if acc.get('id') != account_id]
    
    if len(accounts) < initial_count:
        save_payment_accounts(service, accounts)
        return jsonify({'message': f'Account {account_id} deleted.'}), 200
    return jsonify({'error': 'Account not found'}), 404

# --- Scan Trigger Endpoint ---

@payments_bp.route('/scan/<service>', methods=['POST'])
def trigger_scan(service):
    """Manually triggers the email scan for a specific service."""
    if service not in ['venmo', 'zelle', 'paypal']:
        return jsonify({'error': 'Invalid service specified'}), 400
        
    payment_count = scan_for_payments(service)
    
    return jsonify({
        'message': f'Scan complete for {service}. Found and processed {payment_count} new payments.',
        'payments_found': payment_count
    }), 200