import imaplib
import email
import re
import requests
import xml.etree.ElementTree as ET
from datetime import datetime
from email.header import decode_header
from database import load_settings, load_users, save_users, load_payment_accounts, save_payment_accounts

# --- Helper: Extract Body Text ---
def get_email_body(msg):
    """Extracts plain text body from an email message."""
    if msg.is_multipart():
        for part in msg.walk():
            ctype = part.get_content_type()
            cdispo = str(part.get('Content-Disposition'))
            if ctype == 'text/plain' and 'attachment' not in cdispo:
                return part.get_payload(decode=True).decode('utf-8', errors='ignore')
    else:
        return msg.get_payload(decode=True).decode('utf-8', errors='ignore')
    return ""

# --- Payment Scanners ---

def fetch_venmo_payments():
    accounts = load_payment_accounts('venmo')
    users = load_users()
    payment_count = 0
    
    # Subject: "Austin Bamrick paid you $180.00"
    venmo_pattern = re.compile(r"^(.*?) paid you (\$\d+\.\d{2})")

    for account in accounts:
        if not account.get('enabled'): continue
        try:
            mail = imaplib.IMAP4_SSL(account['imap_server'], account['port'])
            mail.login(account['email'], account['password'])
            mail.select('inbox')

            status, messages = mail.search(None, '(FROM "venmo@venmo.com")')
            if status != 'OK': continue

            for e_id in reversed(messages[0].split()):
                _, msg_data = mail.fetch(e_id, '(RFC822)')
                for response_part in msg_data:
                    if isinstance(response_part, tuple):
                        msg = email.message_from_bytes(response_part[1])
                        subject, encoding = decode_header(msg["Subject"])[0]
                        if isinstance(subject, bytes):
                            subject = subject.decode(encoding if encoding else "utf-8")

                        match = venmo_pattern.search(subject)
                        if match:
                            process_payment(users, match.group(1).strip(), match.group(2), msg["Date"])
                            payment_count += 1
            mail.close(); mail.logout()
            account['last_scanned'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        except Exception as e: print(f"Venmo Scan Error: {e}")

    save_users(users)
    save_payment_accounts('venmo', accounts)
    return payment_count

def fetch_paypal_payments():
    accounts = load_payment_accounts('paypal')
    users = load_users()
    payment_count = 0
    
    # Body: "Dane Bamrick sent you $30.00 USD"
    paypal_pattern = re.compile(r"([A-Za-z ]+) sent you (\$\d+\.\d{2}) USD")

    for account in accounts:
        if not account.get('enabled'): continue
        try:
            mail = imaplib.IMAP4_SSL(account['imap_server'], account['port'])
            mail.login(account['email'], account['password'])
            mail.select('inbox')

            # Search for PayPal emails
            status, messages = mail.search(None, '(FROM "service@paypal.com" SUBJECT "You\'ve got money")')
            if status != 'OK': continue

            for e_id in reversed(messages[0].split()):
                _, msg_data = mail.fetch(e_id, '(RFC822)')
                for response_part in msg_data:
                    if isinstance(response_part, tuple):
                        msg = email.message_from_bytes(response_part[1])
                        body = get_email_body(msg)
                        
                        match = paypal_pattern.search(body)
                        if match:
                            # Group 1 = Name, Group 2 = Amount
                            process_payment(users, match.group(1).strip(), match.group(2), msg["Date"])
                            payment_count += 1
            mail.close(); mail.logout()
            account['last_scanned'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        except Exception as e: print(f"PayPal Scan Error: {e}")

    save_users(users)
    save_payment_accounts('paypal', accounts)
    return payment_count

def fetch_zelle_payments():
    accounts = load_payment_accounts('zelle')
    users = load_users()
    payment_count = 0
    
    # Generic Zelle Pattern (Adjust based on your bank's specific email format)
    # Common: "You received $20.00 from John Doe"
    zelle_pattern = re.compile(r"received (\$\d+\.\d{2}) from ([A-Za-z ]+)")

    for account in accounts:
        if not account.get('enabled'): continue
        try:
            mail = imaplib.IMAP4_SSL(account['imap_server'], account['port'])
            mail.login(account['email'], account['password'])
            mail.select('inbox')

            # Search keywords typical for Zelle
            status, messages = mail.search(None, '(OR SUBJECT "Zelle" SUBJECT "received money")')
            if status != 'OK': continue

            for e_id in reversed(messages[0].split()):
                _, msg_data = mail.fetch(e_id, '(RFC822)')
                for response_part in msg_data:
                    if isinstance(response_part, tuple):
                        msg = email.message_from_bytes(response_part[1])
                        body = get_email_body(msg)
                        
                        # Try parsing body (common for Zelle notifications)
                        match = zelle_pattern.search(body)
                        if match:
                            # Group 1 = Amount, Group 2 = Name (Note the swapped order compared to others)
                            process_payment(users, match.group(2).strip(), match.group(1), msg["Date"])
                            payment_count += 1
            mail.close(); mail.logout()
            account['last_scanned'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        except Exception as e: print(f"Zelle Scan Error: {e}")

    save_users(users)
    save_payment_accounts('zelle', accounts)
    return payment_count

def process_payment(users, sender_name, amount_str, date_obj):
    """Updates user status if a match is found."""
    # Convert date
    try:
        date_tuple = email.utils.parsedate_tz(date_obj)
        if date_tuple:
            local_date = datetime.fromtimestamp(email.utils.mktime_tz(date_tuple))
            date_str = local_date.strftime('%Y-%m-%d')
        else:
            date_str = datetime.now().strftime('%Y-%m-%d')
    except:
        date_str = datetime.now().strftime('%Y-%m-%d')

    for user in users:
        # Fuzzy match: Is the sender's name inside the Plex User's name or vice versa?
        # You can add a 'payment_alias' field to users.json later for better matching
        if sender_name.lower() in user['name'].lower() or user['name'].lower() in sender_name.lower():
            if user.get('last_paid') != date_str:
                user['last_paid'] = date_str
                user['status'] = 'Active'
                print(f"MATCH: {user['name']} paid {amount_str} via {sender_name} on {date_str}")
                return True
    return False

# --- Plex & Tautulli Imports (Preserved from previous step) ---

def fetch_plex_users():
    settings = load_settings()
    token = settings.get('plex_token')
    if not token: raise Exception("Plex Token missing")
    
    headers = {'X-Plex-Token': token, 'Accept': 'application/json'}
    response = requests.get('https://plex.tv/api/users', headers=headers)
    if response.status_code != 200: raise Exception(f"Plex Error: {response.text}")
    
    root = ET.fromstring(response.content)
    current_users = load_users()
    count = 0
    
    for u in root.findall('User'):
        email_addr = u.get('email', '').lower()
        if email_addr and not any(cu['email'].lower() == email_addr for cu in current_users):
            current_users.append({
                "id": len(current_users) + 1, "name": u.get('username'), "email": email_addr,
                "plex_username": u.get('username'), "status": "Pending", "due": 0.00
            })
            count += 1
            
    save_users(current_users)
    return count

def fetch_tautulli_users():
    settings = load_settings()
    key = settings.get('tautulli_api_key')
    url = settings.get('tautulli_url')
    if not key or not url: raise Exception("Tautulli Settings missing")
    
    resp = requests.get(f"{url.rstrip('/')}/api/v2?apikey={key}&cmd=get_users")
    data = resp.json()
    
    current_users = load_users()
    count = 0
    
    for u in data['response']['data']:
        email_addr = u.get('email', '').lower()
        if email_addr and not any(cu['email'].lower() == email_addr for cu in current_users):
            current_users.append({
                "id": len(current_users) + 1, "name": u.get('username'), "email": email_addr,
                "plex_username": u.get('username'), "status": "Pending", "due": 0.00
            })
            count += 1
            
    save_users(current_users)
    return count