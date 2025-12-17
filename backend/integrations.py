import imaplib
import smtplib # <--- ADDED
import email
import re
import requests
import xml.etree.ElementTree as ET
from datetime import datetime
from email.header import decode_header
from email.mime.text import MIMEText # <--- ADDED
from email.mime.multipart import MIMEMultipart # <--- ADDED
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

# --- PLEX LOGIC (ROBUST) ---
def modify_plex_access(user, enable=True):
    """
    Central function to Grant or Revoke access.
    """
    action = "ENABLE" if enable else "DISABLE"
    print(f"--- PLEX {action}: {user['username']} ({user['email']}) ---")
    
    settings = load_settings()
    
    # 1. Check Exemptions & Global Toggles
    if not enable and user.get('payment_freq') == 'Exempt':
        print(f"Skipping {user['username']}: User is Exempt.")
        return
    
    if enable and not settings.get('plex_auto_invite', True):
        print("Skipping: Auto-Invite is OFF in settings.")
        return
        
    if not enable and not settings.get('plex_auto_ban', True):
        print("Skipping: Auto-Ban is OFF in settings.")
        return

    # 2. Map Servers to Library IDs (Integers)
    # Format in DB: "ServerName__LibraryID" -> Map: {"ServerName": [1, 2]}
    raw_config = settings.get('default_library_ids', [])
    server_libs_map = {}
    for item in raw_config:
        if "__" in item:
            srv_name, lib_id = item.split("__", 1)
            if srv_name not in server_libs_map: server_libs_map[srv_name] = []
            try:
                server_libs_map[srv_name].append(int(lib_id)) # CRITICAL: Convert to INT
            except: pass

    servers = load_servers()['plex']

    for server in servers:
        # If enabling, only touch servers we have libraries configured for
        if enable and server['name'] not in server_libs_map:
            continue

        token = server['token']
        headers = {'X-Plex-Token': token, 'Accept': 'application/json'}
        
        try:
            # A. FETCH MACHINE ID
            # We need this to send commands to the specific server
            res = requests.get('https://plex.tv/api/resources?includeHttps=1', headers=headers, timeout=10)
            machine_id = None
            if res.status_code == 200:
                try:
                    root = ET.fromstring(res.content)
                    for device in root.findall('Device'):
                        # Match by Name, ensure it's a Server
                        if device.get('product') == 'Plex Media Server' and device.get('name') == server['name']:
                            machine_id = device.get('clientIdentifier')
                            break
                except: pass
            
            if not machine_id:
                print(f"[{server['name']}] Failed: Could not find Machine ID.")
                continue

            # B. EXECUTE ACTION
            if enable:
                # --- ENABLE ACCESS ---
                lib_ids = server_libs_map.get(server['name'], [])
                if not lib_ids: continue

                # Payload: server_id is the machine_id, shared_server contains libs and email
                payload = {
                    "server_id": machine_id,
                    "shared_server": {
                        "library_section_ids": lib_ids,
                        "invited_email": user['email']
                    }
                }
                
                print(f"[{server['name']}] Inviting {user['email']} to libraries {lib_ids}...")
                inv_res = requests.post(f"https://plex.tv/api/servers/{machine_id}/shared_servers", headers=headers, json=payload)
                
                if inv_res.status_code in [200, 201]:
                    print(f"[{server['name']}] Success: Invited.")
                else:
                    print(f"[{server['name']}] Failed: {inv_res.text}")

            else:
                # --- DISABLE ACCESS ---
                # We must find the User's ID (Friend ID) to remove them
                plex_user_id = None
                try:
                    u_res = requests.get('https://plex.tv/api/users', headers=headers)
                    if u_res.status_code == 200:
                        root = ET.fromstring(u_res.content)
                        target_email = user.get('email', '').lower()
                        target_user = user.get('username', '').lower()
                        
                        for u in root.findall('User'):
                            u_email = u.get('email', '').lower()
                            u_name = u.get('username', '').lower()
                            # Match against Email OR Username
                            if (target_email and u_email == target_email) or \
                               (target_user and u_name == target_user):
                                plex_user_id = u.get('id')
                                break
                except: pass

                if plex_user_id:
                    print(f"[{server['name']}] Removing Friend ID {plex_user_id}...")
                    del_res = requests.delete(f"https://plex.tv/api/friends/{plex_user_id}", headers=headers)
                    if del_res.status_code == 200:
                        print(f"[{server['name']}] Success: Removed.")
                    else:
                        print(f"[{server['name']}] Failed to remove: {del_res.status_code}")
                else:
                    print(f"[{server['name']}] User not found in friend list.")

        except Exception as e:
            print(f"[{server['name']}] Error: {str(e)}")

