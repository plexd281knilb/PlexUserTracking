from flask import Blueprint, jsonify, request
# FIX: Using simple absolute import
from database import load_expenses, save_expenses 

expenses_bp = Blueprint('expenses', __name__, url_prefix='/api/expenses')

@expenses_bp.route('', methods=['GET'])
def get_expenses():
    # Placeholder: fetch data
    expenses = load_expenses()
    return jsonify(expenses)

@expenses_bp.route('', methods=['POST'])
def add_expense():
    # Placeholder: add expense logic
    return jsonify({'status': 'ok'})