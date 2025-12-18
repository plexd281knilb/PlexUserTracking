from flask import Blueprint, request, jsonify
from database import load_settings, save_settings, load_servers, save_data
from integrations import get_plex_libraries, test_plex_connection

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')

@settings_bp.route('', methods=['GET'])
def get_settings():
    return jsonify(load_settings())

@settings_bp.route('', methods=['POST'])
def update_settings():
    data = request.json
    current = load_settings()
    current.update(data)
    save_settings(current)
    return jsonify({'message': 'Settings saved'})

@settings_bp.route('/servers', methods=['GET'])
def get_servers():
    return jsonify(load_servers())

@settings_bp.route('/servers/plex', methods=['POST'])
def add_server():
    data = request.json
    servers = load_servers()
    new_id = max([s['id'] for s in servers['plex']] + [0]) + 1
    servers['plex'].append({
        "id": new_id,
        "name": data.get('name'),
        "token": data.get('token'),
        "url": data.get('url', '')
    })
    save_data('servers', servers)
    return jsonify({'message': 'Server added'})

@settings_bp.route('/servers/plex/<int:srv_id>', methods=['PUT'])
def update_server(srv_id):
    data = request.json
    servers = load_servers()
    for s in servers['plex']:
        if s['id'] == srv_id:
            s.update(data)
            save_data('servers', servers)
            return jsonify({'message': 'Server updated'})
    return jsonify({'error': 'Not found'}), 404

@settings_bp.route('/servers/plex/<int:srv_id>', methods=['DELETE'])
def delete_server(srv_id):
    servers = load_servers()
    servers['plex'] = [s for s in servers['plex'] if s['id'] != srv_id]
    save_data('servers', servers)
    return jsonify({'message': 'Server deleted'})

@settings_bp.route('/test/plex', methods=['POST'])
def test_plex():
    data = request.json
    return jsonify(test_plex_connection(data.get('token'), data.get('url')))

@settings_bp.route('/plex/libraries', methods=['POST'])
def get_libs():
    data = request.json
    return jsonify(get_plex_libraries(data.get('token'), data.get('url')))