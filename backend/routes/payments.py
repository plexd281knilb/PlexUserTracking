from flask import Blueprint, jsonify, request
from integrations import fetch_venmo_payments, fetch_paypal_payments, fetch_zelle_payments, remap_existing_payments, test_email_connection
from database import load_payment_accounts, save_payment_accounts, delete_payment_log

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
    if service == 'venmo': count = fetch_venmo_payments()
    elif service == 'paypal': count = fetch_paypal_payments()
    elif service == 'zelle': count = fetch_zelle_payments()
    return jsonify({'message': f'Found {count} new payments.'})

@payments_bp.route('/remap', methods=['POST'])
def remap():
    return jsonify({'message': f'Remapped {remap_existing_payments()} payments.'})

@payments_bp.route('/logs/delete', methods=['POST'])
def remove_log():
    data = request.json
    delete_payment_log(data)
    return jsonify({'message': 'Log deleted'})