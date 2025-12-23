from flask import Blueprint, jsonify, request
from database import load_users, save_users, load_payment_logs, save_payment_log, save_data, load_settings
from integrations import fetch_all_plex_users, send_notification_email

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
            user.update(data)
            save_users(users)
            return jsonify({'message': 'User updated', 'user': user})
    return jsonify({'error': 'User not found'}), 404

@users_bp.route('/bulk', methods=['PUT'])
def bulk_update():
    data = request.json
    ids = data.get('ids', [])
    updates = data.get('updates', {})
    users = load_users()
    count = 0
    for user in users:
        if user['id'] in ids:
            user.update(updates)
            count += 1
    save_users(users)
    return jsonify({'message': f'Updated {count} users'})

@users_bp.route('/bulk/delete', methods=['POST'])
def bulk_delete():
    data = request.json
    ids = data.get('ids', [])
    if not ids:
        return jsonify({'message': 'No IDs provided'}), 400
        
    users = load_users()
    initial_count = len(users)
    users = [u for u in users if u['id'] not in ids]
    
    if len(users) < initial_count:
        save_users(users)
        return jsonify({'message': f'Deleted {initial_count - len(users)} users'})
    return jsonify({'message': 'No users deleted'})

@users_bp.route('/<int:user_id>/match_payment', methods=['POST'])
def match_payment(user_id):
    data = request.json
    users = load_users()
    logs = load_payment_logs()
    
    matched_user = None
    
    # 1. Update User Data
    for user in users:
        if user['id'] == user_id:
            user['last_paid'] = data.get('date')
            user['last_payment_amount'] = str(data.get('amount'))
            if user['status'] != 'Active':
                user['status'] = 'Active'
            matched_user = user
            break
            
    if not matched_user:
        return jsonify({'error': 'User not found'}), 404

    # 2. Update Payment Log Status
    raw_text = data.get('raw_text')
    for log in logs:
        if log.get('raw_text') == raw_text:
            log['status'] = 'Matched'
            log['mapped_user'] = matched_user['username']
            break
            
    save_users(users)
    save_data('payment_logs', logs)

    # 3. SEND RECEIPT EMAIL
    if matched_user.get('email'):
        try:
            settings = load_settings()
            subject = settings.get('email_receipt_subject', 'Payment Received')
            default_body = "Hi {full_name},\n\nWe have received your payment of {amount}. Thank you for your support!\n\n- Admin"
            body_tmpl = settings.get('email_receipt_body', default_body)
            
            body = body_tmpl.replace('{full_name}', matched_user.get('full_name', 'User')) \
                            .replace('{username}', matched_user.get('username', '')) \
                            .replace('{amount}', str(data.get('amount')))
            
            send_notification_email(matched_user['email'], subject, body)
        except Exception as e:
            print(f"Failed to send receipt email: {e}")

    return jsonify({'message': 'Payment matched and receipt sent'})

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

@users_bp.route('/import/plex', methods=['POST'])
def import_plex():
    stats = fetch_all_plex_users()
    if "status" in stats and str(stats["status"]).startswith("Error"):
        return jsonify({'message': stats["status"]}), 500
        
    return jsonify({'message': f"Sync Complete: +{stats.get('added', 0)} Added, -{stats.get('removed', 0)} Removed"})