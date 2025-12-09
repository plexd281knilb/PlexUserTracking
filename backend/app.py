# backend/app.py
import os
import csv
import json
import uuid
import requests
from flask import Flask, request, jsonify, abort
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS

# --- Config / paths ---
DATA_DIR = "/data"
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR, exist_ok=True)

USERS_CSV = os.path.join(DATA_DIR, "users.csv")
EXPENSES_CSV = os.path.join(DATA_DIR, "expenses.csv")
PAYMENTS_CSVS = {
    "venmo": os.path.join(DATA_DIR, "payments_venmo.csv"),
    "zelle": os.path.join(DATA_DIR, "payments_zelle.csv"),
    "paypal": os.path.join(DATA_DIR, "payments_paypal.csv")
}
PAYMENT_EMAILS = {
    "venmo": os.path.join(DATA_DIR, "payments_venmo_emails.csv"),
    "zelle": os.path.join(DATA_DIR, "payments_zelle_emails.csv"),
    "paypal": os.path.join(DATA_DIR, "payments_paypal_emails.csv")
}
EMAIL_ACCOUNTS_CSV = os.path.join(DATA_DIR, "email_accounts.csv")
SETTINGS_FILES = {
    "general": os.path.join(DATA_DIR, "settings_general.json"),
    "appearance": os.path.join(DATA_DIR, "settings_appearance.json"),
    "scanning": os.path.join(DATA_DIR, "settings_scanning.json"),
    "tautulli": os.path.join(DATA_DIR, "settings_tautulli.json"),
    "email": os.path.join(DATA_DIR, "settings_email.json")
}
ADMIN_FILE = os.path.join(DATA_DIR, "admin.json")

# --- Utilities ---
def read_json(path, default):
    if not os.path.exists(path):
        return default
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def write_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def read_csv(path):
    if not os.path.exists(path):
        return []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader)

def write_csv(path, rows, fieldnames=None):
    if not rows and not fieldnames:
        # nothing to write
        open(path, "w").close()
        return
    if fieldnames is None:
        fieldnames = list(rows[0].keys())
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

