from flask import Blueprint, jsonify
from database import load_users, load_payment_logs, load_expenses, load_settings
from datetime import datetime

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('', methods=['GET'])
def get_dashboard_data():
    users = load_users()
    logs = load_payment_logs()
    expenses = load_expenses()
    settings = load_settings()

    # 1. User Stats
    total_users = len(users)
    active_users = len([u for u in users if u.get('status') == 'Active'])

    # 2. Financials (Estimated)
    try:
        monthly_fee = float(str(settings.get('fee_monthly', '0')).replace('$', ''))
        yearly_fee = float(str(settings.get('fee_yearly', '0')).replace('$', ''))
    except:
        monthly_fee = 0.0
        yearly_fee = 0.0
    
    monthly_users = len([u for u in users if u.get('payment_freq') == 'Monthly' and u.get('status') == 'Active'])
    yearly_users = len([u for u in users if u.get('payment_freq') == 'Yearly' and u.get('status') == 'Active'])
    
    est_monthly_income = (monthly_users * monthly_fee) + ((yearly_users * yearly_fee) / 12)

    # 3. YTD Expenses
    current_year = str(datetime.now().year)
    ytd_expenses = 0.0
    for exp in expenses:
        if exp.get('date', '').startswith(current_year):
            try:
                amount = float(str(exp.get('amount', '0')).replace('$', '').replace(',', ''))
                ytd_expenses += amount
            except: pass

    # 4. Net Run Rate
    projected_annual_revenue = est_monthly_income * 12
    net_run_rate = projected_annual_revenue - ytd_expenses

    # 5. Recent Activity
    sorted_logs = sorted(logs, key=lambda x: x.get('date', ''), reverse=True)
    recent_activity = sorted_logs[:5]

    return jsonify({
        "total_users": total_users,
        "active_users": active_users,
        "est_monthly_income": est_monthly_income,
        "ytd_expenses": ytd_expenses,
        "net_run_rate": net_run_rate,
        "recent_activity": recent_activity
    })