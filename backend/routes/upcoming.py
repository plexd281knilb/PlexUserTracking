from flask import Blueprint, jsonify, request
from database import load_users, load_settings
from datetime import datetime, timedelta
import calendar

upcoming_bp = Blueprint('upcoming', __name__, url_prefix='/api/upcoming')

@upcoming_bp.route('', methods=['GET'])
def get_upcoming():
    start_str = request.args.get('start')
    end_str = request.args.get('end')
    if not start_str or not end_str: return jsonify([])

    start = datetime.strptime(start_str, '%Y-%m-%d').date()
    end = datetime.strptime(end_str, '%Y-%m-%d').date()
    
    users = load_users()
    settings = load_settings()
    fee_monthly = float(settings.get('fee_monthly', 0))
    fee_yearly = float(settings.get('fee_yearly', 0))
    
    results = []
    
    for user in users:
        if user.get('payment_freq') == 'Exempt': continue
        if not user.get('last_paid') or user['last_paid'] == 'Never': continue
        
        try:
            last = datetime.strptime(user['last_paid'], '%Y-%m-%d')
            amt = float(str(user.get('last_payment_amount', '0')).replace('$','').replace(',',''))
            paid_thru = last
            
            if user['payment_freq'] == 'Yearly' and fee_yearly > 0:
                years = int(amt // fee_yearly)
                if years > 0:
                    paid_thru = paid_thru.replace(year=paid_thru.year + years)
                    paid_thru = paid_thru.replace(month=12, day=31)
            elif user['payment_freq'] == 'Monthly' and fee_monthly > 0:
                months = int(amt // fee_monthly)
                if months > 0:
                    y = paid_thru.year + ((paid_thru.month + months - 1) // 12)
                    m = (paid_thru.month + months - 1) % 12 + 1
                    d = calendar.monthrange(y, m)[1]
                    paid_thru = datetime(y, m, d)
            
            paid_date = paid_thru.date()
            if start <= paid_date <= end:
                results.append({
                    "username": user['username'],
                    "full_name": user.get('full_name', ''),
                    "freq": user.get('payment_freq', '-'),
                    "paid_thru": str(paid_date),
                    "status": user.get('status', 'Active')
                })
        except: pass
        
    return jsonify(results)