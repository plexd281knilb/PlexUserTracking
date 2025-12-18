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
from email.utils import parsedate_to_datetime
from database import load_servers, load_users, save_users, load_payment_accounts, save_payment_accounts, load_settings, save_data, load_payment_logs

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
        return True
    except:
        return False

# --- SYNC PLEX USERS ---
def fetch_all_plex_users():
    servers = load_servers().get('plex', [])
    current_db_users = load_users()
    
    if not servers:
        return {"status": "Error: No Plex Servers configured"}

    active_plex_friends = {} 
    successful_connections = 0
    connection_errors = []

    print(f"--- STARTING PLEX SYNC ({len(servers)} servers) ---")

    for server in servers:
        token = server.get('token')
        if not token: 
            connection_errors.append(f"Server {server.get('name')} missing token")
            continue
            
        try:
            headers = {'X-Plex-Token': token, 'Accept': 'application/json'}
            r = requests.get('https://plex.tv/api/users', headers=headers, timeout=10)
            
            if r.status_code == 200:
                successful_connections += 1
                root = ET.fromstring(r.content)
                count_for_server = 0
                for u in root.findall('User'):
                    email = u.get('email', '').lower().strip()
                    username = u.get('username', '').strip()
                    key = email if email else username.lower()
                    
                    if key:
                        active_plex_friends[key] = { "username": username, "email": email }
                        count_for_server += 1
                        # DEBUG: Print found users
                        print(f"DEBUG: Found Plex User: {username} ({email})")
                print(f"Server {server.get('name')}: Found {count_for_server} friends.")
            else:
                print(f"Server {server.get('name')} failed: {r.status_code}")
        except Exception as e:
            print(f"Server {server.get('name')} exception: {e}")

    if successful_connections == 0:
        return {"status": "Error: Could not connect to any Plex server"}

    # 2. Rebuild User List (Strict Sync)
    final_users_list = []
    processed_keys = set()
    added_count = 0
    removed_count = 0
    
    # A. Filter Existing
    for db_user in current_db_users:
        u_email = db_user.get('email', '').lower().strip()
        u_name_lower = db_user.get('username', '').strip().lower()
        
        found_key = None
        if u_email and u_email in active_plex_friends: found_key = u_email
        elif u_name_lower and u_name_lower in active_plex_friends: found_key = u_name_lower
            
        if found_key:
            data = active_plex_friends[found_key]
            if data['username']: db_user['username'] = data['username']
            if data['email']: db_user['email'] = data['email']
            final_users_list.append(db_user)
            processed_keys.add(found_key)
        else:
            print(f"DEBUG: Removing User from DB: {db_user.get('username')} (Not found in Plex)")
            removed_count += 1
            
    # B. Add New
    max_id = max([u.get('id', 0) for u in final_users_list] + [0])
    for key, p_data in active_plex_friends.items():
        if key not in processed_keys:
            is_dup = any(u for u in final_users_list if u['email'] == p_data['email'] or u['username'].lower() == p_data['username'].lower())
            if not is_dup:
                max_id += 1
                final_users_list.append({
                    "id": max_id,
                    "username": p_data['username'],
                    "email": p_data['email'],
                    "full_name": "",
                    "status": "Pending",
                    "payment_freq": "Exempt",
                    "last_paid": "Never"
                })
                added_count += 1
            
    save_users(final_users_list)
    print(f"Sync Result: +{added_count} / -{removed_count}")
    return {"added": added_count, "removed": removed_count}

# --- PAYMENT FETCHERS ---
def process_payment(users, sender_name, amount_str, date_obj, service_name, existing_logs=None, save_db=True):
    date_str = datetime.now().strftime('%Y-%m-%d')
    try:
        if isinstance(date_obj, str):
            try:
                dt = parsedate_to_datetime(date_obj)
                date_str = dt.strftime('%Y-%m-%d')
            except:
                date_str = date_obj
        elif isinstance(date_obj, datetime):
            date_str = date_obj.strftime('%Y-%m-%d')
    except: pass 

    if existing_logs is None: existing_logs = load_payment_logs()
    
    raw_text = f"{sender_name} sent {amount_str}"
    # Deduplicate based on raw text and date
    duplicate = next((l for l in existing_logs if l.get('raw_text') == raw_text and l.get('date') == date_str), None)
    if duplicate:
        return False

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
            
            if save_db and user.get('email'):
                settings = load_settings()
                subject = settings.get('email_receipt_subject', 'Payment Received')
                body_tmpl = settings.get('email_receipt_body', 'Thank you for your payment of {amount}.')
                body = body_tmpl.replace('{full_name}', user.get('full_name', 'User')).replace('{username}', user.get('username', '')).replace('{amount}', amount_str)
                send_notification_email(user['email'], subject, body)
            break
    
    if save_db:
        save_data('payment_logs', existing_logs)
        save_users(users)
    return True

