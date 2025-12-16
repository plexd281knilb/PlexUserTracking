from flask import Blueprint, jsonify, request
from integrations import fetch_venmo_payments, fetch_paypal_payments, fetch_zelle_payments, remap_existing_payments, test_email_connection
from database import load_payment_accounts, save_payment_accounts

payments_bp = Blueprint('payments', __name__, url_prefix='/api/payments')

@payments_bp.route('/accounts/<service>', methods=['GET'])
def get_accounts(service):
    if service not in ['venmo', 'zelle', 'paypal']: return jsonify({'error': 'Invalid service'}), 400
    accounts = load_payment_accounts(service)
    clean = [{k: v for k, v in acc.items() if k != 'password'} for acc in accounts]
    return jsonify(clean)

@payments_bp.route('/accounts/<service>', methods=['POST'])
def create_account(service):
    if service not in ['venmo', 'zelle', 'paypal']: return jsonify({'error': 'Invalid service'}), 400
    
    data = request.json
    email_addr = data.get('email', '')
    password = data.get('password', '')
    imap_server = data.get('imap_server', 'imap.gmail.com')
    port = int(data.get('port', 993))

    # 1. TEST CONNECTION
    test_result = test_email_connection(imap_server, port, email_addr, password)
    if test_result['status'] == 'error':
        return jsonify({'error': f"Connection Failed: {test_result['message']}"}), 400

    # 2. SAVE
    accounts = load_payment_accounts(service)
    new_id = 1
    if accounts: new_id = max([acc.get('id', 0) for acc in accounts]) + 1
        
    new_account = {
        "id": new_id,
        "email": email_addr,
        "password": password,
        "imap_server": imap_server,
        "port": port,
        "enabled": True,
        "last_scanned": "Never"
    }
    
    accounts.append(new_account)
    save_payment_accounts(service, accounts)
    
    return jsonify({'message': 'Account connected & saved', 'account': {k: v for k, v in new_account.items() if k != 'password'}}), 201

@payments_bp.route('/accounts/<service>/<int:account_id>', methods=['DELETE'])
def delete_account(service, account_id):
    if service not in ['venmo', 'zelle', 'paypal']: return jsonify({'error': 'Invalid service'}), 400
    accounts = load_payment_accounts(service)
    accounts = [acc for acc in accounts if acc.get('id') != account_id]
    save_payment_accounts(service, accounts)
    return jsonify({'message': 'Deleted'}), 200

@payments_bp.route('/scan/<service>', methods=['POST'])
def trigger_scan(service):
    count = 0
    try:
        if service == 'venmo': count = fetch_venmo_payments()
        elif service == 'paypal': count = fetch_paypal_payments()
        elif service == 'zelle': count = fetch_zelle_payments()
        return jsonify({'message': f'Found {count} new payments.', 'payments_found': count}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payments_bp.route('/remap', methods=['POST'])
def remap_payments():
    try:
        count = remap_existing_payments()
        return jsonify({'message': f'Remapped {count} payments.'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500