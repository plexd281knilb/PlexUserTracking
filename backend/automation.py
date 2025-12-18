from datetime import datetime, timedelta
from database import load_users, save_users, load_settings
from integrations import send_notification_email
import calendar

def check_automation():
    print("--- RUNNING AUTOMATION CHECK ---")
    users = load_users()
    settings = load_settings()
    
    monthly_fee = float(settings.get('fee_monthly', 0))
    yearly_fee = float(settings.get('fee_yearly', 0))
    
    notify_monthly = int(settings.get('notify_days_monthly', 3))
    notify_yearly = int(settings.get('notify_days_yearly', 7))
    
    today = datetime.now().date()
    updated = False

    for user in users:
        # Skip Exempt or already Disabled
        if user.get('payment_freq') == 'Exempt': continue
        if user.get('status') == 'Disabled': continue
        if not user.get('last_paid') or user['last_paid'] == 'Never': continue

        try:
            last_paid = datetime.strptime(user['last_paid'], '%Y-%m-%d')
            amount = float(str(user.get('last_payment_amount', '0')).replace('$','').replace(',',''))
            
            paid_thru = last_paid
            days_before = 3 # Default fallback
            
            if user['payment_freq'] == 'Yearly' and yearly_fee > 0:
                years = int(amount // yearly_fee)
                if years > 0:
                    paid_thru = paid_thru.replace(year=paid_thru.year + years)
                    paid_thru = paid_thru.replace(month=12, day=31)
                days_before = notify_yearly
                    
            elif user['payment_freq'] == 'Monthly' and monthly_fee > 0:
                months = int(amount // monthly_fee)
                if months > 0:
                    year = paid_thru.year + ((paid_thru.month + months - 1) // 12)
                    month = (paid_thru.month + months - 1) % 12 + 1
                    day = calendar.monthrange(year, month)[1]
                    paid_thru = datetime(year, month, day)
                days_before = notify_monthly

            paid_thru_date = paid_thru.date()
            warning_date = paid_thru_date - timedelta(days=days_before)
            disable_date = paid_thru_date + timedelta(days=1)

            # --- WARNING EMAIL ---
            if today == warning_date and user.get('email'):
                print(f"Sending warning to {user['username']}")
                prefix = 'email_monthly' if user['payment_freq'] == 'Monthly' else 'email_yearly'
                subject = settings.get(f'{prefix}_subject', 'Subscription Reminder')
                body_tmpl = settings.get(f'{prefix}_body', 'Your subscription is due on {due_date}.')
                
                body = body_tmpl.replace('{full_name}', user.get('full_name', 'User'))\
                                .replace('{username}', user.get('username', ''))\
                                .replace('{due_date}', str(paid_thru_date))
                                
                send_notification_email(user['email'], subject, body)

            # --- DISABLE (DB ONLY) ---
            if today >= disable_date:
                print(f"Disabling {user['username']} (Expired {paid_thru_date})")
                user['status'] = 'Disabled'
                
                if user.get('email'):
                    subject = "Account Disabled"
                    body = f"Hi {user.get('full_name', 'User')},\n\nYour subscription expired on {paid_thru_date}. Your account has been marked as Disabled."
                    send_notification_email(user['email'], subject, body)
                
                updated = True

        except Exception as e:
            print(f"Error checking user {user.get('username')}: {e}")

    if updated:
        save_users(users)
        print("Automation: Users updated.")