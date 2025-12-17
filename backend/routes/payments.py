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
    # Initializes result to ensure it has the expected structure
    result = {"count": 0, "errors": []}
    try:
        if service == 'venmo': result = fetch_venmo_payments()
        elif service == 'paypal': result = fetch_paypal_payments()
        elif service == 'zelle': result = fetch_zelle_payments()
        
        # Handle cases where fetchers might return just an int (backward compatibility)
        if isinstance(result, int):
            result = {"count": result, "errors": []}
            
        msg = f"Found {result['count']} new payments."
        if result['errors']: msg += f" Errors: {'; '.join(result['errors'])}"
        return jsonify({'message': msg})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payments_bp.route('/remap', methods=['POST'])
def remap():
    return jsonify({'message': f'Remapped {remap_existing_payments()} payments.'})

@payments_bp.route('/logs/delete', methods=['POST'])
def remove_log():
    data = request.json
    delete_payment_log(data)
    return jsonify({'message': 'Log deleted'})

# --- MANUAL ENTRY (Duplicate Fix) ---
@payments_bp.route('/manual', methods=['POST'])
def add_manual_payment():
    data = request.json
    service = data.get('service', 'Manual')
    sender = data.get('sender')
    amount = data.get('amount')
    date_str = data.get('date') # Expecting YYYY-MM-DD from frontend

    if not sender or not amount or not date_str:
        return jsonify({'error': 'Missing fields'}), 400

    # FIX: Raw text must match exactly what 'process_payment' creates to avoid duplicates during re-map
    # Standard Format: "{sender} sent {amount}"
    log_entry = {
        "date": date_str,
        "service": service,
        "sender": sender,
        "amount": amount,
        "raw_text": f"{sender} sent {amount}", 
        "status": "Unmapped",
        "mapped_user": None
    }
    
    save_payment_log(log_entry)
    # Trigger remap to auto-link user if they already exist
    remap_existing_payments()
    
    return jsonify({'message': 'Payment added manually', 'log': log_entry}), 201