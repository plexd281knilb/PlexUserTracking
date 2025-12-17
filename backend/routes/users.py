from flask import Blueprint, jsonify, request
from database import load_users, save_users, delete_user, load_payment_logs, save_data
from integrations import fetch_all_plex_users, modify_plex_access

users_bp = Blueprint('users', __name__, url_prefix='/api/users')

@users_bp.route('', methods=['GET'])
def get_users():
    return jsonify(load_users())

@users_bp.route('/bulk', methods=['PUT'])
def bulk_update():
    data = request.json
    user_ids = data.get('ids', [])
    updates = data.get('updates', {})
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

@users_bp.route('/bulk/delete', methods=['POST'])
def bulk_delete():
    data = request.json
    user_ids = data.get('ids', [])
    users = load_users()
    initial_count = len(users)
    users = [u for u in users if u['id'] not in user_ids]
    save_users(users)
    return jsonify({'message': f'Deleted {initial_count - len(users)} users.'})

@users_bp.route('/<int:user_id>', methods=['DELETE'])
def remove_user(user_id):
    delete_user(user_id)
    return jsonify({'message': 'User deleted'})

@users_bp.route('/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.json
    users = load_users()
    for user in users:
        if user['id'] == user_id:
            user.update({k: v for k, v in data.items() if k in user})
            if 'status' in data: modify_plex_access(user, enable=(data['status'] == 'Active'))
            save_users(users)
            return jsonify({'message': 'User updated', 'user': user})
    return jsonify({'error': 'User not found'}), 404

@users_bp.route('/<int:user_id>/match_payment', methods=['POST'])
def match_payment(user_id):
    data = request.json
    users = load_users()
    logs = load_payment_logs()
    
    for user in users:
        if user['id'] == user_id:
            user['last_paid'] = data.get('date')
            user['last_payment_amount'] = data.get('amount')
            
            if data.get('sender') and not user.get('full_name'):
                user['full_name'] = data.get('sender')
                
            user['status'] = 'Active'
            
            for log in logs:
                if log.get('raw_text') == data.get('raw_text'):
                    log['status'] = 'Matched'
                    log['mapped_user'] = user['username']
                    break
            
            save_users(users)
            save_data('payment_logs', logs)
            return jsonify({'message': 'Matched'})
    return jsonify({'error': 'User not found'}), 404

@users_bp.route('/unmap_payment', methods=['POST'])
def unmap_payment():
    data = request.json
    logs = load_payment_logs()
    for log in logs:
        if log.get('raw_text') == data.get('raw_text'):
            log['status'] = 'Unmapped'
            log['mapped_user'] = None
            break
    save_data('payment_logs', logs)
    return jsonify({'message': 'Unmapped'})

@users_bp.route('/import/plex', methods=['POST'])
def import_plex():
    count = fetch_all_plex_users()
    return jsonify({'message': f'Imported {count} new users from Plex.'})