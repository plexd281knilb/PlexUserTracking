from flask import Blueprint, jsonify, request
from database import load_expenses, save_expenses

expenses_bp = Blueprint('expenses', __name__, url_prefix='/api/expenses')

@expenses_bp.route('', methods=['GET'])
def get_expenses():
    return jsonify(load_expenses())

@expenses_bp.route('', methods=['POST'])
def add_expense():
    data = request.json
    expenses = load_expenses()
    
    # Generate a simple ID if not present
    if 'id' not in data:
        # Find max existing ID or default to 0
        max_id = max([e.get('id', 0) for e in expenses] + [0])
        data['id'] = max_id + 1
        
    expenses.append(data)
    save_expenses(expenses)
    return jsonify({'message': 'Expense added', 'expense': data})

@expenses_bp.route('/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    expenses = load_expenses()
    expenses = [e for e in expenses if e.get('id') != expense_id]
    save_expenses(expenses)
    return jsonify({'message': 'Expense deleted'})