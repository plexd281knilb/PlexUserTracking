import imaplib
import email
import re
import requests
import xml.etree.ElementTree as ET
from datetime import datetime
from email.header import decode_header
from database import load_servers, load_users, save_users, load_payment_accounts, save_payment_accounts, save_payment_log, load_settings

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
def process_payment(users, sender_name, amount_str, date_obj, service_name):
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

    log_entry = {
        "date": date_str,
        "service": service_name,
        "sender": sender_name,
        "amount": amount_str,
        "raw_text": f"{sender_name} sent {amount_str}",
        "status": "Unmapped",
        "mapped_user": None
    }

    match_found = False
    sender_clean = sender_name.lower().strip()

    for user in users:
        # CHECK 1: Username match
        if sender_clean in user.get('username', '').lower(): match_found = True
        
        # CHECK 2: Full Name match
        if user.get('full_name') and sender_clean in user.get('full_name', '').lower(): match_found = True
        
        # CHECK 3: AKA / Alias match (split by commas)
        if user.get('aka'):
            aliases = [a.strip().lower() for a in user['aka'].split(',')]
            if any(alias in sender_clean for alias in aliases): match_found = True

        if match_found:
            if user.get('last_paid') != date_str:
                user['last_paid'] = date_str
                user['status'] = 'Active'
                
                # Update Log
                log_entry['status'] = "Matched"
                log_entry['mapped_user'] = user['username']
                print(f"MATCH: {user['username']} (AKA: {sender_name}) paid via {service_name}")
                break
    
    save_payment_log(log_entry)
    return match_found

# --- Plex Access Control ---
def modify_plex_access(user, enable=True):
    """
    Enable = Placeholder for Re-inviting (Requires Library IDs)
    Disable = Remove User from Shares
    """
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
            # 1. FIND USER ID on this server
            r = requests.get('https://plex.tv/api/users', headers=headers)
            if r.status_code != 200:
                results.append(f"{server['name']}: Connection Failed")
                continue

            root = ET.fromstring(r.content)
            plex_user_id = None
            
            # Find the Plex User ID matching our user's email or username
            for u in root.findall('User'):
                if u.get('email', '').lower() == user['email'].lower() or \
                   u.get('username', '').lower() == user.get('plex_username', '').lower():
                    plex_user_id = u.get('id')
                    break
            
            if not plex_user_id:
                results.append(f"{server['name']}: User not found on share list")
                continue

            if not enable:
                # DISABLE: Delete the friendship/share
                requests.delete(f"https://plex.tv/api/friends/{plex_user_id}", headers=headers)
                results.append(f"{server['name']}: Access Revoked")
            
            else:
                # ENABLE: Requires re-inviting logic
                results.append(f"{server['name']}: Please manually re-share libraries")

        except Exception as e:
            results.append(f"{server['name']}: Error {str(e)}")

    return results

# --- Payment Scanners ---

