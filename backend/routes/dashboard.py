# backend/routes/dashboard.py
from flask import Blueprint, jsonify
import os
bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

@bp.route("/summary", methods=["GET"])
def summary():
  import csv,json
  users = 0
  ufile = os.path.join(DATA_DIR, "users.csv")
  if os.path.exists(ufile):
    with open(ufile,newline="",encoding="utf-8") as f:
      users = len(list(csv.DictReader(f)))
  payments = 0; income = 0.0
  for name in ["payments_venmo.csv","payments_zelle.csv","payments_paypal.csv"]:
    path = os.path.join(DATA_DIR, name)
    if os.path.exists(path):
      with open(path,newline="",encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
        payments += len(rows)
        for r in rows:
          try: income += float(r.get("amount","0"))
          except: pass
  expenses = 0; total_expenses = 0.0
  expf = os.path.join(DATA_DIR, "expenses.csv")
  if os.path.exists(expf):
    with open(expf,newline="",encoding="utf-8") as f:
      rows = list(csv.DictReader(f)); expenses = len(rows)
      for r in rows:
        try: total_expenses += float(r.get("amount","0"))
        except: pass
  return jsonify({"total_users":users,"total_payments":payments,"income":income,"total_expenses":total_expenses})
