import json
import os

# --- PERSISTENCE SETUP ---
# We save all files to a 'data' subdirectory.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')

if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

def get_path(filename):
    return os.path.join(DATA_DIR, filename)

# Define file keys
FILES = {
    'users': 'users.json',
    'settings': 'settings.json',
    'servers': 'servers.json',
    'payment_logs': 'payment_logs.json',
    'payment_accounts': 'payment_accounts.json',
    'expenses': 'expenses.json'
}

# --- Generic Load/Save ---
def load_data(key, default=None):
    if default is None: default = []
    filename = FILES.get(key, f"{key}.json")
    filepath = get_path(filename)
    
    if not os.path.exists(filepath):
        save_data(key, default)
        return default
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return default

def save_data(key, data):
    filename = FILES.get(key, f"{key}.json")
    filepath = get_path(filename)
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=4)

# --- Settings ---
def load_settings():
    defaults = {
        "fee_monthly": "0.00", "fee_yearly": "0.00",
        "smtp_host": "", "smtp_port": "465", "smtp_user": "", "smtp_pass": "",
        "plex_auto_ban": True, "plex_auto_invite": True,
        "default_library_ids": []
    }
    data = load_data('settings', defaults)
    # Merge defaults to ensure new fields exist
    for k, v in defaults.items():
        if k not in data: data[k] = v
    return data

def save_settings(data): save_data('settings', data)

# --- Users ---
def load_users(): return load_data('users', [])
def save_users(users): save_data('users', users)

# --- Servers ---
def load_servers():
    defaults = {'plex': [], 'tautulli': []}
    data = load_data('servers', defaults)
    if 'plex' not in data: data['plex'] = []
    if 'tautulli' not in data: data['tautulli'] = []
    return data

def save_servers(data): save_data('servers', data)

def add_server(type, server_data):
    servers = load_servers()
    if type not in servers: servers[type] = []
    
    # Generate ID
    new_id = 1
    if servers[type]: new_id = max(s['id'] for s in servers[type]) + 1
    
    server_data['id'] = new_id
    servers[type].append(server_data)
    save_servers(servers)
    return server_data

def delete_server(type, server_id):
    servers = load_servers()
    if type in servers:
        servers[type] = [s for s in servers[type] if s['id'] != server_id]
        save_servers(servers)

# --- Payment Accounts ---
def load_payment_accounts(service=None):
    # Data Structure: { 'venmo': [], 'paypal': [], 'zelle': [] }
    defaults = {'venmo': [], 'paypal': [], 'zelle': []}
    data = load_data('payment_accounts', defaults)
    
    # Ensure keys exist
    for k in defaults:
        if k not in data: data[k] = []
        
    if service:
        return data.get(service, [])
    return data

def save_payment_accounts(service, accounts):
    data = load_payment_accounts() # Load all
    data[service] = accounts       # Update specific service
    save_data('payment_accounts', data)

# --- Payment Logs ---
def load_payment_logs(): return load_data('payment_logs', [])
def save_payment_log(log):
    logs = load_payment_logs()
    # Check duplicate
    if not any(l['raw_text'] == log['raw_text'] and l['date'] == log['date'] for l in logs):
        logs.insert(0, log)
        save_data('payment_logs', logs)

# --- Expenses ---
def load_expenses(): return load_data('expenses', [])
def save_expenses(expenses): save_data('expenses', expenses)

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