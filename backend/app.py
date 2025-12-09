import os
import csv
import json
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
app.secret_key = os.environ.get("ADMIN_SECRET", "supersecret")
CORS(app)

# -------------------------------------------------------------------
# File paths
# -------------------------------------------------------------------
DATA_DIR = "data"
USERS_CSV = os.path.join(DATA_DIR, "users.csv")
EXPENSES_CSV = os.path.join(DATA_DIR, "expenses.csv")
PAYMENTS_CSV = {
    "venmo": os.path.join(DATA_DIR, "venmo_payments.csv"),
    "zelle": os.path.join(DATA_DIR, "zelle_payments.csv"),
    "paypal": os.path.join(DATA_DIR, "paypal_payments.csv")
}
EMAIL_ACCOUNTS_CSV = os.path.join(DATA_DIR, "email_accounts.csv")
SETTINGS_JSON = os.path.join(DATA_DIR, "settings.json")
ADMIN_JSON = os.path.join(DATA_DIR, "admin.json")

os.makedirs(DATA_DIR, exist_ok=True)

# -------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------
def read_csv(path):
    if not os.path.exists(path):
        return []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader)

def write_csv(path, rows, fieldnames):
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

def load_json(path, default):
    if not os.path.exists(path):
        return default
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

# -------------------------------------------------------------------
# ADMIN & AUTH
# -------------------------------------------------------------------
@app.route("/api/admin/setup", methods=["POST"])
def admin_setup():
    """Create the admin user if not already set."""
    admin = load_json(ADMIN_JSON, {})
    if admin.get("username"):
        return jsonify({"error": "Admin already configured"}), 400

    data = request.json
    required = ["username", "password"]
    if not all(k in data for k in required):
        return jsonify({"error": "Missing admin fields"}), 400

    save_json(ADMIN_JSON, {"username": data["username"], "password": data["password"]})
    return jsonify({"message": "Admin configured"})

@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    creds = request.json
    admin = load_json(ADMIN_JSON, {})
    if creds["username"] == admin.get("username") and creds["password"] == admin.get("password"):
        session["logged_in"] = True
        return jsonify({"message": "Login successful"})
    return jsonify({"error": "Invalid credentials"}), 401

@app.route("/api/admin/logout", methods=["POST"])
def admin_logout():
    session.clear()
    return jsonify({"message": "Logged out"})

# -------------------------------------------------------------------
# HOMEPAGE — Statistics & Run Scans
# -------------------------------------------------------------------
@app.route("/api/home/stats", methods=["GET"])
def homepage_stats():
    users = read_csv(USERS_CSV)
    expenses = read_csv(EXPENSES_CSV)
    email_accounts = read_csv(EMAIL_ACCOUNTS_CSV)

    year = str(datetime.now().year)

    # Sum expenses by year
    total_expenses_year = sum(float(e["amount"]) for e in expenses if e["date"].startswith(year))

    # Payments merged from all sources
    total_payments_year = 0
    for ptype, path in PAYMENTS_CSV.items():
        payments = read_csv(path)
        total_payments_year += sum(float(p["amount"]) for p in payments if p["date"].startswith(year))

    return jsonify({
        "total_users": len(users),
        "total_email_accounts": len(email_accounts),
        "total_payments_year": total_payments_year,
        "total_expenses_year": total_expenses_year
    })

@app.route("/api/home/run_scan", methods=["POST"])
def run_scan_now():
    # placeholder for your real scanning logic
    return jsonify({"message": "Scans executed"})

# -------------------------------------------------------------------
# USERS
# -------------------------------------------------------------------
@app.route("/api/users", methods=["GET"])
def get_users():
    return jsonify(read_csv(USERS_CSV))

@app.route("/api/users", methods=["POST"])
def add_user():
    users = read_csv(USERS_CSV)
    data = request.json
    users.append(data)

    write_csv(USERS_CSV, users, fieldnames=data.keys())
    return jsonify({"message": "User added"})

@app.route("/api/users/<username>", methods=["PUT"])
def update_user(username):
    users = read_csv(USERS_CSV)
    updated = request.json
    for u in users:
        if u["username"] == username:
            u.update(updated)
            break
    write_csv(USERS_CSV, users, fieldnames=users[0].keys())
    return jsonify({"message": "User updated"})

# -------------------------------------------------------------------
# EXPENSES
# -------------------------------------------------------------------
@app.route("/api/expenses", methods=["GET"])
def get_expenses():
    return jsonify(read_csv(EXPENSES_CSV))

@app.route("/api/expenses", methods=["POST"])
def add_expense():
    expenses = read_csv(EXPENSES_CSV)
    data = request.json
    expenses.append(data)
    write_csv(EXPENSES_CSV, expenses, fieldnames=data.keys())
    return jsonify({"message": "Expense added"})

# -------------------------------------------------------------------
# PAYMENTS - VENMO, ZELLE, PAYPAL
# -------------------------------------------------------------------
@app.route("/api/payments/<ptype>", methods=["GET"])
def get_payments(ptype):
    if ptype not in PAYMENTS_CSV:
        return jsonify({"error": "Invalid payment type"}), 400
    return jsonify(read_csv(PAYMENTS_CSV[ptype]))

@app.route("/api/payments/<ptype>", methods=["POST"])
def add_payment(ptype):
    if ptype not in PAYMENTS_CSV:
        return jsonify({"error": "Invalid payment type"}), 400

    payments = read_csv(PAYMENTS_CSV[ptype])
    data = request.json
    payments.append(data)

    write_csv(PAYMENTS_CSV[ptype], payments, fieldnames=data.keys())
    return jsonify({"message": f"{ptype.capitalize()} payment added"})

# -------------------------------------------------------------------
# EMAIL ACCOUNTS (tracking Venmo/Zelle/PayPal inboxes)
# -------------------------------------------------------------------
@app.route("/api/email_accounts", methods=["GET"])
def get_email_accounts():
    return jsonify(read_csv(EMAIL_ACCOUNTS_CSV))

@app.route("/api/email_accounts", methods=["POST"])
def add_email_account():
    accounts = read_csv(EMAIL_ACCOUNTS_CSV)
    data = request.json
    accounts.append(data)
    write_csv(EMAIL_ACCOUNTS_CSV, accounts, fieldnames=data.keys())
    return jsonify({"message": "Email account added"})

# -------------------------------------------------------------------
# SETTINGS
# -------------------------------------------------------------------
@app.route("/api/settings", methods=["GET"])
def get_settings():
    settings = load_json(SETTINGS_JSON, {
        "theme": "light",
        "web_port": 5050,
        "scan_interval": 60,
        "grace_days": 0,
        "auto_scans": True,
        "tautulli_url": "",
        "tautulli_api_key": ""
    })
    return jsonify(settings)

@app.route("/api/settings", methods=["POST"])
def save_settings():
    data = request.json
    save_json(SETTINGS_JSON, data)
    return jsonify({"message": "Settings saved"})

# -------------------------------------------------------------------
# START APP
# -------------------------------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
