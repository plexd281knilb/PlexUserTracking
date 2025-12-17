from flask import Blueprint, jsonify, request
from database import load_settings, save_settings, load_servers, save_servers, add_server, delete_server
from integrations import test_plex_connection, get_plex_libraries

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

@settings_bp.route('/servers/<type>/<int:server_id>', methods=['PUT'])
def update_server_route(type, server_id):
    data = request.json
    all_servers = load_servers()
    
    if type not in all_servers:
        return jsonify({'error': 'Invalid server type'}), 400
    
    found = False
    for s in all_servers[type]:
        if s['id'] == server_id:
            s['name'] = data.get('name', s['name'])
            s['token'] = data.get('token', s['token'])
            s['url'] = data.get('url', s['url'])
            found = True
            break
            
    if found:
        save_servers(all_servers)
        return jsonify({'message': 'Server updated successfully'})
    
    return jsonify({'error': 'Server not found'}), 404

@settings_bp.route('/servers/<type>/<int:server_id>', methods=['DELETE'])
def remove_server(type, server_id):
    delete_server(type, server_id)
    return jsonify({'message': 'Server removed'})

@settings_bp.route('/test/plex', methods=['POST'])
def test_plex():
    token = request.json.get('token')
    return jsonify(test_plex_connection(token))

@settings_bp.route('/plex/libraries', methods=['POST'])
def fetch_libraries():
    token = request.json.get('token')
    manual_url = request.json.get('url')
    
    if not token:
        servers = load_servers().get('plex', [])
        if servers:
            token = servers[0]['token']
            if not manual_url and 'url' in servers[0]:
                manual_url = servers[0]['url']
        else:
            return jsonify({'error': 'No token provided'}), 400

    result = get_plex_libraries(token, manual_url)
    if 'error' in result:
        return jsonify(result), 500
    
    return jsonify(result)