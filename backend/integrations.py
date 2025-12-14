import imaplib
import email
import re
import requests
import xml.etree.ElementTree as ET
from datetime import datetime
from email.header import decode_header
from database import load_servers, load_users, save_users, load_payment_accounts, save_payment_accounts, save_payment_log, load_settings, save_data, load_payment_logs

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

# --- Payment Processing Logic ---
def process_payment(users, sender_name, amount_str, date_obj, service_name, existing_logs=None, save_db=True):
    # 1. Parse Date
    try:
        if isinstance(date_obj, str):
            date_str = date_obj
        else:
            date_tuple = email.utils.parsedate_tz(date_obj)
            if date_tuple:
                local_date = datetime.fromtimestamp(email.utils.mktime_tz(date_tuple))
                date_str = local_date.strftime('%Y-%m-%d')
            else:
                date_str = datetime.now().strftime('%Y-%m-%d')
    except:
        date_str = datetime.now().strftime('%Y-%m-%d')

    # 2. Get/Create Log Entry
    if existing_logs is None:
        existing_logs = load_payment_logs()
        
    raw_text = f"{sender_name} sent {amount_str}"
    log_entry = None
    
    # Find existing log
    for log in existing_logs:
        if log.get('raw_text') == raw_text and log.get('date') == date_str:
            log_entry = log
            break
    
    # Create if new
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

    # 3. MATCHING LOGIC
    match_found = False
    sender_clean = sender_name.lower().strip()
    
    for user in users:
        username = user.get('username', '').lower().strip()
        full_name = user.get('full_name', '').lower().strip()
        aka_list = [x.strip().lower() for x in user.get('aka', '').split(',') if x.strip()]

        # Check 1: Username
        if username and username == sender_clean: match_found = True
        
        # Check 2: Full Name (contains)
        if not match_found and full_name and len(full_name) > 3:
            if full_name in sender_clean or sender_clean in full_name: match_found = True

        # Check 3: AKA
        if not match_found and aka_list:
            for alias in aka_list:
                if alias == sender_clean or (len(alias) > 3 and alias in sender_clean):
                    match_found = True
                    break

        if match_found:
            # Update User if this payment is newer or same date
            user['last_paid'] = date_str
            user['last_payment_amount'] = amount_str
            user['status'] = 'Active'
            
            log_entry['status'] = "Matched"
            log_entry['mapped_user'] = user['username']
            
            if save_db: 
                print(f"MATCH: {user['username']} -> {sender_name} (${amount_str})")
            break
    
    # 4. Save (Only if requested - optimization for bulk operations)
    if save_db:
        save_data('payment_logs.json', existing_logs)
        save_users(users)
        
    return match_found

# --- Remap Function ---
def remap_existing_payments():
    """
    Re-runs matching on all logs.
    Saves only ONCE at the end for speed.
    """
    print("Starting Bulk Remap...")
    users = load_users()
    logs = load_payment_logs()
    count = 0
    
    for log in logs:
        # Pass save_db=False to prevent disk writes on every loop
        matched = process_payment(
            users, 
            log['sender'], 
            log['amount'], 
            log['date'], 
            log['service'], 
            existing_logs=logs, 
            save_db=False # <--- CRITICAL OPTIMIZATION
        )
        if matched:
            count += 1

    # Save once at the end
    save_data('payment_logs.json', logs)
    save_users(users)
    print(f"Remap Complete. Matches found: {count}")
    return count

