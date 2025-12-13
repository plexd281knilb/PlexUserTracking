# backend/database.py
import json
import os

# ... (Existing load/save functions) ...

# --- Multi-Server Management ---
def load_servers():
    return load_data('servers.json', {'plex': [], 'tautulli': []})

def save_servers(data):
    save_data('servers.json', data)

def add_server(type, server_data):
    data = load_servers()
    # Assign a unique ID
    new_id = 1
    if data[type]:
        new_id = max(s['id'] for s in data[type]) + 1
    
    server_data['id'] = new_id
    data[type].append(server_data)
    save_servers(data)
    return server_data

def delete_server(type, server_id):
    data = load_servers()
    data[type] = [s for s in data[type] if s['id'] != server_id]
    save_servers(data)

# --- Payment Logs (To show found payments on frontend) ---
def load_payment_logs():
    return load_data('payment_logs.json', [])

def save_payment_log(log_entry):
    logs = load_payment_logs()
    # Avoid duplicates based on raw_text + date
    if not any(l['raw_text'] == log_entry['raw_text'] and l['date'] == log_entry['date'] for l in logs):
        logs.insert(0, log_entry) # Add to top
        save_data('payment_logs.json', logs[:500]) # Keep last 500