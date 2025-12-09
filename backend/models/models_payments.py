# backend/models/models_payments.py
# simple helpers to read/write CSVs used by routes
import csv, os, uuid, json

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

def path_for(name):
    return os.path.join(DATA_DIR, name)

def read_csv(path):
    if not os.path.exists(path):
        return []
    with open(path, newline="", encoding="utf-8") as f:
        import csv
        return list(csv.DictReader(f))

def write_csv(path, rows, fieldnames=None):
    if not rows and fieldnames is None:
        open(path, "w").close()
        return
    if fieldnames is None:
        fieldnames = list(rows[0].keys())
    with open(path, "w", newline="", encoding="utf-8") as f:
        import csv
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)
