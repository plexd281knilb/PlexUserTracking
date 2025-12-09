from flask import Blueprint, jsonify

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')

@settings_bp.route('', methods=['GET'])
def get_settings():
    return jsonify({'dark_mode': False})

@settings_bp.route('', methods=['PUT'])
def update_settings():
    return jsonify({'status': 'ok'})
