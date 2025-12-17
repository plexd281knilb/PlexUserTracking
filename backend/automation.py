from datetime import datetime, timedelta
from database import load_users, save_users, load_settings
from integrations import modify_plex_access, send_notification_email
import calendar

def check_automation():
    print("--- RUNNING AUTOMATION CHECK ---")
    users = load_users()
    settings = load_settings()
    
    monthly_fee = float(settings.get('fee_monthly', 0))
    yearly_fee = float(settings.get('fee_yearly', 0))
    
    today = datetime.now().date() # Compare dates only
    updated = False

    for user in users:
        # Skip Exempt or already Disabled
        if user.get('payment_freq') == 'Exempt': continue
        if user.get('status') == 'Disabled': continue
        if not user.get('last_paid') or user['last_paid'] == 'Never': continue

        try:
            last_paid = datetime.strptime(user['last_paid'], '%Y-%m-%d')
            amount = float(str(user.get('last_payment_amount', '0')).replace('$','').replace(',',''))
            
            # --- CALCULATE PAID THRU ---
            paid_thru = last_paid
            if user['payment_freq'] == 'Yearly' and yearly_fee > 0:
                years = int(amount // yearly_fee)
                if years > 0:
                    paid_thru = paid_thru.replace(year=paid_thru.year + years)
                    paid_thru = paid_thru.replace(month=12, day=31)
                    
            elif user['payment_freq'] == 'Monthly' and monthly_fee > 0:
                months = int(amount // monthly_fee)
                if months > 0:
                    year = paid_thru.year + ((paid_thru.month + months - 1) // 12)
                    month = (paid_thru.month + months - 1) % 12 + 1
                    day = calendar.monthrange(year, month)[1]
                    paid_thru = datetime(year, month, day)

            paid_thru_date = paid_thru.date()
            disable_date = paid_thru_date + timedelta(days=1)
            warning_date = paid_thru_date - timedelta(days=3)

            # --- AUTOMATION LOGIC ---
            
            # 1. Warning Email (3 days before)
            if today == warning_date:
                print(f"Sending warning to {user['username']}")
                subject = "Plex Subscription Expiring Soon"
                body = f"Hi {user.get('full_name', 'User')},\n\nYour Plex subscription is set to expire on {paid_thru_date}. Please renew to maintain access.\n\nThanks!"
                send_notification_email(user['email'], subject, body)

            # 2. Disable & Revoke (Day after expiry)
            if today >= disable_date:
                print(f"User {user['username']} expired on {paid_thru_date}. Disabling...")
                user['status'] = 'Disabled'
                
                # Revoke Plex Access
                modify_plex_access(user, enable=False) 
                
                # Send "Account Disabled" Email
                subject = "Plex Access Disabled"
                body = f"Hi {user.get('full_name', 'User')},\n\nYour subscription expired on {paid_thru_date} and access has been revoked. Please make a payment to reactivate."
                send_notification_email(user['email'], subject, body)
                
                updated = True

        except Exception as e:
            print(f"Error checking user {user.get('username')}: {e}")

    if updated:
        save_users(users)
        print("Automation: Users updated.")