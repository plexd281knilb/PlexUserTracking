from flask import Blueprint, request, jsonify
from database import load_settings, save_settings, load_servers, save_data, load_data
from integrations import get_plex_libraries, test_plex_connection

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')

# --- GENERAL SETTINGS ---
@settings_bp.route('', methods=['GET'])
def get_settings():
    return jsonify(load_settings())

@settings_bp.route('', methods=['POST'])
def update_settings():
    data = request.json
    current = load_settings()
    # Merge new data into existing settings
    current.update(data)
    save_settings(current)
    return jsonify({'message': 'Settings saved successfully'})

# --- PLEX SERVER MANAGEMENT ---
@settings_bp.route('/servers', methods=['GET'])
def get_servers():
    return jsonify(load_servers())

@settings_bp.route('/servers/plex', methods=['POST'])
def add_plex_server():
    data = request.json
    servers = load_servers()
    new_server = {
        "id": max([s.get('id', 0) for s in servers['plex']] + [0]) + 1,
        "name": data.get('name'),
        "token": data.get('token'),
        "url": data.get('url', '')
    }
    servers['plex'].append(new_server)
    save_data('servers', servers)
    return jsonify({'message': 'Server added', 'server': new_server})

@settings_bp.route('/servers/plex/<int:server_id>', methods=['PUT'])
def update_plex_server(server_id):
    data = request.json
    servers = load_servers()
    for s in servers['plex']:
        if s['id'] == server_id:
            s.update(data)
            save_data('servers', servers)
            return jsonify({'message': 'Server updated'})
    return jsonify({'error': 'Server not found'}), 404

@settings_bp.route('/servers/plex/<int:server_id>', methods=['DELETE'])
def delete_plex_server(server_id):
    servers = load_servers()
    servers['plex'] = [s for s in servers['plex'] if s['id'] != server_id]
    save_data('servers', servers)
    return jsonify({'message': 'Server removed'})

# --- UTILS ---
@settings_bp.route('/plex/libraries', methods=['POST'])
def list_libraries():
    data = request.json
    res = get_plex_libraries(data.get('token'), data.get('url'))
    if "error" in res:
        return jsonify(res), 400
    return jsonify(res)

@settings_bp.route('/test/plex', methods=['POST'])
def test_connection():
    data = request.json
    res = test_plex_connection(data.get('token'), data.get('url'))
    return jsonify(res)