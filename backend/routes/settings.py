from flask import Blueprint, request, jsonify
from database import load_settings, save_settings, load_servers, save_data, load_data
from integrations import get_plex_libraries, test_plex_connection, test_email_connection, test_smtp_connection

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')

# --- GENERAL SETTINGS ---
@settings_bp.route('', methods=['GET'])
def get_settings():
    return jsonify(load_settings())

@settings_bp.route('', methods=['POST'])
def update_settings():
    data = request.json
    current = load_settings()
    current.update(data)
    save_settings(current)
    return jsonify({'message': 'Settings saved successfully'})

# --- PAYMENT SCANNERS (Restored) ---
@settings_bp.route('/payment_accounts', methods=['GET'])
def get_payment_accounts():
    accounts = load_data('payment_accounts', [])
    return jsonify(accounts if isinstance(accounts, list) else [])

@settings_bp.route('/payment_accounts', methods=['POST'])
def add_payment_account():
    data = request.json
    accounts = load_data('payment_accounts', [])
    if not isinstance(accounts, list): accounts = []
    
    new_id = max([a.get('id', 0) for a in accounts] + [0]) + 1
    data['id'] = new_id
    
    # Normalize Type
    sType = data.get('type', '').lower()
    if sType == 'venmo': data['type'] = 'Venmo'
    elif sType == 'zelle': data['type'] = 'Zelle'
    elif sType == 'paypal': data['type'] = 'PayPal'
    
    accounts.append(data)
    save_data('payment_accounts', accounts)
    return jsonify({'message': 'Scanner added', 'account': data})

@settings_bp.route('/payment_accounts/<int:acc_id>', methods=['PUT'])
def update_payment_account(acc_id):
    data = request.json
    accounts = load_data('payment_accounts', [])
    for acc in accounts:
        if acc['id'] == acc_id:
            acc.update(data)
            # Normalize Type
            sType = data.get('type', '').lower()
            if sType == 'venmo': acc['type'] = 'Venmo'
            elif sType == 'zelle': acc['type'] = 'Zelle'
            elif sType == 'paypal': acc['type'] = 'PayPal'
            
            save_data('payment_accounts', accounts)
            return jsonify({'message': 'Scanner updated'})
    return jsonify({'error': 'Scanner not found'}), 404

@settings_bp.route('/payment_accounts/<int:acc_id>', methods=['DELETE'])
def delete_payment_account(acc_id):
    accounts = load_data('payment_accounts', [])
    accounts = [a for a in accounts if a['id'] != acc_id]
    save_data('payment_accounts', accounts)
    return jsonify({'message': 'Scanner deleted'})

# --- PLEX SERVER MANAGEMENT ---
@settings_bp.route('/servers', methods=['GET'])
def get_servers():
    return jsonify(load_servers())

@settings_bp.route('/servers/plex', methods=['POST'])
def add_plex_server():
    data = request.json
    servers = load_servers()
    if 'plex' not in servers: servers['plex'] = []
    
    new_server = {
        "id": max([s.get('id', 0) for s in servers['plex']] + [0]) + 1,
        "name": data.get('name'),
        "token": data.get('token'),
        "url": data.get('url', '')
    }
    servers['plex'].append(new_server)
    save_data('servers', servers)
    return jsonify({'message': 'Server added', 'server': new_server})

@settings_bp.route('/servers/plex/<int:server_id>', methods=['PUT'])
def update_plex_server(server_id):
    data = request.json
    servers = load_servers()
    for s in servers.get('plex', []):
        if s['id'] == server_id:
            s.update(data)
            save_data('servers', servers)
            return jsonify({'message': 'Server updated'})
    return jsonify({'error': 'Server not found'}), 404

@settings_bp.route('/servers/plex/<int:server_id>', methods=['DELETE'])
def delete_plex_server(server_id):
    servers = load_servers()
    if 'plex' in servers:
        servers['plex'] = [s for s in servers['plex'] if s['id'] != server_id]
        save_data('servers', servers)
    return jsonify({'message': 'Server removed'})

# --- TEST UTILS ---
@settings_bp.route('/plex/libraries', methods=['POST'])
def list_libraries():
    data = request.json
    res = get_plex_libraries(data.get('token'), data.get('url'))
    if "error" in res:
        return jsonify(res), 400
    return jsonify(res)

@settings_bp.route('/test/plex', methods=['POST'])
def test_connection():
    data = request.json
    res = test_plex_connection(data.get('token'), data.get('url'))
    return jsonify(res)

@settings_bp.route('/test/email', methods=['POST'])
def test_email_scanner():
    data = request.json
    res = test_email_connection(data.get('imap_server'), data.get('port'), data.get('email'), data.get('password'))
    return jsonify(res)

@settings_bp.route('/test/smtp', methods=['POST'])
def test_smtp_send():
    data = request.json
    res = test_smtp_connection(data.get('smtp_host'), data.get('smtp_port'), data.get('smtp_user'), data.get('smtp_pass'))
    return jsonify(res)