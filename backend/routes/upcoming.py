from flask import Blueprint, jsonify
from database import load_users, load_settings
from automation import calculate_expiry
from datetime import datetime, timedelta

upcoming_bp = Blueprint('upcoming', __name__, url_prefix='/api/upcoming')

@upcoming_bp.route('', methods=['GET'])
def get_upcoming():
    users = load_users()
    settings = load_settings()
    
    notify_monthly = int(settings.get('notify_days_monthly', 3))
    notify_yearly = int(settings.get('notify_days_yearly', 7))
    
    today = datetime.now()
    upcoming_list = []

    for user in users:
        # Filter: Only Active users who aren't Exempt
        if user.get('payment_freq') == 'Exempt' or user.get('status') == 'Disabled':
            continue

        expiry = calculate_expiry(user, settings)
        if not expiry: continue

        # Calculate Warning Date
        days_before = notify_yearly if user['payment_freq'] == 'Yearly' else notify_monthly
        warning_date = expiry - timedelta(days=days_before)
        
        # We want to see anyone expiring in the next 60 days
        days_until_expiry = (expiry - today).days
        
        if -5 <= days_until_expiry <= 60:
            upcoming_list.append({
                "id": user['id'],
                "username": user['username'],
                "email": user.get('email'),
                "expiry_date": expiry.strftime('%Y-%m-%d'),
                "reminder_date": warning_date.strftime('%Y-%m-%d'),
                "days_until": days_until_expiry,
                "status": user['status'],
                "payment_freq": user['payment_freq']
            })

    # Sort by who is expiring soonest
    upcoming_list.sort(key=lambda x: x['days_until'])
    
    return jsonify(upcoming_list)