# --- PAYMENT PROCESSING ---
def process_payment(users, sender_name, amount_str, date_obj, service_name, existing_logs=None, save_db=True):
    date_str = datetime.now().strftime('%Y-%m-%d')
    try:
        if isinstance(date_obj, str):
            date_tuple = email.utils.parsedate_tz(date_obj)
            if date_tuple:
                local_date = datetime.fromtimestamp(email.utils.mktime_tz(date_tuple))
                date_str = local_date.strftime('%Y-%m-%d')
            elif re.match(r"\d{4}-\d{2}-\d{2}", date_obj):
                date_str = date_obj
        else:
            date_str = date_obj.strftime('%Y-%m-%d')
    except: pass 

    if existing_logs is None:
        existing_logs = load_payment_logs()
    
    raw_text = f"{sender_name} sent {amount_str}"
    
    # Check if exists
    log_entry = None
    for log in existing_logs:
        if log.get('raw_text') == raw_text and log.get('date') == date_str:
            log_entry = log
            break
            
    if not log_entry:
        log_entry = { 
            "date": date_str, 
            "service": service_name, 
            "sender": sender_name, 
            "amount": amount_str, 
            "raw_text": raw_text, 
            "status": "Unmapped", 
            "mapped_user": None 
        }
        existing_logs.insert(0, log_entry)

    match_found = False
    sender_clean = sender_name.lower().strip()
    
    for user in users:
        # Check Username, Full Name, AKA
        names = [user.get('username', ''), user.get('full_name', '')] + user.get('aka', '').split(',')
        if any(n.strip().lower() in sender_clean for n in names if len(n.strip()) > 2):
            match_found = True
            user['last_paid'] = date_str
            user['last_payment_amount'] = amount_str
            
            # Reactivate if needed
            if user['status'] != 'Active':
                user['status'] = 'Active'
                if save_db: modify_plex_access(user, enable=True)
            else:
                # If already active, still ensure they have access (refresh)
                if save_db: modify_plex_access(user, enable=True)
                
            log_entry['status'] = "Matched"
            log_entry['mapped_user'] = user['username']
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
            if "venmo.com" in acc['email']: 
                criteria = f'(FROM "venmo@venmo.com" {criteria})'
            
            status, messages = mail.search(None, criteria)
            if status == 'OK':
                for e_id in messages[0].split()[-50:]:
                    _, msg_data = mail.fetch(e_id, '(RFC822)')
                    msg = email.message_from_bytes(msg_data[0][1])
                    subject = get_email_subject(msg)
                    match = venmo_pattern.search(subject)
                    if match:
                        if process_payment(users, match.group(1).strip(), match.group(2), msg["Date"], 'Venmo'): 
                            payment_count += 1
            
            acc['last_scanned'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        except Exception as e: errors.append(str(e))
        finally:
            if mail: 
                try: mail.logout()
                except: pass
                
    save_users(users)
    save_payment_accounts('venmo', accounts)
    return {"count": payment_count, "errors": errors}

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
                    subject = get_email_subject(msg)
                    match = paypal_pattern.search(subject)
                    if not match:
                        body = get_email_body(msg)
                        match = paypal_pattern.search(body)
                    
                    if match:
                        if process_payment(users, match.group(1).strip(), match.group(2), msg["Date"], 'PayPal'): count += 1
            
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
    
    zelle_pattern = re.compile(r"received (\$\d+\.\d{2}) from ([A-Za-z ]+)")

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
                    if not match:
                        body = get_email_body(msg)
                        match = zelle_pattern.search(body)
                    
                    if match:
                        if process_payment(users, match.group(2).strip(), match.group(1), msg["Date"], 'Zelle'): count += 1
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
                        users.append({
                            "id": new_id, 
                            "username": username, 
                            "email": email, 
                            "full_name": "", 
                            "status": "Pending", 
                            "payment_freq": "Exempt", 
                            "last_paid": "Never"
                        })
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

# --- EMAIL NOTIFICATION LOGIC (ADDED) ---
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

        # Standard SSL connection
        server = smtplib.SMTP_SSL(host, int(port))
        server.login(user, password)
        server.send_message(msg)
        server.quit()
        print(f"Email sent to {to_email}")
        return True
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
        return False