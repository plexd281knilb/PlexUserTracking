from flask import Blueprint, jsonify, request
from database import load_users, save_users, load_payment_logs, save_data # Ensure save_data is imported
from integrations import fetch_all_plex_users, fetch_all_tautulli_users, modify_plex_access

users_bp = Blueprint('users', __name__, url_prefix='/api/users')

# ... (Keep get_users and bulk_update) ...

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
            if amount: 
                user['last_payment_amount'] = amount
            
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

# ... (Keep the rest: update_user, import routes, delete_user) ...
# Note: In update_user, ensure you allow updating 'last_paid' if you want to fix Anthony manually:

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
            
            # ALLOW MANUAL DATE FIX
            if 'last_paid' in data:
                user['last_paid'] = data['last_paid']

            if 'status' in data and data['status'] != user['status']:
                new_status = data['status']
                user['status'] = new_status
                modify_plex_access(user, enable=(new_status == 'Active'))

            save_users(users)
            return jsonify({'message': 'User updated', 'user': user}) 
    return jsonify({'error': 'User not found'}), 404