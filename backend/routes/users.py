from flask import Blueprint, jsonify

users_bp = Blueprint('users', __name__, url_prefix='/api/users')

@users_bp.route('', methods=['GET'])
def get_users():
    return jsonify([])

@users_bp.route('/<user_id>', methods=['PUT'])
def update_user(user_id):
    return jsonify({'status': 'ok'})
