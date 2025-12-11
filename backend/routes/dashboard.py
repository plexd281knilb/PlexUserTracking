from flask import Blueprint, jsonify
# FIX: Using simple absolute import
from database import load_users, load_expenses 

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('/summary', methods=['GET'])
def summary():
    # Placeholder: calculate summary
    return jsonify({
        'total_users': 0,
        'total_emails': 0,
        'total_payments': 0,
        'total_income_year': 0,
        'total_expenses_year': 0
    })