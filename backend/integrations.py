import imaplib
import email
import re
import requests
import xml.etree.ElementTree as ET
from datetime import datetime
from email.header import decode_header
from database import load_servers, load_users, save_users, load_payment_accounts, save_payment_accounts, save_payment_log, load_settings, save_data, load_payment_logs

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

    if existing_logs is None: existing_logs = load_payment_logs()
    
    raw_text = f"{sender_name} sent {amount_str}"
    log_entry = None
    for log in existing_logs:
        if log.get('raw_text') == raw_text and log.get('date') == date_str:
            log_entry = log; break
    
    if not log_entry:
        log_entry = { "date": date_str, "service": service_name, "sender": sender_name, "amount": amount_str, "raw_text": raw_text, "status": "Unmapped", "mapped_user": None }
        existing_logs.insert(0, log_entry)

    match_found = False
    sender_clean = sender_name.lower().strip()
    
    for user in users:
        username = user.get('username', '').lower().strip()
        full_name = user.get('full_name', '').lower().strip()
        aka_list = [x.strip().lower() for x in user.get('aka', '').split(',') if x.strip()]

        if username and username == sender_clean: match_found = True
        if not match_found and full_name and len(full_name) > 3:
            if full_name in sender_clean or sender_clean in full_name: match_found = True
        if not match_found and aka_list:
            for alias in aka_list:
                if alias == sender_clean or (len(alias) > 3 and alias in sender_clean):
                    match_found = True; break

        if match_found:
            user['last_paid'] = date_str
            user['last_payment_amount'] = amount_str
            if user['status'] != 'Active':
                user['status'] = 'Active'
                if save_db: modify_plex_access(user, enable=True)
            else: user['status'] = 'Active'
            log_entry['status'] = "Matched"
            log_entry['mapped_user'] = user['username']
            if save_db: print(f"MATCH: {user['username']} -> {sender_name}")
            break
    
    if save_db:
        save_data('payment_logs', existing_logs)
        save_users(users)
    return match_found

def remap_existing_payments():
    users = load_users()
    logs = load_payment_logs()
    count = 0
    for log in logs:
        matched = process_payment(users, log['sender'], log['amount'], log['date'], log['service'], existing_logs=logs, save_db=False)
        if matched: count += 1
    save_data('payment_logs', logs)
    save_users(users)
    return count

def modify_plex_access(user, enable=True):
    settings = load_settings()
    if not enable and user.get('payment_freq') == 'Exempt': return ["Skipped: Exempt"]
    auto_ban = settings.get('plex_auto_ban', True)
    auto_invite = settings.get('plex_auto_invite', True)
    library_ids = settings.get('default_library_ids', [])

    if not enable and not auto_ban: return ["Skipped: Auto-Ban Disabled"]
    if enable and not auto_invite: return ["Skipped: Auto-Invite Disabled"]

    servers = load_servers()['plex']
    results = []
    for server in servers:
        token = server['token']
        headers = {'X-Plex-Token': token, 'Accept': 'application/json'}
        try:
            res = requests.get('https://plex.tv/api/resources?includeHttps=1', headers=headers, timeout=5)
            machine_id = None
            if res.status_code == 200:
                try:
                    root = ET.fromstring(res.content)
                    for device in root.findall('Device'):
                        if device.get('product') == 'Plex Media Server':
                            if device.get('name') == server['name']: machine_id = device.get('clientIdentifier'); break
                            if not machine_id: machine_id = device.get('clientIdentifier')
                except: pass
            if not machine_id: continue

            r = requests.get('https://plex.tv/api/users', headers=headers)
            if r.status_code != 200: continue
            
            plex_user_id = None
            try:
                root = ET.fromstring(r.content)
                for u in root.findall('User'):
                    if u.get('email', '').lower() == user['email'].lower() or u.get('username', '').lower() == user.get('username', '').lower():
                        plex_user_id = u.get('id'); break
            except: continue
            
            if not enable:
                if plex_user_id: requests.delete(f"https://plex.tv/api/friends/{plex_user_id}", headers=headers)
            else:
                if not plex_user_id: continue
                json_payload = { "server_id": machine_id, "shared_server": { "library_section_ids": library_ids, "invited_email": user['email'] } }
                requests.post(f"https://plex.tv/api/servers/{machine_id}/shared_servers", headers={'X-Plex-Token': token, 'Content-Type': 'application/json', 'Accept': 'application/json'}, json=json_payload)
        except: pass
    return results

