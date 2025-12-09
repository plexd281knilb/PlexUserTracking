from flask import Blueprint, jsonify

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/setup-required', methods=['GET'])
def setup_required():
    return jsonify({'setup_required': True})

@admin_bp.route('/setup', methods=['POST'])
def setup_admin():
    return jsonify({'status': 'ok'})

@admin_bp.route('/login', methods=['POST'])
def admin_login():
    return jsonify({'status': 'ok'})
