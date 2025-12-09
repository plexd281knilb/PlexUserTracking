# backend/models/models_settings.py
import json, os
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
def read_settings(name, default={}):
    p = os.path.join(DATA_DIR, name + ".json")
    if not os.path.exists(p):
        return default
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)
def write_settings(name, data):
    p = os.path.join(DATA_DIR, name + ".json")
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
