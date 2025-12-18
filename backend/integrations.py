import imaplib
import smtplib
import email
import re
import requests
import xml.etree.ElementTree as ET
from datetime import datetime
from email.header import decode_header
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from database import load_servers, load_users, save_users, load_payment_accounts, save_payment_accounts, save_payment_log, load_settings, save_data, load_payment_logs

# --- HELPER FUNCTIONS ---
def get_email_body(msg):
    if msg.is_multipart():
        for part in msg.walk():
            ctype = part.get_content_type()
            cdispo = str(part.get('Content-Disposition'))
            if ctype == 'text/plain' and 'attachment' not in cdispo:
                return part.get_payload(decode=True).decode('utf-8', errors='ignore')
    else:
        return msg.get_payload(decode=True).decode('utf-8', errors='ignore')
    return ""

def get_email_subject(msg):
    subject_header = msg.get("Subject", "")
    if not subject_header: return ""
    decoded_list = decode_header(subject_header)
    subject = ""
    for token, encoding in decoded_list:
        if isinstance(token, bytes):
            subject += token.decode(encoding if encoding else "utf-8", errors="ignore")
        else:
            subject += str(token)
    return subject.strip()

# --- EMAIL LOGIC ---
def send_notification_email(to_email, subject, body):
    settings = load_settings()
    host = settings.get('smtp_host', '')
    port = settings.get('smtp_port', 465)
    user = settings.get('smtp_user', '')
    password = settings.get('smtp_pass', '')

    if not host or not user or not password:
        print(f"Skipping email to {to_email}: SMTP settings incomplete.")
        return False

    try:
        msg = MIMEMultipart()
        msg['From'] = user
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP_SSL(host, int(port))
        server.login(user, password)
        server.send_message(msg)
        server.quit()
        print(f"Email sent to {to_email}")
        return True
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
        return False

# --- PAYMENT PROCESSING (WITH RECEIPT) ---
def process_payment(users, sender_name, amount_str, date_obj, service_name, existing_logs=None, save_db=True):
    date_str = datetime.now().strftime('%Y-%m-%d')
    try:
        if isinstance(date_obj, str): date_str = date_obj
        else: date_str = date_obj.strftime('%Y-%m-%d')
    except: pass 

    if existing_logs is None: existing_logs = load_payment_logs()
    
    raw_text = f"{sender_name} sent {amount_str}"
    log_entry = next((l for l in existing_logs if l.get('raw_text') == raw_text), None)
    
    if not log_entry:
        log_entry = { "date": date_str, "service": service_name, "sender": sender_name, "amount": amount_str, "raw_text": raw_text, "status": "Unmapped", "mapped_user": None }
        existing_logs.insert(0, log_entry)

    match_found = False
    sender_clean = sender_name.lower().strip()
    
    for user in users:
        names = [user.get('username', ''), user.get('full_name', '')] + user.get('aka', '').split(',')
        if any(n.strip().lower() in sender_clean for n in names if len(n.strip()) > 2):
            match_found = True
            user['last_paid'] = date_str
            user['last_payment_amount'] = amount_str
            
            if user['status'] != 'Active': user['status'] = 'Active'
                
            log_entry['status'] = "Matched"
            log_entry['mapped_user'] = user['username']
            
            # --- SEND PAYMENT RECEIPT ---
            if save_db and user.get('email'):
                settings = load_settings()
                subject = settings.get('email_receipt_subject', 'Payment Received')
                body_tmpl = settings.get('email_receipt_body', 'Thank you for your payment of {amount}. You have been marked as paid.')
                
                body = body_tmpl.replace('{full_name}', user.get('full_name', 'User'))\
                                .replace('{username}', user.get('username', ''))\
                                .replace('{amount}', amount_str)
                
                send_notification_email(user['email'], subject, body)
            
            break
    
    if save_db:
        save_data('payment_logs', existing_logs)
        save_users(users)
    return match_found