def append_csv(path, row, fieldnames=None):
    exists = os.path.exists(path)
    if not exists and fieldnames is None:
        fieldnames = list(row.keys())
    with open(path, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if not exists:
            writer.writeheader()
        writer.writerow(row)

def ensure_id(row):
    if "id" not in row or not row.get("id"):
        row["id"] = str(uuid.uuid4())
    return row

def parse_float(v):
    try:
        return float(v)
    except:
        return 0.0

# --- Flask app ---
app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET", "change-me")
CORS(app)

# ----- Admin / Auth -----
def admin_exists():
    return os.path.exists(ADMIN_FILE)

@app.route("/api/admin/setup-required", methods=["GET"])
def api_admin_setup_required():
    return jsonify({"required": not admin_exists()})

@app.route("/api/admin/setup", methods=["POST"])
def api_admin_setup():
    if admin_exists():
        return jsonify({"error": "admin exists"}), 400
    data = request.json or {}
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return jsonify({"error": "username and password required"}), 400
    admin = {
        "username": username,
        "password_hash": generate_password_hash(password)
    }
    write_json(ADMIN_FILE, admin)
    return jsonify({"ok": True})

@app.route("/api/admin/login", methods=["POST"])
def api_admin_login():
    if not admin_exists():
        return jsonify({"error":"no admin"}), 400
    data = request.json or {}
    username = data.get("username")
    password = data.get("password")
    admin = read_json(ADMIN_FILE, {})
    if admin.get("username") != username or not check_password_hash(admin.get("password_hash",""), password):
        return jsonify({"error":"invalid"}), 401
    # simple token (in-memoryless): return a token stored in settings_appearance for client to use in header
    token = str(uuid.uuid4())
    s = read_json(SETTINGS_FILES["general"], {})
    s["admin_token"] = token
    write_json(SETTINGS_FILES["general"], s)
    return jsonify({"token": token})

def require_admin():
    token = request.headers.get("X-Admin-Token") or request.args.get("admin_token")
    if not token:
        abort(401)
    s = read_json(SETTINGS_FILES["general"], {})
    if s.get("admin_token") != token:
        abort(403)

@app.route("/api/admin/change_password", methods=["POST"])
def api_admin_change_password():
    require_admin()
    data = request.json or {}
    newpw = data.get("password")
    if not newpw:
        return jsonify({"error":"password required"}), 400
    admin = read_json(ADMIN_FILE, {})
    admin["password_hash"] = generate_password_hash(newpw)
    write_json(ADMIN_FILE, admin)
    return jsonify({"ok": True})

# ---------------- DASHBOARD SUMMARY ----------------
@app.route("/api/dashboard/summary", methods=["GET"])
def api_dashboard_summary():
    users = read_csv(USERS_CSV)
    email_accounts = read_csv(EMAIL_ACCOUNTS_CSV)
    payments = []
    total_income = 0.0
    for k, ppath in PAYMENTS_CSVS.items():
        rows = read_csv(ppath)
        payments.extend(rows)
        for r in rows:
            total_income += parse_float(r.get("amount",0))
    expenses = read_csv(EXPENSES_CSV)
    total_expenses = sum(parse_float(e.get("amount",0)) for e in expenses)
    # breakdown by service
    breakdown = {}
    for svc in PAYMENTS_CSVS:
        breakdown[svc] = sum(parse_float(r.get("amount",0)) for r in read_csv(PAYMENTS_CSVS[svc]))
    return jsonify({
        "total_users": len(users),
        "total_email_accounts": len(email_accounts),
        "total_payments": len(payments),
        "total_income": total_income,
        "total_expenses": total_expenses,
        "payment_breakdown": breakdown
    })

# ---------------- USERS (CRUD) ----------------
@app.route("/api/users", methods=["GET","POST"])
def api_users():
    if request.method == "GET":
        return jsonify(read_csv(USERS_CSV))
    else:
        data = request.json or {}
        row = ensure_id(data)
        users = read_csv(USERS_CSV)
        users.append(row)
        write_csv(USERS_CSV, users, fieldnames=row.keys())
        return jsonify(row), 201

@app.route("/api/users/<uid>", methods=["PUT","DELETE"])
def api_user_modify(uid):
    users = read_csv(USERS_CSV)
    found = False
    for i,u in enumerate(users):
        if u.get("id") == uid or u.get("username")==uid:
            found = True
            if request.method == "PUT":
                body = request.json or {}
                u.update(body)
                users[i] = u
                write_csv(USERS_CSV, users, fieldnames=users[0].keys())
                return jsonify(u)
            else:
                users.pop(i)
                write_csv(USERS_CSV, users, fieldnames=users[0].keys() if users else ["id"])
                return jsonify({"ok": True})
    if not found:
        return jsonify({"error":"not found"}), 404

# --------------- EXPENSES (CRUD) ----------------
@app.route("/api/expenses", methods=["GET","POST"])
def api_expenses():
    if request.method == "GET":
        return jsonify(read_csv(EXPENSES_CSV))
    data = request.json or {}
    row = ensure_id({
        "id": "",
        "date": data.get("date") or datetime.utcnow().isoformat(),
        "description": data.get("description",""),
        "category": data.get("category",""),
        "amount": str(data.get("amount","0")),
        "notes": data.get("notes","")
    })
    append_csv(EXPENSES_CSV, row, fieldnames=["id","date","description","category","amount","notes"])
    return jsonify(row), 201

@app.route("/api/expenses/<eid>", methods=["PUT","DELETE"])
def api_expense_modify(eid):
    expenses = read_csv(EXPENSES_CSV)
    for i,e in enumerate(expenses):
        if e.get("id") == eid:
            if request.method == "PUT":
                body = request.json or {}
                e.update(body)
                expenses[i] = e
                write_csv(EXPENSES_CSV, expenses, fieldnames=expenses[0].keys())
                return jsonify(e)
            else:
                expenses.pop(i)
                write_csv(EXPENSES_CSV, expenses, fieldnames=expenses[0].keys() if expenses else ["id"])
                return jsonify({"ok": True})
    return jsonify({"error":"not found"}), 404

# ---------------- PAYMENT EMAIL ACCOUNTS (per service) ----------------
@app.route("/api/payment_emails/<ptype>", methods=["GET","POST"])
def api_payment_emails(ptype):
    if ptype not in PAYMENT_EMAILS:
        return jsonify({"error":"invalid type"}), 400
    path = PAYMENT_EMAILS[ptype]
    if request.method == "GET":
        return jsonify(read_csv(path))
    data = request.json or {}
    row = ensure_id({
        "id":"",
        "name": data.get("name",""),
        "address": data.get("address",""),
        "notes": data.get("notes","")
    })
    append_csv(path, row, fieldnames=["id","name","address","notes"])
    return jsonify(row), 201

@app.route("/api/payment_emails/<ptype>/<eid>", methods=["DELETE"])
def api_payment_email_delete(ptype,eid):
    if ptype not in PAYMENT_EMAILS:
        return jsonify({"error":"invalid type"}), 400
    rows = read_csv(PAYMENT_EMAILS[ptype])
    for i,r in enumerate(rows):
        if r.get("id")==eid:
            rows.pop(i)
            write_csv(PAYMENT_EMAILS[ptype], rows, fieldnames=rows[0].keys() if rows else ["id"])
            return jsonify({"ok": True})
    return jsonify({"error":"not found"}), 404

# ---------------- PAYMENTS (CRUD + filters) ----------------
@app.route("/api/payments/<ptype>", methods=["GET","POST"])
def api_payments(ptype):
    if ptype not in PAYMENTS_CSVS:
        return jsonify({"error":"invalid type"}), 400
    path = PAYMENTS_CSVS[ptype]
    if request.method == "GET":
        # support filters: date_from, date_to, min_amt, max_amt
        q = read_csv(path)
        date_from = request.args.get("date_from")
        date_to = request.args.get("date_to")
        min_amt = request.args.get("min_amt")
        max_amt = request.args.get("max_amt")
        def keep(r):
            if date_from and r.get("date","") < date_from: return False
            if date_to and r.get("date","") > date_to: return False
            amt = parse_float(r.get("amount",0))
            if min_amt and amt < parse_float(min_amt): return False
            if max_amt and amt > parse_float(max_amt): return False
            return True
        return jsonify([r for r in q if keep(r)])
    data = request.json or {}
    row = ensure_id({
        "id":"",
        "date": data.get("date") or datetime.utcnow().isoformat(),
        "amount": str(data.get("amount","0")),
        "payer": data.get("payer",""),
        "sender": data.get("sender",""),
        "subject": data.get("subject",""),
        "notes": data.get("notes",""),
        "matched_user_id": data.get("matched_user_id","")
    })
    append_csv(path, row, fieldnames=["id","date","amount","payer","sender","subject","notes","matched_user_id"])
    return jsonify(row), 201

@app.route("/api/payments/<ptype>/<pid>", methods=["PUT","DELETE"])
def api_payment_modify(ptype,pid):
    if ptype not in PAYMENTS_CSVS:
        return jsonify({"error":"invalid type"}), 400
    path = PAYMENTS_CSVS[ptype]
    rows = read_csv(path)
    for i,r in enumerate(rows):
        if r.get("id")==pid:
            if request.method == "PUT":
                r.update(request.json or {})
                rows[i] = r
                write_csv(path, rows, fieldnames=rows[0].keys())
                return jsonify(r)
            else:
                rows.pop(i)
                write_csv(path, rows, fieldnames=rows[0].keys() if rows else ["id"])
                return jsonify({"ok": True})
    return jsonify({"error":"not found"}), 404

# ---------------- EMAIL ACCOUNTS (imap) ----------------
@app.route("/api/email_accounts", methods=["GET","POST"])
def api_email_accounts():
    if request.method == "GET":
        return jsonify(read_csv(EMAIL_ACCOUNTS_CSV))
    data = request.json or {}
    row = ensure_id({
        "id":"",
        "name": data.get("name",""),
        "address": data.get("address",""),
        "imap_server": data.get("imap_server","imap.gmail.com"),
        "folder": data.get("folder","INBOX"),
        "search_term": data.get("search_term","UNSEEN"),
        "type": data.get("type","unknown"),
        "notes": data.get("notes","")
    })
    append_csv(EMAIL_ACCOUNTS_CSV, row, fieldnames=["id","name","address","imap_server","folder","search_term","type","notes"])
    return jsonify(row), 201

# ---------------- SETTINGS (grouped) ----------------
@app.route("/api/settings/<group>", methods=["GET","POST"])
def api_settings_group(group):
    if group not in SETTINGS_FILES:
        return jsonify({"error":"invalid settings group"}), 400
    path = SETTINGS_FILES[group]
    if request.method == "GET":
        return jsonify(read_json(path, {}))
    data = request.json or {}
    write_json(path, data)
    return jsonify({"ok": True})

# ---------------- TAUTULLI SYNC ----------------
@app.route("/api/tautulli/sync_users", methods=["POST"])
def api_tautulli_sync_users():
    require_admin()
    tautulli = read_json(SETTINGS_FILES["tautulli"], {})
    url = tautulli.get("url")
    api_key = tautulli.get("api_key")
    if not url or not api_key:
        return jsonify({"error":"tautulli config missing"}), 400
    # Call Tautulli API to get users
    payload = {
        "apikey": api_key,
        "cmd": "get_users"
    }
    try:
        r = requests.get(url, params=payload, timeout=15)
        j = r.json()
        if not j.get("response") or not j["response"].get("data"):
            return jsonify({"error":"invalid tautulli response"}), 500
        tautulli_users = j["response"]["data"]
        users = read_csv(USERS_CSV)
        usernames = {u.get("plex_username") or u.get("username"): u for u in users}
        added = 0
        for u in tautulli_users:
            name = u.get("username") or u.get("friendly_name") or u.get("email")
            key = name
            if key not in usernames:
                new = {"id": str(uuid.uuid4()), "plex_username": name, "real_name": u.get("friendly_name",""), "emails":"", "venmo":"", "zelle":"", "billing_amount":"0", "billing_frequency":"monthly", "next_due":""}
                users.append(new)
                added += 1
        if users:
            write_csv(USERS_CSV, users, fieldnames=users[0].keys())
        return jsonify({"added": added})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------- RUN SCAN (trigger) ----------------
@app.route("/api/scan/run", methods=["POST"])
def api_run_scan():
    require_admin()
    # Placeholder - your existing payment_scan function can be triggered here
    # e.g., payment_scanner.scan_all()
    return jsonify({"message":"scan started"})

# ---------------- HEALTH CHECK ----------------
@app.route("/api/health", methods=["GET"])
def api_health():
    return jsonify({"ok": True, "time": datetime.utcnow().isoformat()})

# ----------------- Start -----------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
