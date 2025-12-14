from flask import Blueprint, jsonify, request
from database import load_settings, save_settings, load_servers, save_servers, add_server, delete_server
from integrations import test_plex_connection, test_tautulli_connection, get_plex_libraries

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')

@settings_bp.route('', methods=['GET'])
def get_settings():
    return jsonify(load_settings())

@settings_bp.route('', methods=['POST'])
def update_settings():
    data = request.json
    current_settings = load_settings()
    current_settings.update(data)
    save_settings(current_settings)
    return jsonify({'message': 'Settings updated'})

@settings_bp.route('/servers', methods=['GET'])
def get_servers():
    return jsonify(load_servers())

@settings_bp.route('/servers/<type>', methods=['POST'])
def add_new_server(type):
    data = request.json
    if not data: return jsonify({'error': 'No data'}), 400
    
    result = add_server(type, data)
    return jsonify({'message': 'Server added', 'server': result})

@settings_bp.route('/servers/<type>/<int:server_id>', methods=['DELETE'])
def remove_server(type, server_id):
    delete_server(type, server_id)
    return jsonify({'message': 'Server removed'})

@settings_bp.route('/test/plex', methods=['POST'])
def test_plex():
    token = request.json.get('token')
    return jsonify(test_plex_connection(token))

@settings_bp.route('/test/tautulli', methods=['POST'])
def test_tautulli():
    url = request.json.get('url')
    key = request.json.get('key')
    return jsonify(test_tautulli_connection(url, key))

# --- NEW ROUTE ---
@settings_bp.route('/plex/libraries', methods=['POST'])
def fetch_libraries():
    """Fetches libraries using a provided token"""
    token = request.json.get('token')
    
    # If no token provided in request, try to find a saved one
    if not token:
        servers = load_servers().get('plex', [])
        if servers:
            token = servers[0]['token']
        else:
            return jsonify({'error': 'No token provided and no servers saved'}), 400

    result = get_plex_libraries(token)
    if 'error' in result:
        return jsonify(result), 500
    
    return jsonify(result)