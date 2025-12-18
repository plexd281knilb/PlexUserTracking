import json
import os

# Define data directory relative to this file
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

FILES = {
    'users': os.path.join(DATA_DIR, 'users.json'),
    'payment_logs': os.path.join(DATA_DIR, 'payment_logs.json'),
    'settings': os.path.join(DATA_DIR, 'settings.json'),
    'servers': os.path.join(DATA_DIR, 'servers.json'),
    'payment_accounts': os.path.join(DATA_DIR, 'payment_accounts.json'),
    'expenses': os.path.join(DATA_DIR, 'expenses.json')
}

def load_data(key, default=None):
    filepath = FILES.get(key)
    if not filepath: return default
    if not os.path.exists(filepath):
        with open(filepath, 'w') as f:
            json.dump(default if default is not None else [], f, indent=4)
        return default if default is not None else []
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except:
        return default if default is not None else []

def save_data(key, data):
    filepath = FILES.get(key)
    if filepath:
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=4)

# --- EXPORTED HELPERS ---

def load_users():
    return load_data('users', [])

def save_users(users):
    save_data('users', users)

def load_payment_logs():
    return load_data('payment_logs', [])

# CRITICAL FIX: Added missing function causing the crash
def save_payment_log(log_entry):
    if isinstance(log_entry, list):
        save_data('payment_logs', log_entry)
    else:
        logs = load_data('payment_logs', [])
        logs.append(log_entry)
        save_data('payment_logs', logs)

def load_settings():
    return load_data('settings', {})

def save_settings(settings):
    save_data('settings', settings)

def load_servers():
    return load_data('servers', {"plex": []})

def load_expenses():
    return load_data('expenses', [])

def load_payment_accounts(type_filter=None):
    accounts = load_data('payment_accounts', [])
    if type_filter:
        # Case-insensitive match (Fixes scanners disappearing)
        tf = type_filter.lower()
        return [acc for acc in accounts if acc.get('type', '').lower() == tf]
    return accounts

def save_payment_accounts(type_key, updated_list):
    all_accounts = load_data('payment_accounts', [])
    tf = type_key.lower()
    others = [acc for acc in all_accounts if acc.get('type', '').lower() != tf]
    
    # Ensure type is set on new entries
    for acc in updated_list:
        acc['type'] = type_key 
    
    save_data('payment_accounts', others + updated_list)