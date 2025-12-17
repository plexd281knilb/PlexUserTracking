from flask import Blueprint, jsonify, request
from database import load_users, save_users, load_payment_logs, save_payment_log, save_data
from integrations import modify_plex_access, fetch_all_plex_users

users_bp = Blueprint('users', __name__, url_prefix='/api/users')

@users_bp.route('', methods=['GET'])
def get_users():
    return jsonify(load_users())

@users_bp.route('/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.json
    users = load_users()
    
    for user in users:
        if user['id'] == user_id:
            old_status = user.get('status')
            user.update(data)
            
            # --- CRITICAL: TRIGGER PLEX LOGIC ---
            if 'status' in data and data['status'] != old_status:
                if data['status'] == 'Active':
                    print(f"Enabling access for {user['username']}")
                    modify_plex_access(user, enable=True)
                elif data['status'] == 'Disabled':
                    print(f"Disabling access for {user['username']}")
                    modify_plex_access(user, enable=False)
            
            save_users(users)
            return jsonify({'message': 'User updated', 'user': user})
            
    return jsonify({'error': 'User not found'}), 404

@users_bp.route('/import/plex', methods=['POST'])
def import_plex():
    count = fetch_all_plex_users()
    return jsonify({'message': f'Imported {count} new users'})

@users_bp.route('/bulk', methods=['PUT'])
def bulk_update():
    data = request.json
    ids = data.get('ids', [])
    updates = data.get('updates', {})
    users = load_users()
    
    count = 0
    for user in users:
        if user['id'] in ids:
            old_status = user.get('status')
            user.update(updates)
            
            # --- CRITICAL: TRIGGER PLEX LOGIC FOR BULK ---
            if 'status' in updates and updates['status'] != old_status:
                if updates['status'] == 'Active':
                    modify_plex_access(user, enable=True)
                elif updates['status'] == 'Disabled':
                    modify_plex_access(user, enable=False)
            count += 1
            
    save_users(users)
    return jsonify({'message': f'Updated {count} users'})

@users_bp.route('/<int:user_id>/match_payment', methods=['POST'])
def match_payment(user_id):
    data = request.json
    users = load_users()
    logs = load_payment_logs()
    
    # Update User
    for user in users:
        if user['id'] == user_id:
            user['last_paid'] = data.get('date')
            user['last_payment_amount'] = str(data.get('amount'))
            if user['status'] != 'Active':
                user['status'] = 'Active'
                modify_plex_access(user, enable=True)
            break
            
    # Update Log
    raw_text = data.get('raw_text')
    for log in logs:
        if log.get('raw_text') == raw_text:
            log['status'] = 'Matched'
            log['mapped_user'] = next((u['username'] for u in users if u['id'] == user_id), 'Unknown')
            break
            
    save_users(users)
    save_data('payment_logs', logs)
    return jsonify({'message': 'Payment matched'})

@users_bp.route('/unmap_payment', methods=['POST'])
def unmap_payment():
    data = request.json
    logs = load_payment_logs()
    
    for log in logs:
        if log.get('raw_text') == data.get('raw_text') and log.get('date') == data.get('date'):
            log['status'] = 'Unmapped'
            log['mapped_user'] = None
            break
            
    save_data('payment_logs', logs)
    return jsonify({'message': 'Payment unmapped'})