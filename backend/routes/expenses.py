from flask import Blueprint, jsonify, request
from database import load_data, save_data

expenses_bp = Blueprint('expenses', __name__, url_prefix='/api/expenses')

@expenses_bp.route('', methods=['GET'])
def get_expenses():
    return jsonify(load_data('expenses', []))

@expenses_bp.route('', methods=['POST'])
def add_expense():
    data = request.json
    expenses = load_data('expenses', [])
    data['id'] = max([e.get('id', 0) for e in expenses] + [0]) + 1
    expenses.append(data)
    save_data('expenses', expenses)
    return jsonify({'message': 'Expense added'})

@expenses_bp.route('/<int:exp_id>', methods=['DELETE'])
def delete_expense(exp_id):
    expenses = load_data('expenses', [])
    expenses = [e for e in expenses if e['id'] != exp_id]
    save_data('expenses', expenses)
    return jsonify({'message': 'Expense deleted'})