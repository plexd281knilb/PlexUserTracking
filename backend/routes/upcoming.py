from flask import Blueprint, jsonify, request
from database import load_users, load_settings
from datetime import datetime, timedelta
import calendar

upcoming_bp = Blueprint('upcoming', __name__, url_prefix='/api/upcoming')

def calculate_dates(user, settings):
    if user.get('payment_freq') == 'Exempt': return None
    if not user.get('last_paid') or user['last_paid'] == 'Never': 
        # Default for active users with no history: 12/31/2025 (as requested previously)
        if user.get('status') == 'Active':
            paid_thru = datetime(2025, 12, 31)
        else:
            return None
    else:
        try:
            last_paid = datetime.strptime(user['last_paid'], '%Y-%m-%d')
            amount_str = str(user.get('last_payment_amount', '0')).replace('$', '').replace(',', '')
            amount = float(amount_str) if amount_str else 0.0
            
            fee_monthly = float(settings.get('fee_monthly', 0))
            fee_yearly = float(settings.get('fee_yearly', 0))
            
            paid_thru = last_paid
            
            if user['payment_freq'] == 'Yearly' and fee_yearly > 0:
                years = int(amount // fee_yearly)
                if years > 0:
                    # Add years, then snap to Dec 31
                    paid_thru = paid_thru.replace(year=paid_thru.year + years)
                    paid_thru = paid_thru.replace(month=12, day=31)
                    
            elif user['payment_freq'] == 'Monthly' and fee_monthly > 0:
                months = int(amount // fee_monthly)
                if months > 0:
                    # Add months logic
                    year = paid_thru.year + ((paid_thru.month + months - 1) // 12)
                    month = (paid_thru.month + months - 1) % 12 + 1
                    # Snap to last day of that month
                    last_day = calendar.monthrange(year, month)[1]
                    paid_thru = datetime(year, month, last_day)
        except:
            return None

    # Calculate Action Dates
    # Notification: 3 days BEFORE expiry (Adjustable logic)
    notif_date = paid_thru - timedelta(days=3)
    
    # Disabled: 1 day AFTER expiry
    disabled_date = paid_thru + timedelta(days=1)
    
    return {
        "paid_thru": paid_thru,
        "notification": notif_date,
        "disabled": disabled_date
    }

@upcoming_bp.route('', methods=['GET'])
def get_upcoming():
    start_str = request.args.get('start')
    end_str = request.args.get('end')
    
    if not start_str or not end_str:
        return jsonify([])

    start_date = datetime.strptime(start_str, '%Y-%m-%d')
    end_date = datetime.strptime(end_str, '%Y-%m-%d')
    
    users = load_users()
    settings = load_settings()
    
    results = []
    
    for user in users:
        if user.get('status') != 'Active': continue
        
        dates = calculate_dates(user, settings)
        if not dates: continue
        
        # Check if ANY event falls in the window
        in_range = False
        
        # Check Notification Date
        if start_date <= dates['notification'] <= end_date:
            in_range = True
            
        # Check Disabled Date
        if start_date <= dates['disabled'] <= end_date:
            in_range = True
            
        if in_range:
            results.append({
                "username": user['username'],
                "full_name": user.get('full_name', ''),
                "freq": user.get('payment_freq', '-'),
                "notif_date": dates['notification'].strftime('%Y-%m-%d'),
                "disabled_date": dates['disabled'].strftime('%Y-%m-%d'),
                # Sorting helper
                "sort_date": dates['disabled'].strftime('%Y-%m-%d')
            })
            
    # Sort by the disable date
    results.sort(key=lambda x: x['sort_date'])
    
    return jsonify(results)