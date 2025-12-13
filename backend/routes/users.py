from flask import Blueprint, jsonify, request
from database import load_users, save_users
# UPDATED IMPORTS: Use the new "fetch_all" functions
from integrations import fetch_all_plex_users, fetch_all_tautulli_users

users_bp = Blueprint('users', __name__, url_prefix='/api/users')

@users_bp.route('', methods=['GET'])
def get_users():
    users = load_users()
    return jsonify(users)

@users_bp.route('/import/plex', methods=['POST'])
def import_plex():
    try:
        # UPDATED CALL: fetch_all_plex_users()
        count = fetch_all_plex_users()
        return jsonify({
            'status': 'ok', 
            'users_imported': count, 
            'message': f'Successfully scanned all Plex servers. Imported {count} new users.'
        })
    except Exception as e:
        print(f"Plex Import Error: {e}")
        return jsonify({'error': str(e)}), 500

@users_bp.route('/import/tautulli', methods=['POST'])
def import_tautulli():
    try:
        # UPDATED CALL: fetch_all_tautulli_users()
        count = fetch_all_tautulli_users()
        return jsonify({
            'status': 'ok', 
            'users_imported': count, 
            'message': f'Successfully scanned all Tautulli servers. Imported {count} new users.'
        })
    except Exception as e:
        print(f"Tautulli Import Error: {e}")
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