def fetch_venmo_payments():
    settings = load_settings()
    search_term = settings.get('venmo_search_term', 'paid you')
    accounts = load_payment_accounts('Venmo')
    users = load_users()
    count = 0
    errors = []
    
    venmo_pattern = re.compile(r"^(.*?)\s+paid\s+you\s+(\$\d+(?:,\d+)*(?:\.\d{2})?)", re.IGNORECASE)

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
                    subject = get_email_subject(msg)
                    match = venmo_pattern.search(subject)
                    if match:
                        sender = match.group(1).strip()
                        amount = match.group(2).strip()
                        if process_payment(users, sender, amount, msg["Date"], 'Venmo'): 
                            count += 1
            acc['last_scanned'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        except Exception as e: errors.append(str(e))
        finally:
            if mail: 
                try: mail.logout()
                except: pass
    save_users(users)
    save_payment_accounts('Venmo', accounts)
    return {"count": count, "errors": errors, "message": f"Scanned {count} Venmo payments."}

def fetch_paypal_payments():
    settings = load_settings()
    search_term = settings.get('paypal_search_term', 'sent you')
    accounts = load_payment_accounts('PayPal')
    users = load_users()
    count = 0
    errors = []
    
    paypal_pattern = re.compile(r"(.*?)\s+sent\s+you\s+(\$\d+(?:,\d+)*(?:\.\d{2})?)\s+USD", re.IGNORECASE)

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
                    subject = get_email_subject(msg)
                    match = paypal_pattern.search(subject)
                    if match:
                        sender = match.group(1).strip()
                        amount = match.group(2).strip()
                        if process_payment(users, sender, amount, msg["Date"], 'PayPal'): 
                            count += 1
            acc['last_scanned'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        except Exception as e: errors.append(str(e))
        finally:
            if mail: 
                try: mail.logout()
                except: pass
    save_users(users)
    save_payment_accounts('PayPal', accounts)
    return {"count": count, "errors": errors, "message": f"Scanned {count} PayPal payments."}

def fetch_zelle_payments():
    settings = load_settings()
    search_term = settings.get('zelle_search_term', 'received')
    accounts = load_payment_accounts('Zelle')
    users = load_users()
    count = 0
    errors = []
    
    zelle_pattern = re.compile(r"received\s+(\$\d+(?:,\d+)*(?:\.\d{2})?)\s+from\s+(.*)", re.IGNORECASE)

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
                    subject = get_email_subject(msg)
                    match = zelle_pattern.search(subject)
                    if match:
                        amount = match.group(1).strip()
                        sender = match.group(2).strip()
                        if process_payment(users, sender, amount, msg["Date"], 'Zelle'): 
                            count += 1
            acc['last_scanned'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        except Exception as e: errors.append(str(e))
        finally:
            if mail: 
                try: mail.logout()
                except: pass
    save_users(users)
    save_payment_accounts('Zelle', accounts)
    return {"count": count, "errors": errors, "message": f"Scanned {count} Zelle payments."}

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

def get_plex_libraries(token, manual_url=None):
    headers = {'X-Plex-Token': token, 'Accept': 'application/json'}
    def parse_libraries(response, server_name="Unknown"):
        libraries = []
        try:
            data = response.json()
            for d in data.get('MediaContainer', {}).get('Directory', []):
                libraries.append({ "id": d.get('key'), "title": d.get('title'), "type": d.get('type') })
            return {"status": "success", "libraries": libraries, "server_name": server_name}
        except: return {"error": "Parsing Failed"}
    if manual_url:
        try:
            res = requests.get(f"{manual_url}/library/sections", headers=headers, timeout=5, verify=False)
            if res.status_code == 200: return parse_libraries(res, "Manual Server")
        except: pass
    return {"error": "Connection Failed"}