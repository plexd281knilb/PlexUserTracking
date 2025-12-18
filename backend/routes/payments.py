from flask import Blueprint, jsonify, request
from integrations import fetch_venmo_payments, fetch_paypal_payments, fetch_zelle_payments, process_payment
from database import load_users, load_payment_logs, save_users, save_data, load_payment_accounts, load_data

payments_bp = Blueprint('payments', __name__, url_prefix='/api/payments')

# --- 1. SCANNER TRIGGERS ---
@payments_bp.route('/scan/venmo', methods=['POST'])
def scan_venmo():
    return jsonify(fetch_venmo_payments())

@payments_bp.route('/scan/paypal', methods=['POST'])
def scan_paypal():
    return jsonify(fetch_paypal_payments())

@payments_bp.route('/scan/zelle', methods=['POST'])
def scan_zelle():
    return jsonify(fetch_zelle_payments())

# --- 2. ACCOUNT MANAGEMENT ---
@payments_bp.route('/accounts/<string:service_type>', methods=['GET'])
def get_service_accounts(service_type):
    return jsonify(load_payment_accounts(service_type))

@payments_bp.route('/accounts/<string:service_type>', methods=['POST'])
def add_service_account(service_type):
    data = request.json
    sType = service_type.lower()
    if sType == 'venmo': data['type'] = 'Venmo'
    elif sType == 'zelle': data['type'] = 'Zelle'
    elif sType == 'paypal': data['type'] = 'PayPal'
    else: data['type'] = service_type.capitalize()

    accounts = load_data('payment_accounts', [])
    new_id = max([a.get('id', 0) for a in accounts] + [0]) + 1
    data['id'] = new_id
    accounts.append(data)
    save_data('payment_accounts', accounts)
    
    return jsonify({'message': 'Account added', 'account': data})

@payments_bp.route('/accounts/<string:service_type>/<int:acc_id>', methods=['DELETE'])
def delete_service_account(service_type, acc_id):
    accounts = load_data('payment_accounts', [])
    accounts = [a for a in accounts if a['id'] != acc_id]
    save_data('payment_accounts', accounts)
    return jsonify({'message': 'Account deleted'})

# --- 3. LOG MANAGEMENT ---
@payments_bp.route('/logs/delete', methods=['POST'])
def delete_log():
    log_to_delete = request.json
    logs = load_payment_logs()
    logs = [l for l in logs if not (l.get('raw_text') == log_to_delete.get('raw_text') and l.get('date') == log_to_delete.get('date'))]
    save_data('payment_logs', logs)
    return jsonify({'message': 'Log deleted'})

@payments_bp.route('/remap', methods=['POST'])
def remap_payments():
    users = load_users()
    logs = load_payment_logs()
    count = 0
    for log in logs:
        if log.get('status') != 'Matched':
            if process_payment(users, log['sender'], log['amount'], log['date'], log['service'], existing_logs=logs, save_db=False):
                count += 1
    save_users(users)
    save_data('payment_logs', logs)
    return jsonify({'message': f'Remapped {count} payments'})

# --- 4. MANUAL ENTRY ---
@payments_bp.route('/manual', methods=['POST'])
def manual_add():
    data = request.json
    users = load_users()from flask import Blueprint, jsonify, request
from integrations import fetch_venmo_payments, fetch_paypal_payments, fetch_zelle_payments, process_payment
from database import load_users, load_payment_logs, save_users, save_data, load_payment_accounts, load_data

payments_bp = Blueprint('payments', __name__, url_prefix='/api/payments')

# --- 1. SCANNER TRIGGERS ---
@payments_bp.route('/scan/venmo', methods=['POST'])
def scan_venmo():
    return jsonify(fetch_venmo_payments())

@payments_bp.route('/scan/paypal', methods=['POST'])
def scan_paypal():
    return jsonify(fetch_paypal_payments())

@payments_bp.route('/scan/zelle', methods=['POST'])
def scan_zelle():
    return jsonify(fetch_zelle_payments())

# --- 2. ACCOUNT MANAGEMENT ---
@payments_bp.route('/accounts/<string:service_type>', methods=['GET'])
def get_service_accounts(service_type):
    # This calls the case-insensitive loader from database.py
    return jsonify(load_payment_accounts(service_type))

@payments_bp.route('/accounts/<string:service_type>', methods=['POST'])
def add_service_account(service_type):
    data = request.json
    # Normalize the type field for the database to match fetchers
    sType = service_type.lower()
    if sType == 'venmo': data['type'] = 'Venmo'
    elif sType == 'zelle': data['type'] = 'Zelle'
    elif sType == 'paypal': data['type'] = 'PayPal'
    else: data['type'] = service_type.capitalize()

    accounts = load_data('payment_accounts', [])
    new_id = max([a.get('id', 0) for a in accounts] + [0]) + 1
    data['id'] = new_id
    accounts.append(data)
    save_data('payment_accounts', accounts)
    
    return jsonify({'message': 'Account added', 'account': data})

@payments_bp.route('/accounts/<string:service_type>/<int:acc_id>', methods=['DELETE'])
def delete_service_account(service_type, acc_id):
    accounts = load_data('payment_accounts', [])
    accounts = [a for a in accounts if a['id'] != acc_id]
    save_data('payment_accounts', accounts)
    return jsonify({'message': 'Account deleted'})

# --- 3. LOG MANAGEMENT ---
@payments_bp.route('/logs/delete', methods=['POST'])
def delete_log():
    log_to_delete = request.json
    logs = load_payment_logs()
    # Filter out the specific log based on raw_text and date
    logs = [l for l in logs if not (l.get('raw_text') == log_to_delete.get('raw_text') and l.get('date') == log_to_delete.get('date'))]
    save_data('payment_logs', logs)
    return jsonify({'message': 'Log deleted'})

@payments_bp.route('/remap', methods=['POST'])
def remap_payments():
    users = load_users()
    logs = load_payment_logs()
    count = 0
    for log in logs:
        if log.get('status') != 'Matched':
            if process_payment(users, log['sender'], log['amount'], log['date'], log['service'], existing_logs=logs, save_db=False):
                count += 1
    save_users(users)
    save_data('payment_logs', logs)
    return jsonify({'message': f'Remapped {count} payments'})

# --- 4. MANUAL ENTRY ---
@payments_bp.route('/manual', methods=['POST'])
def manual_add():
    data = request.json
    users = load_users()
    logs = load_payment_logs()
    process_payment(users, data['sender'], data['amount'], data['date'], data['service'], existing_logs=logs, save_db=True)
    return jsonify({'message': 'Manual payment processed'})
    logs = load_payment_logs()
    process_payment(users, data['sender'], data['amount'], data['date'], data['service'], existing_logs=logs, save_db=True)
    return jsonify({'message': 'Manual payment processed'})