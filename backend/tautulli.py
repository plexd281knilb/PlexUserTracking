import requests

def get_tautulli_users(tautulli_url, api_key):
    params = {'apikey': api_key, 'cmd': 'get_users'}
    r = requests.get(tautulli_url.rstrip('/') + '/api/v2', params=params, timeout=10)
    r.raise_for_status()
    data = r.json()
    return data.get('response', {}).get('data', [])

def disable_user(tautulli_url, api_key, user_id):
    params = {'apikey': api_key, 'cmd': 'delete_user', 'user_id': user_id}
    r = requests.get(tautulli_url.rstrip('/') + '/api/v2', params=params, timeout=10)
    return r
