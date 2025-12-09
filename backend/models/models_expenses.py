# backend/models/models_expenses.py
import os, csv, uuid
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
EXPENSES = os.path.join(DATA_DIR, "expenses.csv")

def read_expenses():
    if not os.path.exists(EXPENSES):
        return []
    with open(EXPENSES, newline="", encoding="utf-8") as f:
        import csv
        return list(csv.DictReader(f))

def write_expenses(rows):
    if not rows:
        open(EXPENSES, "w").close(); return
    with open(EXPENSES, "w", newline="", encoding="utf-8") as f:
        import csv
        w = csv.DictWriter(f, fieldnames=rows[0].keys())
        w.writeheader(); w.writerows(rows)
