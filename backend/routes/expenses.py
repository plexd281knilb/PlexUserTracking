from flask import Blueprint, jsonify

expenses_bp = Blueprint('expenses', __name__, url_prefix='/api/expenses')

@expenses_bp.route('', methods=['GET'])
def get_expenses():
    return jsonify([])

@expenses_bp.route('', methods=['POST'])
def add_expense():
    return jsonify({'status': 'ok'})
