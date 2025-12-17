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
    if msg.is_multipart():
        for part in msg.walk():
            ctype = part.get_content_type()
            cdispo = str(part.get('Content-Disposition'))
            if ctype == 'text/plain' and 'attachment' not in cdispo:
                return part.get_payload(decode=True).decode('utf-8', errors='ignore')
    else:
        return msg.get_payload(decode=True).decode('utf-8', errors='ignore')
    return ""

# --- Helper: Extract Subject ---
def get_email_subject(msg):
    """Decodes the email subject, handling RFC 2047 encoding."""
    subject_header = msg.get("Subject", "")
    if not subject_header:
        return ""
    decoded_list = decode_header(subject_header)
    subject = ""
    for token, encoding in decoded_list:
        if isinstance(token, bytes):
            if encoding:
                subject += token.decode(encoding, errors="ignore")
            else:
                subject += token.decode("utf-8", errors="ignore")
        else:
            subject += str(token)
    return subject

# --- Payment Processing Logic ---
def process_payment(users, sender_name, amount_str, date_obj, service_name, existing_logs=None, save_db=True):
    # FIXED: Date Normalization to YYYY-MM-DD
    date_str = datetime.now().strftime('%Y-%m-%d')
    try:
        if isinstance(date_obj, str):
            # Try parsing email date (RFC 2822)
            date_tuple = email.utils.parsedate_tz(date_obj)
            if date_tuple:
                local_date = datetime.fromtimestamp(email.utils.mktime_tz(date_tuple))
                date_str = local_date.strftime('%Y-%m-%d')
            # Check if already YYYY-MM-DD
            elif re.match(r"\d{4}-\d{2}-\d{2}", date_obj):
                date_str = date_obj
        else:
            date_str = date_obj.strftime('%Y-%m-%d')
    except:
        pass 

    if existing_logs is None:
        existing_logs = load_payment_logs()
        
    raw_text = f"{sender_name} sent {amount_str}"
    log_entry = None
    
    # Check for duplicate
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
        username = user.get('username', '').lower().strip()
        full_name = user.get('full_name', '').lower().strip()
        aka_list = [x.strip().lower() for x in user.get('aka', '').split(',') if x.strip()]

        if username and username == sender_clean: match_found = True
        if not match_found and full_name and len(full_name) > 3:
            if full_name in sender_clean or sender_clean in full_name: match_found = True
        if not match_found and aka_list:
            for alias in aka_list:
                if alias == sender_clean or (len(alias) > 3 and alias in sender_clean):
                    match_found = True
                    break

        if match_found:
            user['last_paid'] = date_str
            user['last_payment_amount'] = amount_str
            
            if user['status'] != 'Active':
                user['status'] = 'Active'
                if save_db: 
                    print(f"Restoring access for {user['username']}...")
                    modify_plex_access(user, enable=True)
            else:
                user['status'] = 'Active'
            
            log_entry['status'] = "Matched"
            log_entry['mapped_user'] = user['username']
            if save_db: print(f"MATCH: {user['username']} -> {sender_name} (${amount_str})")
            break
    
    if save_db:
        save_data('payment_logs', existing_logs)
        save_users(users)
        
    return match_found

def remap_existing_payments():
    print("Starting Bulk Remap...")
    users = load_users()
    logs = load_payment_logs()
    count = 0
    for log in logs:
        matched = process_payment(users, log['sender'], log['amount'], log['date'], log['service'], existing_logs=logs, save_db=False)
        if matched: count += 1
    save_data('payment_logs', logs)
    save_users(users)
    print(f"Remap Complete. Matches found: {count}")
    return count