def fetch_venmo_payments():
    accounts = load_payment_accounts('venmo')
    users = load_users()
    payment_count = 0
    venmo_pattern = re.compile(r"^(.*?) paid you (\$\d+\.\d{2})")

    for account in accounts:
        if not account.get('enabled', True): continue
        try:
            mail = imaplib.IMAP4_SSL(account['imap_server'], account['port'])
            mail.login(account['email'], account['password'])
            mail.select('inbox')

            status, messages = mail.search(None, '(FROM "venmo@venmo.com")')
            if status != 'OK': continue

            email_ids = messages[0].split()
            recent_ids = email_ids[-50:] if len(email_ids) > 50 else email_ids

            for e_id in reversed(recent_ids):
                _, msg_data = mail.fetch(e_id, '(RFC822)')
                for response_part in msg_data:
                    if isinstance(response_part, tuple):
                        msg = email.message_from_bytes(response_part[1])
                        subject, encoding = decode_header(msg["Subject"])[0]
                        if isinstance(subject, bytes):
                            subject = subject.decode(encoding if encoding else "utf-8")

                        match = venmo_pattern.search(subject)
                        if match:
                            process_payment(users, match.group(1).strip(), match.group(2), msg["Date"], 'Venmo')
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
    paypal_pattern = re.compile(r"([A-Za-z ]+) sent you (\$\d+\.\d{2}) USD")

    for account in accounts:
        if not account.get('enabled', True): continue
        try:
            mail = imaplib.IMAP4_SSL(account['imap_server'], account['port'])
            mail.login(account['email'], account['password'])
            mail.select('inbox')

            status, messages = mail.search(None, '(FROM "service@paypal.com" SUBJECT "You\'ve got money")')
            if status != 'OK': continue

            email_ids = messages[0].split()
            recent_ids = email_ids[-50:] if len(email_ids) > 50 else email_ids

            for e_id in reversed(recent_ids):
                _, msg_data = mail.fetch(e_id, '(RFC822)')
                for response_part in msg_data:
                    if isinstance(response_part, tuple):
                        msg = email.message_from_bytes(response_part[1])
                        body = get_email_body(msg)
                        
                        match = paypal_pattern.search(body)
                        if match:
                            process_payment(users, match.group(1).strip(), match.group(2), msg["Date"], 'PayPal')
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
    zelle_pattern = re.compile(r"received (\$\d+\.\d{2}) from ([A-Za-z ]+)")

    for account in accounts:
        if not account.get('enabled', True): continue
        try:
            mail = imaplib.IMAP4_SSL(account['imap_server'], account['port'])
            mail.login(account['email'], account['password'])
            mail.select('inbox')

            status, messages = mail.search(None, '(OR SUBJECT "Zelle" SUBJECT "received money")')
            if status != 'OK': continue

            email_ids = messages[0].split()
            recent_ids = email_ids[-50:] if len(email_ids) > 50 else email_ids

            for e_id in reversed(recent_ids):
                _, msg_data = mail.fetch(e_id, '(RFC822)')
                for response_part in msg_data:
                    if isinstance(response_part, tuple):
                        msg = email.message_from_bytes(response_part[1])
                        body = get_email_body(msg)
                        
                        match = zelle_pattern.search(body)
                        if match:
                            process_payment(users, match.group(2).strip(), match.group(1), msg["Date"], 'Zelle')
                            payment_count += 1
            mail.close(); mail.logout()
            account['last_scanned'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        except Exception as e: print(f"Zelle Scan Error: {e}")

    save_users(users)
    save_payment_accounts('zelle', accounts)
    return payment_count

# --- TEST FUNCTIONS ---
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

# --- PLEX / TAUTULLI IMPORTS ---
def fetch_plex_users_single(token):
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

def fetch_tautulli_users_single(url, key):
    if not url.startswith('http'): url = 'http://' + url
    resp = requests.get(f"{url.rstrip('/')}/api/v2?apikey={key}&cmd=get_users", timeout=10)
    data = resp.json()
    current_users = load_users()
    count = 0
    
    for u in data['response']['data']:
        email_addr = u.get('email', '').lower()
        if not email_addr: continue
        if not any(cu['email'].lower() == email_addr for cu in current_users):
            current_users.append({
                "id": len(current_users) + 1, "name": u.get('username'), "email": email_addr,
                "plex_username": u.get('username'), "status": "Pending", "due": 0.00
            })
            count += 1
    save_users(current_users)
    return count

def fetch_all_plex_users():
    servers = load_servers()['plex']
    total_imported = 0
    for server in servers:
        try:
            count = fetch_plex_users_single(server['token']) 
            total_imported += count
        except Exception as e:
            print(f"Failed to import from {server['name']}: {e}")
    return total_imported

def fetch_all_tautulli_users():
    servers = load_servers()['tautulli']
    total_imported = 0
    for server in servers:
        try:
            count = fetch_tautulli_users_single(server['url'], server['key'])
            total_imported += count
        except Exception as e:
            print(f"Failed to import from {server['name']}: {e}")
    return total_imported