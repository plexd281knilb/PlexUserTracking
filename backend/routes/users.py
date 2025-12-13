from flask import Blueprint, jsonify, request
from database import load_users, save_users, load_payment_logs, save_payment_log, save_data
from integrations import fetch_all_plex_users, fetch_all_tautulli_users, modify_plex_access

users_bp = Blueprint('users', __name__, url_prefix='/api/users')

@users_bp.route('', methods=['GET'])
def get_users():
    users = load_users()
    # Ensure all users have the new fields structure
    for u in users:
        if 'username' not in u: u['username'] = u.get('name', 'Unknown')
        if 'full_name' not in u: u['full_name'] = ''
        if 'aka' not in u: u['aka'] = ''
        if 'payment_freq' not in u: u['payment_freq'] = 'Monthly'
    return jsonify(users)

@users_bp.route('/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """Updates user details (Full Name, AKA, Frequency, Status)"""
    data = request.json
    users = load_users()
    
    for user in users:
        if user['id'] == user_id:
            # Update Basic Fields
            user['full_name'] = data.get('full_name', user.get('full_name'))
            user['payment_freq'] = data.get('payment_freq', user.get('payment_freq'))
            user['email'] = data.get('email', user['email'])
            user['aka'] = data.get('aka', user.get('aka', ''))
            
            # Handle Status Change & Plex Sync
            if 'status' in data and data['status'] != user['status']:
                new_status = data['status']
                user['status'] = new_status
                
                # TRIGGER PLEX SYNC
                # enable = True if status is 'Active'
                sync_results = modify_plex_access(user, enable=(new_status == 'Active'))
                print(f"Plex Sync Results for {user['username']}: {sync_results}")

            save_users(users)
            return jsonify({'message': 'User updated', 'user': user})
            
    return jsonify({'error': 'User not found'}), 404

@users_bp.route('/<int:user_id>/match_payment', methods=['POST'])
def match_payment(user_id):
    """Manually links an unmapped payment to this user"""
    data = request.json
    payment_date = data.get('date')
    payment_raw = data.get('raw_text')
    
    users = load_users()
    logs = load_payment_logs()
    
    # 1. Update User
    user_found = False
    for user in users:
        if user['id'] == user_id:
            user['last_paid'] = payment_date
            user['status'] = 'Active'
            user_found = True
            break
    
    if not user_found: return jsonify({'error': 'User not found'}), 404
    
    # 2. Update Log Entry to 'Matched'
    log_updated = False
    for log in logs:
        if log.get('raw_text') == payment_raw and log.get('date') == payment_date:
            log['status'] = 'Matched'
            log['mapped_user'] = next((u['username'] for u in users if u['id'] == user_id), 'Manual Match')
            log_updated = True
            break

    save_users(users)
    if log_updated:
        save_data('payment_logs.json', logs)

    return jsonify({'message': 'Payment matched successfully'})

@users_bp.route('/import/plex', methods=['POST'])
def import_plex():
    try:
        count = fetch_all_plex_users()
        return jsonify({'message': f'Imported {count} new users from Plex.'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@users_bp.route('/import/tautulli', methods=['POST'])
def import_tautulli():
    try:
        count = fetch_all_tautulli_users()
        return jsonify({'message': f'Imported {count} new users from Tautulli.'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@users_bp.route('/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    users = load_users()
    initial_count = len(users)
    users = [u for u in users if u.get('id') != user_id]
    if len(users) < initial_count:
        save_users(users)
        return jsonify({'status': 'ok'})
    return jsonify({'error': 'User not found'}), 404