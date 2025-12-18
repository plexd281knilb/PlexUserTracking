from flask import Blueprint, jsonify
from database import load_users, load_payment_logs, load_expenses
from datetime import datetime

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('/stats', methods=['GET'])
def get_stats():
    users = load_users()
    logs = load_payment_logs()
    expenses = load_expenses()
    
    active_users = len([u for u in users if u.get('status') == 'Active'])
    
    # Calculate Monthly Revenue (Sum of matched payments in current month)
    current_month = datetime.now().strftime('%Y-%m')
    revenue = 0.0
    for log in logs:
        if log.get('status') == 'Matched' and log.get('date', '').startswith(current_month):
            try:
                amount = float(str(log.get('amount', '0')).replace('$','').replace(',',''))
                revenue += amount
            except: pass
            
    # Calculate Expenses
    total_expenses = 0.0
    for exp in expenses:
        # Simple logic: assume monthly expenses count for this month
        try:
            val = float(str(exp.get('amount', '0')).replace('$','').replace(',',''))
            total_expenses += val
        except: pass

    return jsonify({
        "active_users": active_users,
        "monthly_revenue": round(revenue, 2),
        "expenses": round(total_expenses, 2),
        "net_income": round(revenue - total_expenses, 2)
    })