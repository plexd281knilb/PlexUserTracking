from flask import Blueprint, jsonify, request
from database import load_expenses, add_expense, delete_expense

expenses_bp = Blueprint('expenses', __name__, url_prefix='/api/expenses')

@expenses_bp.route('', methods=['GET'])
def get_expenses():
    """Get all expenses"""
    return jsonify(load_expenses())

@expenses_bp.route('', methods=['POST'])
def create_expense():
    """Add a new expense"""
    data = request.json
    
    # Basic Validation
    if not data.get('description') or not data.get('amount'):
        return jsonify({'error': 'Description and amount are required'}), 400
        
    try:
        # Ensure amount is a number
        data['amount'] = float(data['amount'])
        new_record = add_expense(data)
        return jsonify(new_record), 201
    except ValueError:
        return jsonify({'error': 'Invalid amount format'}), 400

@expenses_bp.route('/<int:id>', methods=['DELETE'])
def remove_expense(id):
    """Delete an expense"""
    success = delete_expense(id)
    if success:
        return jsonify({'message': 'Expense deleted'})
    return jsonify({'error': 'Expense not found'}), 404