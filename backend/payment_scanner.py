import imaplib
import email
from datetime import datetime
import re
from .database import load_payment_accounts, save_payment_accounts, load_users, save_users
from .payment_parser import parse_payment_email

# NOTE: This uses imaplib, which is typically standard in Python. 
# Make sure to configure your email accounts to allow "less secure apps" or use App Passwords.

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

    for account in accounts:
        if not account.get('enabled'):
            continue
        
        mail = connect_to_imap(account)
        if not mail:
            continue

        try:
            mail.select('inbox')
            
            # Search for emails since the last scan date, or a default period
            since_date = datetime.strptime(account['last_scanned'], '%Y-%m-%d %H:%M:%S') if account.get('last_scanned') else datetime.now()
            search_date = since_date.strftime('%d-%b-%Y')
            
            # Simplified search for payment emails (adapt based on service)
            # You would need specific senders for Venmo/Zelle/Paypal
            # For simplicity here, we'll search recent messages.
            status, email_ids = mail.search(None, 'ALL') 
            
            if status == 'OK':
                for e_id in email_ids[0].split():
                    status, msg_data = mail.fetch(e_id, '(RFC822)')
                    if status != 'OK':
                        continue
                        
                    msg = email.message_from_bytes(msg_data[0][1])
                    
                    # This function is assumed to be defined externally and extracts payment info
                    payment_info = parse_payment_email(service, msg)
                    
                    if payment_info and payment_info['status'] == 'Paid':
                        # Find user by email or identifier
                        user = next((u for u in users if u['email'].lower() == payment_info['recipient_email'].lower()), None)
                        
                        if user:
                            # Mark user as paid for the current cycle
                            user['last_paid'] = datetime.now().strftime('%Y-%m-%d')
                            user['status'] = 'Active'
                            payment_count += 1
                        
                        # Optionally mark the email as "Read" or move it to a "Processed" folder
            
            # Update last scanned time
            account['last_scanned'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        except Exception as e:
            print(f"Error scanning email account {account['email']}: {e}")
        finally:
            mail.close()
            mail.logout()

    save_payment_accounts(service, accounts)
    save_users(users)
    return payment_count