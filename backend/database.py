import json
import os

# --- PERSISTENCE SETUP ---
# We save all files to a 'data' subdirectory.
# You will map this folder in Unraid to keep your settings safe.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')

if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

def get_path(filename):
    return os.path.join(DATA_DIR, filename)

# --- Generic Load/Save Helpers ---
def load_data(filename, default_value):
    filepath = get_path(filename)
    if not os.path.exists(filepath):
        save_data(filename, default_value)
        return default_value
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return default_value

def save_data(filename, data):
    filepath = get_path(filename)
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=4)

# --- Settings ---
def load_settings():
    return load_data('settings.json', {})

def save_settings(data):
    save_data('settings.json', data)

# --- Users ---
def load_users():
    return load_data('users.json', [])

def save_users(data):
    save_data('users.json', data)

# --- Payment Accounts (Venmo/Zelle/PayPal) ---
def load_payment_accounts(service):
    all_accounts = load_data('payment_accounts.json', {'venmo': [], 'zelle': [], 'paypal': []})
    return all_accounts.get(service, [])

def save_payment_accounts(service, accounts):
    all_accounts = load_data('payment_accounts.json', {'venmo': [], 'zelle': [], 'paypal': []})
    all_accounts[service] = accounts
    save_data('payment_accounts.json', all_accounts)

def add_account(service, account_data):
    accounts = load_payment_accounts(service)
    new_id = 1
    if accounts:
        new_id = max(acc.get('id', 0) for acc in accounts) + 1
    
    account_data['id'] = new_id
    accounts.append(account_data)
    save_payment_accounts(service, accounts)
    return account_data

# --- Multi-Server Management (Plex/Tautulli) ---
def load_servers():
    return load_data('servers.json', {'plex': [], 'tautulli': []})

def save_servers(data):
    save_data('servers.json', data)

def add_server(type, server_data):
    data = load_servers()
    new_id = 1
    if data.get(type):
        new_id = max(s['id'] for s in data[type]) + 1
    
    server_data['id'] = new_id
    data[type].append(server_data)
    save_servers(data)
    return server_data

def delete_server(type, server_id):
    data = load_servers()
    if type in data:
        data[type] = [s for s in data[type] if s['id'] != server_id]
        save_servers(data)

# --- Payment Logs (History) ---
def load_payment_logs():
    return load_data('payment_logs.json', [])

def save_payment_log(log_entry):
    logs = load_payment_logs()
    # Avoid duplicates based on raw_text + date
    if not any(l.get('raw_text') == log_entry['raw_text'] and l.get('date') == log_entry['date'] for l in logs):
        logs.insert(0, log_entry) # Add to top
        save_data('payment_logs.json', logs[:500]) # Keep last 500

# --- Expenses ---
def load_expenses():
    return load_data('expenses.json', [])

def save_expenses(data):
    save_data('expenses.json', data)

def add_expense(expense_data):
    data = load_expenses()
    new_id = 1
    if data:
        new_id = max(item['id'] for item in data) + 1
    
    expense_data['id'] = new_id
    data.append(expense_data)
    save_expenses(data)
    return expense_data

def delete_expense(expense_id):
    data = load_expenses()
    initial_len = len(data)
    data = [d for d in data if d['id'] != expense_id]
    
    if len(data) < initial_len:
        save_expenses(data)
        return True
    return False