import json
import os
from datetime import datetime

# Define the base data path (relative to /app in Docker)
DATA_DIR = os.path.join(os.getcwd(), 'data')
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

# --- General Data Handling ---

def load_data(filename, default_data=None):
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        if default_data is None:
            default_data = [] 
        
        os.makedirs(os.path.dirname(path) or DATA_DIR, exist_ok=True)
        
        with open(path, 'w') as f:
            json.dump(default_data, f, indent=4)
        return default_data
    try:
        with open(path, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        print(f"Error decoding JSON from {filename}. Returning default data.")
        return []

def save_data(filename, data):
    path = os.path.join(DATA_DIR, filename)
    with open(path, 'w') as f:
        json.dump(data, f, indent=4)

# --- Core Data Functions (Used by routes) ---

# Users
def load_users():
    return load_data('users.json', [])

def save_users(users):
    save_data('users.json', users)

# Settings (Expanded for Plex/Tautulli/SMTP)
def load_settings():
    return load_data('settings.json', {
        'dark_mode': True,           # Default to dark mode
        'scan_interval_min': 60,
        'plex_token': None,          # NEW: Plex token
        'tautulli_api_key': None,    # NEW: Tautulli API key
        'tautulli_url': None,        # NEW: Tautulli URL
        'smtp_server': '',
        'smtp_port': 587,
        'from_email': '',
        'app_password': ''           # NEW: SMTP App Password
    })

def save_settings(settings):
    save_data('settings.json', settings)
    
# Expenses
def load_expenses():
    return load_data('expenses.json', [])

def save_expenses(expenses):
    save_data('expenses.json', expenses)

# Admin (Configuration for setup/login)
def load_admin_config():
    return load_data('admin_config.json', {'setup_required': True, 'hashed_password': None})

def save_admin_config(config):
    save_data('admin_config.json', config)

# Payment Accounts (Used by payments_bp)
def load_payment_accounts(service):
    return load_data(f'email_accounts_{service}.json', [])

def save_payment_accounts(service, accounts):
    save_data(f'email_accounts_{service}.json', accounts)

def add_account(service, account_data):
    accounts = load_payment_accounts(service)
    new_id = max([acc.get('id', 0) for acc in accounts], default=0) + 1
    new_account = {
        "id": new_id,
        "email": account_data['email'],
        "password": account_data['password'],
        "imap_server": account_data['imap_server'],
        "port": int(account_data['port']),
        "enabled": True,
        "last_scanned": None
    }
    accounts.append(new_account)
    save_payment_accounts(service, accounts)
    return new_account