import json
import os

# --- PERSISTENCE SETUP ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')

if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

def get_path(filename):
    return os.path.join(DATA_DIR, filename)

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
    except: return default

def save_data(key, data):
    filepath = get_path(FILES.get(key, f"{key}.json"))
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=4)

# --- Wrappers ---
def load_settings():
    defaults = {"fee_monthly": "0.00", "fee_yearly": "0.00", "plex_auto_ban": True, "plex_auto_invite": True, "default_library_ids": []}
    data = load_data('settings', defaults)
    for k, v in defaults.items(): 
        if k not in data: data[k] = v
    return data
def save_settings(data): save_data('settings', data)

def load_users(): return load_data('users', [])
def save_users(data): save_data('users', data)

def load_servers():
    defaults = {'plex': [], 'tautulli': []}
    data = load_data('servers', defaults)
    if 'plex' not in data: data['plex'] = []
    return data
def save_servers(data): save_data('servers', data)
def add_server(type, data):
    servers = load_servers()
    if type not in servers: servers[type] = []
    data['id'] = (max([s['id'] for s in servers[type]], default=0) + 1)
    servers[type].append(data)
    save_servers(servers)
    return data
def delete_server(type, sid):
    servers = load_servers()
    if type in servers:
        servers[type] = [s for s in servers[type] if s['id'] != sid]
        save_servers(servers)

def load_payment_accounts(service=None):
    defaults = {'venmo': [], 'paypal': [], 'zelle': []}
    data = load_data('payment_accounts', defaults)
    for k in defaults: 
        if k not in data: data[k] = []
    if service: return data.get(service, [])
    return data
def save_payment_accounts(service, accounts):
    data = load_payment_accounts()
    data[service] = accounts
    save_data('payment_accounts', data)

def load_payment_logs(): return load_data('payment_logs', [])
def save_payment_log(log):
    logs = load_payment_logs()
    if not any(l['raw_text'] == log['raw_text'] and l['date'] == log['date'] for l in logs):
        logs.insert(0, log)
        save_data('payment_logs', logs)

def load_expenses(): return load_data('expenses', [])
def save_expenses(data): save_data('expenses', data)
def add_expense(data):
    expenses = load_expenses()
    data['id'] = (max([e['id'] for e in expenses], default=0) + 1)
    expenses.append(data)
    save_expenses(expenses)
    return data
def delete_expense(eid):
    expenses = load_expenses()
    initial = len(expenses)
    expenses = [e for e in expenses if e['id'] != eid]
    if len(expenses) < initial: save_expenses(expenses); return True
    return False