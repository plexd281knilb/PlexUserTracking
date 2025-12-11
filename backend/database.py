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
            return []
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

# --- User Functions (Minimal) ---

def load_users():
    return load_data('users.json', [])

def save_users(users):
    save_data('users.json', users)

# --- Payment Account Functions ---

def load_payment_accounts(service):
    """Loads a list of email accounts for a given service (venmo, zelle, paypal)."""
    return load_data(f'email_accounts_{service}.json', [])

def save_payment_accounts(service, accounts):
    """Saves the list of email accounts for a given service."""
    save_data(f'email_accounts_{service}.json', accounts)

def get_account_by_id(service, account_id):
    """Retrieves a single account by ID."""
    accounts = load_payment_accounts(service)
    return next((acc for acc in accounts if acc['id'] == account_id), None)

def add_account(service, account_data):
    """Adds a new account and assigns an ID."""
    accounts = load_payment_accounts(service)
    new_id = max([acc['id'] for acc in accounts], default=0) + 1
    new_account = {
        "id": new_id,
        "email": account_data['email'],
        "password": account_data['password'], # WARNING: Use proper secrets management in production!
        "imap_server": account_data['imap_server'],
        "port": account_data['port'],
        "enabled": True,
        "last_scanned": None
    }
    accounts.append(new_account)
    save_payment_accounts(service, accounts)
    return new_account