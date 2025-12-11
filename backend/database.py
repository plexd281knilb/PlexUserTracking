import json
import os
from datetime import datetime

DATA_DIR = os.path.join(os.getcwd(), 'data')
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

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

def load_users():
    return load_data('users.json', [])

def save_users(users):
    save_data('users.json', users)

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