import imaplib
import email
from datetime import datetime, timedelta
from email.header import decode_header
import time
# FIX: Using simple absolute imports
from database import load_payment_accounts, save_payment_accounts, load_users, save_users
from payment_parser import parse_payment_email

def connect_to_imap(account):
    """Establishes an IMAP connection."""
    try:
        mail = imaplib.IMAP4_SSL(account['imap_server'], account['port'])
        mail.login(account['email'], account['password'])
        return mail
    except Exception as e:
        print(f"IMAP Connection Error for {account['email']}: {e}")
        return None

def scan_for_payments(service):
    """Scans all enabled accounts for a service and updates user payments."""
    accounts = load_payment_accounts(service)
    users = load_users()
    payment_count = 0

    search_date_dt = datetime.now() - timedelta(days=7)
    search_date = search_date_dt.strftime('%d-%b-%Y')

    for account in accounts:
        if not account.get('enabled'):
            continue
        
        mail = connect_to_imap(account)
        if not mail:
            continue

        try:
            mail.select('inbox')
            
            status, email_ids = mail.search(None, f'(SINCE "{search_date}")')
            
            if status == 'OK':
                for e_id in reversed(email_ids[0].split()):
                    status, msg_data = mail.fetch(e_id, '(RFC822)')
                    if status != 'OK':
                        continue
                        
                    msg = email.message_from_bytes(msg_data[0][1])
                    payment_info = parse_payment_email(service, msg)
                    
                    if payment_info and payment_info['status'] == 'Paid':
                        user = next((u for u in users if u.get('email', '').lower() == payment_info['recipient_email'].lower()), None)
                        
                        if user:
                            user['last_paid'] = datetime.now().strftime('%Y-%m-%d')
                            user['status'] = 'Active' 
                            payment_count += 1
                        
            account['last_scanned'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        except Exception as e:
            print(f"Error scanning email account {account['email']}: {e}")
        finally:
            if mail:
                mail.close()
                mail.logout()

    save_payment_accounts(service, accounts)
    save_users(users)
    return payment_count