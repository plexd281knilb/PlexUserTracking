from datetime import datetime, timedelta
import calendar
from database import load_users, save_users, load_settings
from integrations import send_notification_email

# --- SHARED HELPER: Calculate Expiration Date ---
def calculate_expiry(user, settings):
    """
    Returns the expiration date (datetime object) or None if exempt/invalid.
    """
    if user.get('payment_freq') == 'Exempt': return None
    
    # --- FIX: Handle Default Date for New/Pending Users ---
    if not user.get('last_paid') or user['last_paid'] == 'Never': 
        if user.get('status') in ['Active', 'Pending']:
            # Default to Dec 31, 2025 as requested
            return datetime(2025, 12, 31)
        return None

    try:
        last_paid = datetime.strptime(user['last_paid'], '%Y-%m-%d')
        amount_str = str(user.get('last_payment_amount', '0')).replace('$', '').replace(',', '')
        amount = float(amount_str) if amount_str else 0.0
        
        monthly_fee = float(settings.get('fee_monthly', 0))
        yearly_fee = float(settings.get('fee_yearly', 0))

        paid_thru = last_paid

        if user['payment_freq'] == 'Yearly' and yearly_fee > 0:
            years = int(amount // yearly_fee)
            if years > 0:
                paid_thru = paid_thru.replace(year=paid_thru.year + years)
                # Set to end of that year (Dec 31)
                paid_thru = paid_thru.replace(month=12, day=31)
        
        elif user['payment_freq'] == 'Monthly' and monthly_fee > 0:
            months = int(amount // monthly_fee)
            if months > 0:
                # Add months logic
                year = paid_thru.year + ((paid_thru.month + months - 1) // 12)
                month = (paid_thru.month + months - 1) % 12 + 1
                day = calendar.monthrange(year, month)[1]
                paid_thru = datetime(year, month, day)

        return paid_thru
    except Exception as e:
        print(f"Error calculating expiry for {user.get('username')}: {e}")
        return None

# --- BACKGROUND JOB ---
def check_automation():
    print("--- RUNNING AUTOMATION CHECK ---")
    users = load_users()
    settings = load_settings()
    
    notify_monthly = int(settings.get('notify_days_monthly', 3))
    notify_yearly = int(settings.get('notify_days_yearly', 7))
    
    today = datetime.now().date()
    updated = False

    for user in users:
        if user.get('status') == 'Disabled': continue
        
        paid_thru = calculate_expiry(user, settings)
        if not paid_thru: continue

        paid_thru_date = paid_thru.date()
        
        # Determine Reminder Days
        days_before = notify_yearly if user['payment_freq'] == 'Yearly' else notify_monthly
        warning_date = paid_thru_date - timedelta(days=days_before)
        disable_date = paid_thru_date + timedelta(days=1)

        # 1. SEND REMINDER
        if today == warning_date and user.get('email'):
            print(f"Sending reminder to {user['username']}")
            prefix = 'email_monthly' if user['payment_freq'] == 'Monthly' else 'email_yearly'
            subject = settings.get(f'{prefix}_subject', 'Subscription Reminder')
            body_tmpl = settings.get(f'{prefix}_body', 'Your subscription is due on {due_date}.')
            
            body = body_tmpl.replace('{full_name}', user.get('full_name', 'User')) \
                            .replace('{username}', user.get('username', '')) \
                            .replace('{due_date}', str(paid_thru_date))
            
            send_notification_email(user['email'], subject, body)

        # 2. AUTO-DISABLE
        if today >= disable_date and user['status'] != 'Disabled':
            print(f"Disabling user {user['username']}")
            user['status'] = 'Disabled'
            updated = True
            
            if user.get('email'):
                subject = "Account Disabled"
                body = f"Hi {user.get('full_name', 'User')},\n\nYour subscription expired on {paid_thru_date}. Your account has been marked as Disabled."
                send_notification_email(user['email'], subject, body)

    if updated:
        save_users(users)
        print("Automation: Users updated.")