import smtplib
import datetime
import calendar
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from database import load_users, save_users, load_settings
from integrations import modify_plex_access

def send_email(to_email, subject, body):
    """Sends an email using the SMTP settings from System Settings."""
    settings = load_settings()
    smtp_host = settings.get('smtp_host')
    smtp_port = settings.get('smtp_port')
    smtp_user = settings.get('smtp_user')
    smtp_pass = settings.get('smtp_pass')
    
    if not (smtp_host and smtp_port and smtp_user and smtp_pass):
        print(f"EMAIL SKIPPED: SMTP settings missing. Wanted to send to {to_email}")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        # Standard SSL (Port 465)
        with smtplib.SMTP_SSL(smtp_host, int(smtp_port)) as server:
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        print(f"EMAIL SENT: Reminder sent to {to_email}")
    except Exception as e:
        print(f"EMAIL FAILED: {str(e)}")

def check_automation():
    """
    Run daily to check for reminders or disabling actions.
    - Reminds Monthly users on 25th & Last Day.
    - Reminds Yearly users on Dec 14, 15, 30.
    - Disables unpaid users on 1st of Month/Year.
    """
    print(f"--- Running Automation Check: {datetime.datetime.now()} ---")
    today = datetime.date.today()
    users = load_users()
    settings = load_settings()
    
    # Get Fees (Default to 0 if not set)
    monthly_fee = settings.get('fee_monthly', '0.00')
    yearly_fee = settings.get('fee_yearly', '0.00')

    # Helper: Check if paid in current period
    def has_paid_monthly(user):
        if not user.get('last_paid'): return False
        try:
            last_date = datetime.datetime.strptime(user['last_paid'], '%Y-%m-%d').date()
            # Paid in the current year AND current month?
            return last_date.year == today.year and last_date.month == today.month
        except: return False

    def has_paid_yearly(user):
        if not user.get('last_paid'): return False
        try:
            last_date = datetime.datetime.strptime(user['last_paid'], '%Y-%m-%d').date()
            # Paid in the current year?
            return last_date.year == today.year
        except: return False

    users_updated = False

    # --- 1. DISABLE LOGIC (Run only on the 1st of the Month) ---
    if today.day == 1:
        for user in users:
            # Skip if already disabled or Exempt
            if user['status'] != 'Active': continue
            if user.get('payment_freq') == 'Exempt': continue

            should_disable = False
            
            # A. Monthly Users: Did they pay LAST month?
            if user.get('payment_freq', 'Monthly') == 'Monthly':
                # Logic: If today is Feb 1, we check if they paid in Jan.
                # Actually simpler: If they haven't paid "Monthly" yet for THIS new month (Feb), 
                # that's fine, they have time. We need to check if they missed the PREVIOUS month.
                # However, your requirement is: "Disabled on 1st of next month if payment not received".
                # This implies checking the *previous* month's status.
                
                # Check Last Paid Date
                if not user.get('last_paid'):
                    should_disable = True
                else:
                    lp = datetime.datetime.strptime(user['last_paid'], '%Y-%m-%d').date()
                    # If last payment was before last month, disable.
                    # Simple check: If last_paid month != previous_month AND last_paid < today
                    first_of_this_month = today.replace(day=1)
                    if lp < first_of_this_month:
                         # If they haven't paid on or after the 1st of this current month, 
                         # strictly speaking they are "due", but usually we ban if they missed LAST month.
                         # Let's interpret "Disabled on 1st if payment not received" as "Didn't pay for the month that just finished".
                         
                         # Get previous month
                         last_month_date = first_of_this_month - datetime.timedelta(days=1)
                         if lp.month != last_month_date.month and lp.year == last_month_date.year:
                             # They didn't pay in the previous month
                             should_disable = True
                         elif lp < last_month_date.replace(day=1):
                             # They paid long ago (before previous month)
                             should_disable = True

            # B. Yearly Users: Check on Jan 1st for previous year
            elif user.get('payment_freq') == 'Yearly' and today.month == 1:
                if not user.get('last_paid'):
                    should_disable = True
                else:
                    lp = datetime.datetime.strptime(user['last_paid'], '%Y-%m-%d').date()
                    # If last payment was not in the previous year (or this year)
                    if lp.year < (today.year - 1):
                        should_disable = True
            
            if should_disable:
                print(f"ACTION: Disabling {user['username']} due to non-payment.")
                user['status'] = 'Disabled'
                # Trigger Plex Removal
                modify_plex_access(user, enable=False)
                
                amount_due = monthly_fee if user.get('payment_freq') == 'Monthly' else yearly_fee
                send_email(user['email'], "Plex Access Suspended", 
                           f"Your Plex access has been suspended due to non-payment.\n\nPlease pay ${amount_due} to reactivate immediately.")
                users_updated = True

    # --- 2. REMINDER LOGIC ---
    last_day_of_month = calendar.monthrange(today.year, today.month)[1]
    
    for user in users:
        if user['status'] != 'Active': continue
        if user.get('payment_freq') == 'Exempt': continue
        
        # Monthly Reminders (25th and Last Day)
        if user.get('payment_freq', 'Monthly') == 'Monthly':
            if today.day == 25 or today.day == last_day_of_month:
                if not has_paid_monthly(user):
                    send_email(user['email'], "Plex Payment Reminder", 
                               f"Hi {user.get('username')},\n\nJust a reminder that your monthly Plex fee of ${monthly_fee} is due.\nPlease pay via Venmo/Zelle to avoid interruption on the 1st.")

        # Yearly Reminders (Dec 14, 15, 30)
        elif user.get('payment_freq') == 'Yearly' and today.month == 12:
            if today.day in [14, 15, 30]:
                if not has_paid_yearly(user):
                    send_email(user['email'], "Plex Yearly Renewal Reminder", 
                               f"Hi {user.get('username')},\n\nYour yearly Plex subscription of ${yearly_fee} is due on Jan 1st.\nPlease make a payment to ensure your access continues into the new year.")

    if users_updated:
        save_users(users)
        print("User database updated after automation checks.")