def get_plex_libraries(token, manual_url=None):
    headers = {'X-Plex-Token': token, 'Accept': 'application/json'}
    def parse(response, name="Unknown"):
        libs = []
        try:
            data = response.json()
            for d in data.get('MediaContainer', {}).get('Directory', []):
                libs.append({ "id": d.get('key'), "title": d.get('title'), "type": d.get('type') })
            return {"status": "success", "libraries": libs, "server_name": name}
        except: return {"error": "Parsing Failed"}

    if manual_url:
        try:
            res = requests.get(f"{manual_url}/library/sections", headers=headers, timeout=5, verify=False)
            if res.status_code == 200: return parse(res, "Manual")
        except: pass
    return {"error": "Connection Failed"}

def fetch_venmo_payments():
    settings = load_settings()
    return _generic_fetch('venmo', 'venmo@venmo.com', re.compile(r"^(.*?) paid you (\$\d+\.\d{2})"), display_name='Venmo', search_term=settings.get('venmo_search_term'))

def fetch_paypal_payments():
    settings = load_settings()
    return _generic_fetch('paypal', 'service@paypal.com', re.compile(r"([A-Za-z ]+) sent you (\$\d+\.\d{2}) USD"), display_name='PayPal', search_term=settings.get('paypal_search_term'))

def fetch_zelle_payments():
    settings = load_settings()
    return _generic_fetch('zelle', None, re.compile(r"received (\$\d+\.\d{2}) from ([A-Za-z ]+)"), display_name='Zelle', search_term=settings.get('zelle_search_term'))

def _generic_fetch(service, sender_email, pattern, display_name=None, search_term=None):
    accounts = load_payment_accounts(service)
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
            
            criteria = f'(SUBJECT "{search_term}")' if search_term else '(ALL)'
            if sender_email: criteria = f'(FROM "{sender_email}" {criteria})'
            
            status, messages = mail.search(None, criteria)
            if status == 'OK':
                for e_id in messages[0].split()[-50:]:
                    _, msg_data = mail.fetch(e_id, '(RFC822)')
                    msg = email.message_from_bytes(msg_data[0][1])
                    body = get_email_body(msg)
                    subj = decode_header(msg["Subject"])[0][0]
                    if isinstance(subj, bytes): subj = subj.decode()
                    
                    match = pattern.search(subj)
                    if not match: match = pattern.search(body)
                    
                    if match:
                        p_sender, p_amt = match.group(1).strip(), match.group(2)
                        if service == 'zelle': p_sender, p_amt = match.group(2).strip(), match.group(1)
                        if process_payment(users, p_sender, p_amt, msg["Date"], display_name): count+=1
            
            acc['last_scanned'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        except Exception as e: errors.append(str(e))
        finally:
            if mail:
                try: mail.close(); mail.logout()
                except: pass

    save_users(users)
    save_payment_accounts(service, accounts)
    return {"count": count, "errors": errors}

def test_email_connection(host, port, email_user, email_pass):
    try:
        mail = imaplib.IMAP4_SSL(host, int(port))
        mail.login(email_user, email_pass)
        mail.logout()
        return {"status": "success"}
    except Exception as e: return {"status": "error", "message": str(e)}

def test_plex_connection(token):
    try:
        requests.get('https://plex.tv/api/users', headers={'X-Plex-Token': token}, timeout=5)
        return {"status": "success"}
    except Exception as e: return {"status": "error", "message": str(e)}

# --- NEW: Import Plex Users ---
def fetch_all_plex_users():
    servers = load_servers()['plex']
    users = load_users()
    count = 0
    for server in servers:
        try:
            r = requests.get('https://plex.tv/api/users', headers={'X-Plex-Token': server['token']})
            if r.status_code == 200:
                root = ET.fromstring(r.content)
                for u in root.findall('User'):
                    email = u.get('email', '').lower()
                    username = u.get('username')
                    if not email: continue
                    
                    # Check if user already exists
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