import requests
import xml.etree.ElementTree as ET
from database import load_settings, load_users, save_users

def fetch_plex_users():
    settings = load_settings()
    token = settings.get('plex_token')
    
    if not token:
        raise Exception("Plex Token not found in settings. Please go to Settings > Plex and save your token.")

    # Plex API to fetch users (using the XML endpoint)
    headers = {'X-Plex-Token': token, 'Accept': 'application/json'}
    url = 'https://plex.tv/api/users'
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        raise Exception(f"Failed to connect to Plex API: {str(e)}")

    # Parse XML response
    try:
        root = ET.fromstring(response.content)
    except ET.ParseError:
        raise Exception("Failed to parse Plex response. Invalid XML.")
    
    imported_count = 0
    current_users = load_users()
    
    # Helper to check if user exists
    def user_exists(email):
        return any(u.get('email', '').lower() == email.lower() for u in current_users)

    for user_elem in root.findall('User'):
        email = user_elem.get('email', '').lower()
        username = user_elem.get('username', '')
        user_id = user_elem.get('id', '')
        
        # Only import if they have an email (managed users might not)
        if email:
            if not user_exists(email):
                new_user = {
                    "id": len(current_users) + 1,
                    "name": username,
                    "email": email,
                    "plex_username": username,
                    "plex_id": user_id,
                    "status": "Pending",
                    "due": 0.00,
                    "last_paid": None
                }
                current_users.append(new_user)
                imported_count += 1
            else:
                # Update existing user's Plex data
                for u in current_users:
                    if u.get('email', '').lower() == email:
                        u['plex_username'] = username
                        u['plex_id'] = user_id

    save_users(current_users)
    return imported_count

def fetch_tautulli_users():
    settings = load_settings()
    api_key = settings.get('tautulli_api_key')
    base_url = settings.get('tautulli_url')

    if not api_key or not base_url:
        raise Exception("Tautulli Configuration missing. Go to Settings > Tautulli.")

    # Clean URL and build endpoint
    base_url = base_url.rstrip('/')
    url = f"{base_url}/api/v2?apikey={api_key}&cmd=get_users"

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.RequestException as e:
        raise Exception(f"Failed to connect to Tautulli: {str(e)}")
    except ValueError:
        raise Exception("Invalid JSON received from Tautulli.")

    if data.get('response', {}).get('result') != 'success':
        raise Exception(f"Tautulli API Error: {data.get('response', {}).get('message', 'Unknown error')}")

    imported_count = 0
    current_users = load_users()

    def user_exists(email):
        return any(u.get('email', '').lower() == email.lower() for u in current_users)

    for entry in data['response']['data']:
        email = entry.get('email', '').lower()
        username = entry.get('username', '')
        user_id = str(entry.get('user_id', ''))
        
        if email:
            if not user_exists(email):
                new_user = {
                    "id": len(current_users) + 1,
                    "name": username,
                    "email": email,
                    "plex_username": username,
                    "plex_id": user_id, # Tautulli also has Plex IDs
                    "status": "Pending",
                    "due": 0.00,
                    "last_paid": None
                }
                current_users.append(new_user)
                imported_count += 1
            else:
                # Update existing user
                for u in current_users:
                    if u.get('email', '').lower() == email:
                        if not u.get('plex_username'):
                            u['plex_username'] = username

    save_users(current_users)
    return imported_count