# --- Plex Access Control ---
def modify_plex_access(user, enable=True):
    # SAFETY CHECK: Never disable an Exempt user
    if not enable and user.get('payment_freq') == 'Exempt':
        print(f"SAFETY: Skipping disable for exempt user {user.get('username')}")
        return [f"Skipped {user.get('username')}: User is Exempt"]

    servers = load_servers()['plex']
    results = []

    for server in servers:
        token = server['token']
        headers = {'X-Plex-Token': token, 'Accept': 'application/json'}
        try:
            r = requests.get('https://plex.tv/api/users', headers=headers)
            if r.status_code != 200: continue

            root = ET.fromstring(r.content)
            plex_user_id = None
            for u in root.findall('User'):
                if u.get('email', '').lower() == user['email'].lower() or \
                   u.get('username', '').lower() == user.get('plex_username', '').lower():
                    plex_user_id = u.get('id')
                    break
            
            if not plex_user_id: continue

            if not enable:
                requests.delete(f"https://plex.tv/api/friends/{plex_user_id}", headers=headers)
                results.append(f"{server['name']}: Access Revoked")
            else:
                results.append(f"{server['name']}: Please manually re-share libraries")

        except Exception as e:
            results.append(f"{server['name']}: Error {str(e)}")

    return results

# --- NEW: Get Plex Libraries ---
def get_plex_libraries(token):
    headers = {'X-Plex-Token': token, 'Accept': 'application/json'}
    try:
        res = requests.get('https://plex.tv/api/resources?includeHttps=1', headers=headers, timeout=5)
        if res.status_code != 200: return {"error": "Failed to connect to Plex"}
        
        root = ET.fromstring(res.content)
        server_device = None
        connection_uri = None

        for device in root.findall('Device'):
            if device.get('product') == 'Plex Media Server':
                if device.get('presence') == '1':
                    server_device = device
                    break
        
        if not server_device: return {"error": "No Plex Media Server found"}

        for conn in server_device.findall('Connection'):
            if conn.get('local') == '1': connection_uri = conn.get('uri'); break
        
        if not connection_uri:
             if len(server_device.findall('Connection')) > 0:
                 connection_uri = server_device.findall('Connection')[0].get('uri')

        if not connection_uri: return {"error": "No reachable server found"}
        
        lib_res = requests.get(f"{connection_uri}/library/sections", headers=headers, timeout=5, verify=False)
        lib_root = ET.fromstring(lib_res.content)
        libraries = [{"id": d.get('key'), "title": d.get('title'), "type": d.get('type')} for d in lib_root.findall('Directory')]
        return {"status": "success", "libraries": libraries, "server_name": server_device.get('name')}
    except Exception as e: return {"error": str(e)}

# --- Fetchers ---
def fetch_venmo_payments():
    accounts = load_payment_accounts('venmo')
    users = load_users()
    count = 0
    pattern = re.compile(r"^(.*?) paid you (\$\d+\.\d{2})")
    for acc in accounts:
        if not acc.get('enabled', True): continue
        try:
            mail = imaplib.IMAP4_SSL(acc['imap_server'], acc['port'])
            mail.login(acc['email'], acc['password'])
            mail.select('inbox')
            status, messages = mail.search(None, '(FROM "venmo@venmo.com")')
            if status == 'OK':
                for e_id in messages[0].split()[-50:]:
                    _, msg_data = mail.fetch(e_id, '(RFC822)')
                    msg = email.message_from_bytes(msg_data[0][1])
                    subject, encoding = decode_header(msg["Subject"])[0]
                    if isinstance(subject, bytes): subject = subject.decode(encoding or "utf-8")
                    match = pattern.search(subject)
                    if match:
                        if process_payment(users, match.group(1).strip(), match.group(2), msg["Date"], 'Venmo'): count+=1
            mail.close(); mail.logout()
        except: pass
    save_users(users)
    return count

def fetch_paypal_payments():
    accounts = load_payment_accounts('paypal')
    users = load_users()
    count = 0
    pattern = re.compile(r"([A-Za-z ]+) sent you (\$\d+\.\d{2}) USD")
    for acc in accounts:
        if not acc.get('enabled', True): continue
        try:
            mail = imaplib.IMAP4_SSL(acc['imap_server'], acc['port'])
            mail.login(acc['email'], acc['password'])
            mail.select('inbox')
            status, messages = mail.search(None, '(FROM "service@paypal.com" SUBJECT "You\'ve got money")')
            if status == 'OK':
                for e_id in messages[0].split()[-50:]:
                    _, msg_data = mail.fetch(e_id, '(RFC822)')
                    msg = email.message_from_bytes(msg_data[0][1])
                    body = get_email_body(msg)
                    match = pattern.search(body)
                    if match:
                        if process_payment(users, match.group(1).strip(), match.group(2), msg["Date"], 'PayPal'): count+=1
            mail.close(); mail.logout()
        except: pass
    save_users(users)
    return count

