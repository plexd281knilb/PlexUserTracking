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
# ... (Keep imports and get_email_body helper) ...

# --- STRICTER PAYMENT PROCESSING ---
def process_payment(users, sender_name, amount_str, date_obj, service_name, existing_logs=None):
    # 1. Parse Date
    try:
        if isinstance(date_obj, str):
            date_str = date_obj # Already string
        else:
            date_tuple = email.utils.parsedate_tz(date_obj)
            if date_tuple:
                local_date = datetime.fromtimestamp(email.utils.mktime_tz(date_tuple))
                date_str = local_date.strftime('%Y-%m-%d')
            else:
                date_str = datetime.now().strftime('%Y-%m-%d')
    except:
        date_str = datetime.now().strftime('%Y-%m-%d')

    # 2. Check if log already exists (Avoid Duplicates)
    # If we are passing in existing_logs (for remapping), we skip this check
    if existing_logs is None:
        existing_logs = load_payment_logs()
        
    # Check if this exact payment is already logged
    # (Matches Date, Sender, Amount, and Raw Text)
    raw_text = f"{sender_name} sent {amount_str}"
    
    # Find existing log entry if it exists
    log_entry = None
    for log in existing_logs:
        if log.get('raw_text') == raw_text and log.get('date') == date_str:
            log_entry = log
            break
    
    # If not found, create a new one
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
        existing_logs.insert(0, log_entry) # Add to top

    # 3. MATCHING LOGIC (STRICTER)
    match_found = False
    sender_clean = sender_name.lower().strip()
    
    # Tokenize sender name (e.g. "Austin Bamrick" -> ["austin", "bamrick"])
    sender_tokens = sender_clean.split()

    for user in users:
        # SKIP checking generic usernames to avoid bad matches
        username = user.get('username', '').lower().strip()
        full_name = user.get('full_name', '').lower().strip()
        aka_list = [x.strip().lower() for x in user.get('aka', '').split(',') if x.strip()]

        # CHECK 1: Exact Username Match (if not empty)
        if username and username == sender_clean:
            match_found = True

        # CHECK 2: Full Name Match (Exact or contain full name)
        # We only check if full_name is at least 3 chars to avoid matching "Ed" to "Edward" incorrectly
        if not match_found and full_name and len(full_name) > 3:
            if full_name in sender_clean or sender_clean in full_name:
                match_found = True

        # CHECK 3: Alias (AKA) Match - EXACT or Token Match
        if not match_found and aka_list:
            for alias in aka_list:
                # "Bobby" matches "Bobby Smith"
                if alias == sender_clean or (len(alias) > 3 and alias in sender_clean):
                    match_found = True
                    break

        # ACTION IF MATCHED
        if match_found:
            # Update User
            if user.get('last_paid') != date_str:
                user['last_paid'] = date_str
                user['last_payment_amount'] = amount_str
                user['status'] = 'Active'
            
            # Update Log Status (The missing link!)
            log_entry['status'] = "Matched"
            log_entry['mapped_user'] = user['username']
            
            print(f"MATCH FOUND: {user['username']} -> {sender_name} (${amount_str})")
            break
    
    # If we are running a single scan, save everything. 
    # If remapping, the caller will save.
    if existing_logs is not None:
        from database import save_data
        save_data('payment_logs.json', existing_logs)
        save_users(users)
        
    return match_found

# ... (Keep existing Plex/Tautulli/Scanner functions) ...

# --- NEW: REMAP EXISTING PAYMENTS ---
def remap_existing_payments():
    """
    Re-runs the matching logic on ALL existing 'Unmapped' logs 
    against the current User database.
    """
    print("Starting manual remap...")
    users = load_users()
    logs = load_payment_logs() # Load all logs
    
    count = 0
    for log in logs:
        # Only check unmapped ones to save time, OR check all to fix bad matches?
        # Let's check ALL to fix the "Austin" -> "Anthony" error if user manually clears it.
        # Ideally, we only look at Unmapped, but since you have a bad match, let's look at all 
        # that aren't 'Manual Match'.
        
        # Reset bad match if needed (optional logic, but safer to just process unmapped for now)
        if log['status'] == 'Unmapped': 
            # Re-run logic
            # We treat the log as data inputs for process_payment
            # Note: process_payment saves the files, which is slow in a loop.
            # We should optimize, but for <1000 logs it's fine.
            
            # Extract data from log
            sender = log['sender']
            amount = log['amount']
            date = log['date']
            service = log['service']
            
            # Pass the WHOLE log list to process_payment so it updates it in place
            matched = process_payment(users, sender, amount, date, service, existing_logs=logs)
            if matched:
                count += 1

    return count

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

# --- NEW: Get Plex Libraries ---
def get_plex_libraries(token):
    """
    Connects to Plex Resources to find the server URL, 
    then fetches the library sections.
    """
    headers = {'X-Plex-Token': token, 'Accept': 'application/json'}
    
    try:
        # 1. Get Resources (Servers/Devices) from Plex.tv
        res = requests.get('https://plex.tv/api/resources?includeHttps=1', headers=headers, timeout=10)
        if res.status_code != 200:
            return {"error": "Failed to connect to Plex.tv"}
        
        root = ET.fromstring(res.content)
        server_device = None
        connection_uri = None

        # 2. Find the Plex Media Server device
        for device in root.findall('Device'):
            if device.get('product') == 'Plex Media Server':
                if device.get('presence') == '1':
                    server_device = device
                    break
        
        if not server_device:
            for device in root.findall('Device'):
                if device.get('product') == 'Plex Media Server':
                    server_device = device
                    break

        if not server_device:
            return {"error": "No Plex Media Server found for this account."}

        # 3. Find a working Connection URI (Prefer Local)
        for conn in server_device.findall('Connection'):
            uri = conn.get('uri')
            if conn.get('local') == '1':
                connection_uri = uri
                break
        
        if not connection_uri:
            connections = server_device.findall('Connection')
            if connections:
                connection_uri = connections[0].get('uri')

        if not connection_uri:
            return {"error": "Could not find a valid connection URL for the server."}

        print(f"DEBUG: Connecting to {connection_uri}")

        # 4. Fetch Libraries (Sections) from that URL
        lib_res = requests.get(f"{connection_uri}/library/sections", headers=headers, timeout=10, verify=False)
        
        if lib_res.status_code != 200:
            return {"error": f"Failed to fetch libraries: {lib_res.status_code}"}

        lib_root = ET.fromstring(lib_res.content)
        libraries = []
        for directory in lib_root.findall('Directory'):
            libraries.append({
                "id": directory.get('key'),
                "title": directory.get('title'),
                "type": directory.get('type')
            })

        return {"status": "success", "libraries": libraries, "server_name": server_device.get('name')}

    except Exception as e:
        print(f"PLEX LIB ERROR: {e}")
        return {"error": str(e)}

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
                "id": len(current_users) + 1, 
                "name": u.get('username'), 
                "username": u.get('username'),
                "email": email_addr,
                "plex_username": u.get('username'), 
                "status": "Pending", 
                "payment_freq": "Exempt",
                "last_paid": None,
                "last_payment_amount": None
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
                "id": len(current_users) + 1, 
                "name": u.get('username'), 
                "username": u.get('username'),
                "email": email_addr,
                "plex_username": u.get('username'), 
                "status": "Pending", 
                "payment_freq": "Exempt",
                "last_paid": None,
                "last_payment_amount": None
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