from flask import Blueprint, jsonify, request
from integrations import fetch_venmo_payments, fetch_paypal_payments, fetch_zelle_payments, remap_existing_payments, test_email_connection
from database import load_payment_accounts, save_payment_accounts, delete_payment_log, save_payment_log

payments_bp = Blueprint('payments', __name__, url_prefix='/api/payments')

@payments_bp.route('/accounts/<service>', methods=['GET'])
def get_accounts(service):
    if service not in ['venmo', 'zelle', 'paypal']: return jsonify({'error': 'Invalid service'}), 400
    accounts = load_payment_accounts(service)
    clean = [{k: v for k, v in acc.items() if k != 'password'} for acc in accounts]
    return jsonify(clean)

@payments_bp.route('/accounts/<service>', methods=['POST'])
def create_account(service):
    data = request.json
    res = test_email_connection(data.get('imap_server'), data.get('port'), data.get('email'), data.get('password'))
    if res['status'] == 'error': return jsonify({'error': res['message']}), 400
    
    accounts = load_payment_accounts(service)
    new_id = (max([a['id'] for a in accounts], default=0) + 1)
    new_acc = { "id": new_id, "email": data['email'], "password": data['password'], "imap_server": data['imap_server'], "port": data['port'], "enabled": True, "last_scanned": "Never" }
    accounts.append(new_acc)
    save_payment_accounts(service, accounts)
    return jsonify({'message': 'Saved', 'account': {k: v for k, v in new_acc.items() if k != 'password'}}), 201

@payments_bp.route('/accounts/<service>/<int:aid>', methods=['DELETE'])
def delete_account(service, aid):
    accounts = load_payment_accounts(service)
    save_payment_accounts(service, [a for a in accounts if a['id'] != aid])
    return jsonify({'message': 'Deleted'})

@payments_bp.route('/scan/<service>', methods=['POST'])
def trigger_scan(service):
    count = 0
    errors = []
    if service == 'venmo': 
        res = fetch_venmo_payments()
    elif service == 'paypal': 
        res = fetch_paypal_payments()
    elif service == 'zelle': 
        res = fetch_zelle_payments()
    else:
        return jsonify({'message': 'Unknown service'}), 400

    # Handle dictionary return from integrations
    if isinstance(res, dict):
        count = res.get('count', 0)
        errors = res.get('errors', [])
    else:
        count = res

    msg = f"Found {count} new payments."
    if errors: msg += f" Errors: {'; '.join(errors)}"
    return jsonify({'message': msg})

@payments_bp.route('/remap', methods=['POST'])
def remap():
    return jsonify({'message': f'Remapped {remap_existing_payments()} payments.'})

@payments_bp.route('/logs/delete', methods=['POST'])
def remove_log():
    data = request.json
    delete_payment_log(data)
    return jsonify({'message': 'Log deleted'})

# --- NEW: Manual Payment Entry ---
@payments_bp.route('/manual', methods=['POST'])
def add_manual_payment():
    data = request.json
    service = data.get('service', 'Manual')
    sender = data.get('sender')
    amount = data.get('amount')
    date_str = data.get('date') # Expecting YYYY-MM-DD from frontend

    if not sender or not amount or not date_str:
        return jsonify({'error': 'Missing fields'}), 400

    # Create log entry that matches the format of scanned logs
    log_entry = {
        "date": date_str,
        "service": service,
        "sender": sender,
        "amount": amount,
        "raw_text": f"Manual Entry: {sender} sent {amount}",
        "status": "Unmapped",
        "mapped_user": None
    }
    
    save_payment_log(log_entry)
    # Trigger remap just in case it auto-matches an existing user
    remap_existing_payments()
    
    return jsonify({'message': 'Payment added manually', 'log': log_entry}), 201