def fetch_zelle_payments():
    accounts = load_payment_accounts('zelle')
    users = load_users()
    count = 0
    pattern = re.compile(r"received (\$\d+\.\d{2}) from ([A-Za-z ]+)")
    for acc in accounts:
        if not acc.get('enabled', True): continue
        try:
            mail = imaplib.IMAP4_SSL(acc['imap_server'], acc['port'])
            mail.login(acc['email'], acc['password'])
            mail.select('inbox')
            status, messages = mail.search(None, '(OR SUBJECT "Zelle" SUBJECT "received money")')
            if status == 'OK':
                for e_id in messages[0].split()[-50:]:
                    _, msg_data = mail.fetch(e_id, '(RFC822)')
                    msg = email.message_from_bytes(msg_data[0][1])
                    body = get_email_body(msg)
                    match = pattern.search(body)
                    if match:
                        if process_payment(users, match.group(2).strip(), match.group(1), msg["Date"], 'Zelle'): count+=1
            mail.close(); mail.logout()
        except: pass
    save_users(users)
    return count

# --- Imports (Plex/Tautulli) ---
def fetch_all_plex_users():
    servers = load_servers()['plex']
    count = 0
    for server in servers:
        try:
            headers = {'X-Plex-Token': server['token'], 'Accept': 'application/json'}
            r = requests.get('https://plex.tv/api/users', headers=headers)
            root = ET.fromstring(r.content)
            users = load_users()
            for u in root.findall('User'):
                email_addr = u.get('email', '').lower()
                if email_addr and not any(cu['email'].lower() == email_addr for cu in users):
                    users.append({
                        "id": len(users)+1, "name": u.get('username'), "username": u.get('username'),
                        "email": email_addr, "plex_username": u.get('username'), "status": "Pending",
                        "payment_freq": "Exempt", "last_paid": None, "last_payment_amount": None
                    })
                    count += 1
            save_users(users)
        except: pass
    return count

def fetch_all_tautulli_users():
    servers = load_servers()['tautulli']
    count = 0
    for server in servers:
        try:
            url = f"{server['url'].rstrip('/')}/api/v2?apikey={server['key']}&cmd=get_users"
            if not url.startswith('http'): url = 'http://' + url
            data = requests.get(url, timeout=10).json()
            users = load_users()
            for u in data['response']['data']:
                email_addr = u.get('email', '').lower()
                if email_addr and not any(cu['email'].lower() == email_addr for cu in users):
                    users.append({
                        "id": len(users)+1, "name": u.get('username'), "username": u.get('username'),
                        "email": email_addr, "plex_username": u.get('username'), "status": "Pending",
                        "payment_freq": "Exempt", "last_paid": None, "last_payment_amount": None
                    })
                    count += 1
            save_users(users)
        except: pass
    return count

def test_plex_connection(token, url="https://plex.tv/api/users"):
    try:
        headers = {'X-Plex-Token': token, 'Accept': 'application/json'}
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            return {"status": "success", "message": "Connection Successful!"}
        return {"status": "error", "message": f"Auth failed: {response.status_code}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def test_tautulli_connection(url, key):
    try:
        clean_url = f"{url.rstrip('/')}/api/v2?apikey={key}&cmd=get_server_info"
        response = requests.get(clean_url, timeout=5)
        data = response.json()
        if data.get('response', {}).get('result') == 'success':
            server_name = data['response']['data'].get('pms_identifier', 'Unknown')
            return {"status": "success", "message": f"Connected to {server_name}"}
        return {"status": "error", "message": "Invalid API Key or URL"}
    except Exception as e:
        return {"status": "error", "message": str(e)}