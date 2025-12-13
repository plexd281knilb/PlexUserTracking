from flask import Blueprint, jsonify, request
from database import load_settings, save_settings, load_servers, add_server, delete_server
from integrations import test_plex_connection, test_tautulli_connection

# --- 1. CRITICAL: Initialize the Blueprint FIRST ---
# This line creates the variable 'settings_bp' so it can be used below.
settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')


# --- 2. NOW we can define the routes using that variable ---

# --- General Settings Routes ---
@settings_bp.route('', methods=['GET'])
def get_settings():
    return jsonify(load_settings())

@settings_bp.route('', methods=['POST'])
def update_settings():
    data = request.json
    save_settings(data)
    return jsonify({'message': 'Settings saved successfully'})

# --- Multi-Server Management Routes ---
@settings_bp.route('/servers', methods=['GET'])
def get_servers():
    return jsonify(load_servers())

@settings_bp.route('/servers/<type>', methods=['POST'])
def add_new_server(type):
    # type will be 'plex' or 'tautulli'
    data = request.json
    result = add_server(type, data)
    return jsonify(result)

@settings_bp.route('/servers/<type>/<int:id>', methods=['DELETE'])
def remove_server(type, id):
    delete_server(type, id)
    return jsonify({'status': 'deleted'})

# --- Connection Testing Routes ---
@settings_bp.route('/test/plex', methods=['POST'])
def test_plex():
    res = test_plex_connection(request.json.get('token'))
    return jsonify(res)

@settings_bp.route('/test/tautulli', methods=['POST'])
def test_tautulli():
    d = request.json
    res = test_tautulli_connection(d.get('url'), d.get('key'))
    return jsonify(res)

@settings_bp.route('/admin/setup-required', methods=['GET'])
def setup_required():
    return jsonify({'setup_required': False})