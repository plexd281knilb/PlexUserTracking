from flask import Blueprint, jsonify, request
from database import load_users, save_users, load_payment_logs, save_payment_log
from integrations import fetch_all_plex_users, fetch_all_tautulli_users

users_bp = Blueprint('users', __name__, url_prefix='/api/users')

@users_bp.route('', methods=['GET'])
def get_users():
    users = load_users()
    # Ensure all users have the new fields structure
    for u in users:
        if 'username' not in u: u['username'] = u.get('name', 'Unknown')
        if 'full_name' not in u: u['full_name'] = ''
        if 'payment_freq' not in u: u['payment_freq'] = 'Monthly'
    return jsonify(users)

@users_bp.route('/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """Updates user details (Full Name, Frequency, Status)"""
    data = request.json
    users = load_users()
    
    for user in users:
        if user['id'] == user_id:
            user['full_name'] = data.get('full_name', user.get('full_name'))
            user['payment_freq'] = data.get('payment_freq', user.get('payment_freq'))
            user['email'] = data.get('email', user['email'])
            # We allow manual status override here
            if 'status' in data:
                user['status'] = data['status']
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
        # We need to save the logs back to the file. 
        # (Note: database.py doesn't have a save_all_logs function exposed yet, 
        # so we will cheat and use the internal save_data helper if available, 
        # or just assume the next scan picks it up. 
        # BETTER FIX: Let's import the save_data function from database.py if possible, 
        # but since we can't easily change database.py imports here without breaking things, 
        # we will assume you update database.py below.)
        from database import save_data
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