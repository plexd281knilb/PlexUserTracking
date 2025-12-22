import json
import os
from datetime import datetime

DATA_DIR = 'data'
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

FILES = {
    'users': os.path.join(DATA_DIR, 'users.json'),
    'servers': os.path.join(DATA_DIR, 'servers.json'),
    'payment_accounts': os.path.join(DATA_DIR, 'payment_accounts.json'),
    'payment_logs': os.path.join(DATA_DIR, 'payment_logs.json'),
    'expenses': os.path.join(DATA_DIR, 'expenses.json'),
    'settings': os.path.join(DATA_DIR, 'settings.json')
}

def load_data(key, default=None):
    filepath = FILES.get(key)
    if not filepath or not os.path.exists(filepath):
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

# --- Specific Wrappers ---
def load_users(): return load_data('users', [])
def save_users(users): save_data('users', users)

def load_servers(): return load_data('servers', {})
def save_servers(servers): save_data('servers', servers)

def load_payment_accounts(type=None):
    accounts = load_data('payment_accounts', [])
    if type:
        return [acc for acc in accounts if acc.get('type') == type]
    return accounts

def save_payment_accounts(type, accounts):
    all_accounts = load_data('payment_accounts', [])
    # Remove old accounts of this type
    other_accounts = [acc for acc in all_accounts if acc.get('type') != type]
    # Add new ones
    updated_list = other_accounts + accounts
    save_data('payment_accounts', updated_list)

def load_payment_logs(): return load_data('payment_logs', [])
def save_payment_log(log):
    logs = load_payment_logs()
    logs.append(log)
    save_data('payment_logs', logs)

def load_expenses(): return load_data('expenses', [])
def save_expenses(expenses): save_data('expenses', expenses)

def load_settings(): return load_data('settings', {})
def save_settings(settings): save_data('settings', settings)