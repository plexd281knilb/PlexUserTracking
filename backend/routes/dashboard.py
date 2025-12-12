from flask import Blueprint, jsonify
from database import load_users, load_expenses, load_payment_accounts
from datetime import datetime

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('/summary', methods=['GET'])
def summary():
    users = load_users()
    expenses = load_expenses()
    
    # 1. User Stats
    total_users = len(users)
    active_users = sum(1 for u in users if u.get('status') == 'Active')
    
    # 2. Income Calculation (Placeholder logic: assume $5/mo per active user)
    # You can make this configurable in settings later
    PRICE_PER_USER = 5.00 
    income_mo = active_users * PRICE_PER_USER
    
    # 3. Expense Calculation
    current_year = datetime.now().year
    expense_yr = sum(e['amount'] for e in expenses if str(current_year) in e.get('date', ''))

    # 4. Recent Activity (Combine recent payments and added users)
    activity = []
    
    # Add recent payments (from user last_paid)
    for u in users:
        if u.get('last_paid'):
            activity.append({
                'date': u['last_paid'],
                'desc': f"Payment received from {u['name']}"
            })
            
    # Sort by date descending and take top 5
    activity.sort(key=lambda x: x['date'], reverse=True)
    
    return jsonify({
        'total_users': total_users,
        'active_users': active_users,
        'income_mo': income_mo,
        'expense_yr': expense_yr,
        'recent_activity': activity[:5]
    })