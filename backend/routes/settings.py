# Add these routes to your settings.py
from flask import Blueprint, jsonify, request
from database import load_servers, add_server, delete_server
from integrations import test_plex_connection, test_tautulli_connection

# ... (Existing code) ...

@settings_bp.route('/servers', methods=['GET'])
def get_servers():
    return jsonify(load_servers())

@settings_bp.route('/servers/<type>', methods=['POST'])
def add_new_server(type):
    data = request.json
    result = add_server(type, data)
    return jsonify(result)

@settings_bp.route('/servers/<type>/<int:id>', methods=['DELETE'])
def remove_server(type, id):
    delete_server(type, id)
    return jsonify({'status': 'deleted'})

@settings_bp.route('/test/plex', methods=['POST'])
def test_plex():
    res = test_plex_connection(request.json.get('token'))
    return jsonify(res)

@settings_bp.route('/test/tautulli', methods=['POST'])
def test_tautulli():
    d = request.json
    res = test_tautulli_connection(d.get('url'), d.get('key'))
    return jsonify(res)