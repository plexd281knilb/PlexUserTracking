from flask import Blueprint, jsonify, request
from database import load_users, save_users, load_payment_logs, save_data
from integrations import fetch_all_plex_users, fetch_all_tautulli_users, modify_plex_access

users_bp = Blueprint('users', __name__, url_prefix='/api/users')

@users_bp.route('', methods=['GET'])
def get_users():
    users = load_users()
    for u in users:
        if 'username' not in u: u['username'] = u.get('name', 'Unknown')
        if 'full_name' not in u: u['full_name'] = ''
        if 'aka' not in u: u['aka'] = ''
        if 'payment_freq' not in u: u['payment_freq'] = 'Exempt' 
        if 'last_payment_amount' not in u: u['last_payment_amount'] = None
    return jsonify(users)

@users_bp.route('/bulk', methods=['PUT'])
def bulk_update():
    data = request.json
    user_ids = data.get('ids', [])
    updates = data.get('updates', {})
    if not user_ids or not updates: return jsonify({'error': 'Missing data'}), 400

    users = load_users()
    count = 0
    for user in users:
        if user['id'] in user_ids:
            for k, v in updates.items():
                user[k] = v
                if k == 'status': modify_plex_access(user, enable=(v == 'Active'))
            count += 1
    save_users(users)
    return jsonify({'message': f'Updated {count} users.'})

@users_bp.route('/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.json
    users = load_users()
    for user in users:
        if user['id'] == user_id:
            user['full_name'] = data.get('full_name', user.get('full_name'))
            user['payment_freq'] = data.get('payment_freq', user.get('payment_freq'))
            user['email'] = data.get('email', user['email'])
            user['aka'] = data.get('aka', user.get('aka', ''))
            
            # Allow manual date fix
            if 'last_paid' in data: user['last_paid'] = data['last_paid']

            if 'status' in data and data['status'] != user['status']:
                new_status = data['status']
                user['status'] = new_status
                modify_plex_access(user, enable=(new_status == 'Active'))

            save_users(users)
            return jsonify({'message': 'User updated', 'user': user}) 
    return jsonify({'error': 'User not found'}), 404

@users_bp.route('/<int:user_id>/match_payment', methods=['POST'])
def match_payment(user_id):
    """Manually links a payment. Forces update of Last Paid Amount and Full Name."""
    data = request.json
    payment_date = data.get('date')
    raw_text = data.get('raw_text')
    amount = data.get('amount')
    sender = data.get('sender')
    
    users = load_users()
    logs = load_payment_logs()
    
    # 1. Update User Data
    user_found = False
    for user in users:
        if user['id'] == user_id:
            user['last_paid'] = payment_date
            
            # FORCE UPDATE AMOUNT
            if amount: user['last_payment_amount'] = amount
            
            # AUTO-FILL FULL NAME (if empty)
            if sender and not user.get('full_name'):
                user['full_name'] = sender
                
            user['status'] = 'Active'
            user_found = True
            break
    
    if not user_found: return jsonify({'error': 'User not found'}), 404
    
    # 2. Update Log Entry
    log_updated = False
    for log in logs:
        if log.get('raw_text') == raw_text and log.get('date') == payment_date:
            log['status'] = 'Matched'
            log['mapped_user'] = next((u['username'] for u in users if u['id'] == user_id), 'Manual Match')
            log_updated = True
            break

    save_users(users)
    if log_updated: save_data('payment_logs.json', logs)

    return jsonify({'message': 'Payment matched successfully'})

@users_bp.route('/unmap_payment', methods=['POST'])
def unmap_payment():
    """Unlinks a payment log, making it available again."""
    data = request.json
    raw_text = data.get('raw_text')
    date = data.get('date')
    
    logs = load_payment_logs()
    found = False
    
    for log in logs:
        if log.get('raw_text') == raw_text and log.get('date') == date:
            log['status'] = 'Unmapped'
            log['mapped_user'] = None
            found = True
            break
            
    if found:
        save_data('payment_logs.json', logs)
        return jsonify({'message': 'Payment unmapped.'})
    
    return jsonify({'error': 'Log not found'}), 404

@users_bp.route('/import/plex', methods=['POST'])
def import_plex():
    try: return jsonify({'message': f'Imported {fetch_all_plex_users()} new users.'})
    except Exception as e: return jsonify({'error': str(e)}), 500

@users_bp.route('/import/tautulli', methods=['POST'])
def import_tautulli():
    try: return jsonify({'message': f'Imported {fetch_all_tautulli_users()} new users.'})
    except Exception as e: return jsonify({'error': str(e)}), 500

@users_bp.route('/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    users = load_users()
    initial_count = len(users)
    users = [u for u in users if u.get('id') != user_id]
    if len(users) < initial_count:
        save_users(users)
        return jsonify({'status': 'ok'})
    return jsonify({'error': 'User not found'}), 404