# --- FETCHERS ---
def fetch_venmo_payments():
    settings = load_settings()
    search_term = settings.get('venmo_search_term', 'paid you')
    accounts = load_payment_accounts('venmo')
    users = load_users()
    payment_count = 0
    errors = []
    venmo_pattern = re.compile(r"^(.*?) paid you (\$\d+\.\d{2})", re.IGNORECASE)
    for acc in accounts:
        if not acc.get('enabled', True): continue
        mail = None
        try:
            mail = imaplib.IMAP4_SSL(acc['imap_server'], acc['port'])
            mail.login(acc['email'], acc['password'])
            mail.select('inbox')
            criteria = f'(SUBJECT "{search_term}")'
            if "venmo.com" in acc['email']: criteria = f'(FROM "venmo@venmo.com" {criteria})'
            status, messages = mail.search(None, criteria)
            if status == 'OK':
                for e_id in messages[0].split()[-50:]:
                    _, msg_data = mail.fetch(e_id, '(RFC822)')
                    msg = email.message_from_bytes(msg_data[0][1])
                    if process_payment(users, get_email_subject(msg), "0", msg["Date"], 'Venmo'): count += 1
            acc['last_scanned'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        except Exception as e: errors.append(str(e))
        finally:
            if mail: 
                try: mail.logout()
                except: pass
    save_users(users)
    save_payment_accounts('venmo', accounts)
    return {"count": count, "errors": errors}

def fetch_paypal_payments():
    settings = load_settings()
    search_term = settings.get('paypal_search_term', 'sent you')
    accounts = load_payment_accounts('paypal')
    users = load_users()
    count = 0
    errors = []
    paypal_pattern = re.compile(r"(.*?)\s+sent\s+you\s+(\$\d+\.\d{2})\s+USD", re.IGNORECASE)
    for acc in accounts:
        if not acc.get('enabled', True): continue
        mail = None
        try:
            mail = imaplib.IMAP4_SSL(acc['imap_server'], acc['port'])
            mail.login(acc['email'], acc['password'])
            mail.select('inbox')
            criteria = f'(SUBJECT "{search_term}")'
            status, messages = mail.search(None, criteria)
            if status == 'OK':
                for e_id in messages[0].split()[-50:]:
                    _, msg_data = mail.fetch(e_id, '(RFC822)')
                    msg = email.message_from_bytes(msg_data[0][1])
                    if process_payment(users, get_email_subject(msg), "0", msg["Date"], 'PayPal'): count += 1
            acc['last_scanned'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        except Exception as e: errors.append(str(e))
        finally:
            if mail: 
                try: mail.logout()
                except: pass
    save_users(users)
    save_payment_accounts('paypal', accounts)
    return {"count": count, "errors": errors}

def fetch_zelle_payments():
    settings = load_settings()
    search_term = settings.get('zelle_search_term', 'received')
    accounts = load_payment_accounts('zelle')
    users = load_users()
    count = 0
    errors = []
    for acc in accounts:
        if not acc.get('enabled', True): continue
        mail = None
        try:
            mail = imaplib.IMAP4_SSL(acc['imap_server'], acc['port'])
            mail.login(acc['email'], acc['password'])
            mail.select('inbox')
            criteria = f'(SUBJECT "{search_term}")'
            status, messages = mail.search(None, criteria)
            if status == 'OK':
                for e_id in messages[0].split()[-50:]:
                    _, msg_data = mail.fetch(e_id, '(RFC822)')
                    msg = email.message_from_bytes(msg_data[0][1])
                    if process_payment(users, get_email_subject(msg), "0", msg["Date"], 'Zelle'): count += 1
            acc['last_scanned'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        except Exception as e: errors.append(str(e))
        finally:
            if mail: 
                try: mail.logout()
                except: pass
    save_users(users)
    save_payment_accounts('zelle', accounts)
    return {"count": count, "errors": errors}

def fetch_all_plex_users():
    servers = load_servers()['plex']
    users = load_users()
    count = 0
    for server in servers:
        try:
            r = requests.get('https://plex.tv/api/users', headers={'X-Plex-Token': server['token']}, timeout=10)
            if r.status_code == 200:
                root = ET.fromstring(r.content)
                for u in root.findall('User'):
                    email = u.get('email', '').lower()
                    username = u.get('username')
                    if not email: continue
                    if not any(curr['email'].lower() == email for curr in users):
                        new_id = (max([x['id'] for x in users], default=0) + 1)
                        users.append({"id": new_id, "username": username, "email": email, "full_name": "", "status": "Pending", "payment_freq": "Exempt", "last_paid": "Never"})
                        count += 1
        except: pass
    save_users(users)
    return count

def test_plex_connection(token, url="https://plex.tv/api/users"):
    try:
        headers = {'X-Plex-Token': token, 'Accept': 'application/json'}
        requests.get(url, headers=headers, timeout=5)
        return {"status": "success"}
    except Exception as e: return {"status": "error", "message": str(e)}

def test_email_connection(host, port, email_user, email_pass):
    try:
        mail = imaplib.IMAP4_SSL(host, int(port))
        mail.login(email_user, email_pass)
        mail.logout()
        return {"status": "success", "message": "Connection Successful"}
    except Exception as e: return {"status": "error", "message": str(e)}