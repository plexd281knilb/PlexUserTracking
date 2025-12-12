from flask import Blueprint, jsonify, request
from database import load_settings, save_settings 

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')

@settings_bp.route('', methods=['GET'])
def get_settings():
    settings = load_settings()
    return jsonify(settings)

@settings_bp.route('', methods=['PUT'])
def update_settings():
    data = request.json
    settings = load_settings()
    
    # Merge new data into existing settings safely
    for key, value in data.items():
        # Only update keys that exist in the loaded settings schema
        if key in settings:
            settings[key] = value
    
    save_settings(settings)
    return jsonify({'status': 'ok'})