# --- PLEX LOGIC ---
def modify_plex_access(user, enable=True):
    settings = load_settings()
    if not enable and user.get('payment_freq') == 'Exempt': return ["Skipped: Exempt"]
    if not enable and not settings.get('plex_auto_ban', True): return ["Skipped: Auto-Ban Disabled"]
    if enable and not settings.get('plex_auto_invite', True): return ["Skipped: Auto-Invite Disabled"]

    # Parse Config
    raw_config = settings.get('default_library_ids', [])
    server_libs_map = {} 
    for item in raw_config:
        if "__" in item:
            srv_name, lib_id = item.split("__", 1)
            if srv_name not in server_libs_map: server_libs_map[srv_name] = []
            server_libs_map[srv_name].append(lib_id)

    servers = load_servers()['plex']
    results = []

    for server in servers:
        if enable and server['name'] not in server_libs_map: continue

        token = server['token']
        headers = {'X-Plex-Token': token, 'Accept': 'application/json'}
        try:
            res = requests.get('https://plex.tv/api/resources?includeHttps=1', headers=headers, timeout=5)
            machine_id = None
            if res.status_code == 200:
                root = ET.fromstring(res.content)
                for device in root.findall('Device'):
                    if device.get('name') == server['name']:
                        machine_id = device.get('clientIdentifier'); break
            
            if not machine_id: continue

            r = requests.get('https://plex.tv/api/users', headers=headers)
            plex_user_id = None
            if r.status_code == 200:
                root = ET.fromstring(r.content)
                for u in root.findall('User'):
                    if u.get('email', '').lower() == user['email'].lower() or \
                       u.get('username', '').lower() == user.get('username', '').lower():
                        plex_user_id = u.get('id'); break
            
            if not enable:
                if plex_user_id:
                    requests.delete(f"https://plex.tv/api/friends/{plex_user_id}", headers=headers)
                    results.append(f"{server['name']}: Access Revoked")
            else:
                lib_ids = server_libs_map.get(server['name'], [])
                payload = { 
                    "server_id": machine_id, 
                    "shared_server": { 
                        "library_section_ids": lib_ids, 
                        "invited_email": user['email'] 
                    } 
                }
                requests.post(f"https://plex.tv/api/servers/{machine_id}/shared_servers", headers={'X-Plex-Token': token, 'Content-Type': 'application/json', 'Accept': 'application/json'}, json=payload)
                results.append(f"{server['name']}: Access Granted")
        except Exception as e: results.append(f"{server['name']}: Error {str(e)}")
    return results

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

# --- FETCHERS (Fixed Syntax) ---

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
            if "venmo.com" in acc['email'] or "gmail" in acc['imap_server']:
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
            
        except Exception as e:
            errors.append(f"{acc['email']}: {str(e)}")
            print(f"Venmo Scan Error: {e}")
        finally:
            if mail:
                try:
                    mail.close()
                except:
                    pass
                try:
                    mail.logout()
                except:
                    pass

    save_users(users)
    save_payment_accounts('venmo', accounts)
    return {"count": payment_count, "errors": errors}

def fetch_paypal_payments():
    settings = load_settings()
    search_term = settings.get('paypal_search_term', 'sent you')
    accounts = load_payment_accounts('paypal')
    users = load_users()
    payment_count = 0
    errors = []
    
    # Matches: "Name sent you $50.00 USD"
    paypal_pattern = re.compile(r"(.*?) sent you (\$\d+\.\d{2}) USD", re.IGNORECASE)

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
                    
                    # 1. Check Subject First
                    subject = get_email_subject(msg)
                    match = paypal_pattern.search(subject)
                    
                    # 2. Check Body if no match
                    if not match:
                        body = get_email_body(msg)
                        match = paypal_pattern.search(body)
                    
                    if match:
                        if process_payment(users, match.group(1).strip(), match.group(2), msg["Date"], 'PayPal'):
                            payment_count += 1
            
            acc['last_scanned'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            
        except Exception as e:
            errors.append(f"{acc['email']}: {str(e)}")
            print(f"PayPal Scan Error: {e}")
        finally:
            if mail:
                try:
                    mail.close()
                except:
                    pass
                try:
                    mail.logout()
                except:
                    pass

    save_users(users)
    save_payment_accounts('paypal', accounts)
    return {"count": payment_count, "errors": errors}

def fetch_zelle_payments():
    settings = load_settings()
    search_term = settings.get('zelle_search_term', 'received')
    accounts = load_payment_accounts('zelle')
    users = load_users()
    payment_count = 0
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
                        if process_payment(users, match.group(2).strip(), match.group(1), msg["Date"], 'Zelle'):
                            payment_count += 1
            acc['last_scanned'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        except Exception as e:
            errors.append(f"{acc['email']}: {str(e)}")
            print(f"Zelle Scan Error: {e}")
        finally:
            if mail:
                try:
                    mail.close()
                except:
                    pass
                try:
                    mail.logout()
                except:
                    pass

    save_users(users)
    save_payment_accounts('zelle', accounts)
    return {"count": payment_count, "errors": errors}

# --- Utils ---
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
    except Exception as e:
        return {"status": "error", "message": str(e)}