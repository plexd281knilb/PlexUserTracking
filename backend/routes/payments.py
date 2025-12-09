# backend/routes/payments.py
from flask import Blueprint, request, jsonify
import os, uuid
from ..models.models_payments import read_csv, write_csv, path_for
from ..models.models_settings import read_settings
bp = Blueprint("payments", __name__, url_prefix="/api/payments")

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
FILES = {
  "venmo": os.path.join(DATA_DIR, "payments_venmo.csv"),
  "zelle": os.path.join(DATA_DIR, "payments_zelle.csv"),
  "paypal": os.path.join(DATA_DIR, "payments_paypal.csv")
}

def ensure(row):
  if not row.get("id"):
    row["id"] = str(uuid.uuid4())
  return row

@bp.route("/<ptype>", methods=["GET","POST"])
def payments_list(ptype):
  if ptype not in FILES:
    return jsonify({"error":"invalid type"}), 400
  path = FILES[ptype]
  if request.method=="GET":
    return jsonify(read_csv(path))
  data = request.json or {}
  row = ensure({
    "id":"",
    "date": data.get("date",""),
    "amount": str(data.get("amount","0")),
    "payer": data.get("payer",""),
    "notes": data.get("notes","")
  })
  # append
  rows = read_csv(path)
  rows.append(row)
  write_csv(path, rows, fieldnames=row.keys())
  return jsonify(row), 201

@bp.route("/<ptype>/<pid>", methods=["PUT","DELETE"])
def payments_modify(ptype,pid):
  if ptype not in FILES: return jsonify({"error":"invalid type"}),400
  path = FILES[ptype]
  rows = read_csv(path)
  for i,r in enumerate(rows):
    if r.get("id")==pid:
      if request.method=="PUT":
        r.update(request.json or {})
        rows[i]=r
        write_csv(path, rows, fieldnames=rows[0].keys())
        return jsonify(r)
      else:
        rows.pop(i); write_csv(path, rows, fieldnames=rows[0].keys() if rows else ["id"])
        return jsonify({"ok":True})
  return jsonify({"error":"not found"}),404
