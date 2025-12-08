import csv
import os

FIELDNAMES = ["service", "amount", "payer", "subject", "sender", "date", "body"]

def ensure_csv_exists(path):
    d = os.path.dirname(path)
    if d and not os.path.isdir(d):
        os.makedirs(d, exist_ok=True)
    if not os.path.isfile(path):
        with open(path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
            writer.writeheader()

def append_rows(path, rows):
    """
    Append rows but dedupe by (service, subject, sender, date).
    Returns number of appended rows.
    """
    ensure_csv_exists(path)
    existing_keys = set()
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            key = (r.get("service",""), r.get("subject",""), r.get("sender",""), r.get("date",""))
            existing_keys.add(key)

    appended = 0
    with open(path, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        for r in rows:
            key = (r.get("service",""), r.get("subject",""), r.get("sender",""), r.get("date",""))
            if key not in existing_keys:
                writer.writerow({
                    "service": r.get("service",""),
                    "amount": r.get("amount",""),
                    "payer": r.get("payer",""),
                    "subject": r.get("subject",""),
                    "sender": r.get("sender",""),
                    "date": r.get("date",""),
                    "body": r.get("body","")
                })
                existing_keys.add(key)
                appended += 1
    return appended
