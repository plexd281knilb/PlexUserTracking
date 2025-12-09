# backend/routes/users.py
from flask import Blueprint, request, jsonify
import os, uuid, csv
bp = Blueprint("users", __name__, url_prefix="/api/users")
DATA = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "users.csv")

def read_csv(path):
  if not os.path.exists(path): return []
  with open(path, newline="", encoding="utf-8") as f:
    import csv
    return list(csv.DictReader(f))

def write_csv(path, rows, fieldnames=None):
  if not rows and fieldnames is None: open(path,"w").close(); return
  if fieldnames is None: fieldnames = list(rows[0].keys())
  with open(path, "w", newline="", encoding="utf-8") as f:
    import csv
    w = csv.DictWriter(f, fieldnames=fieldnames); w.writeheader(); w.writerows(rows)

@bp.route("", methods=["GET","POST"])
def users_list():
  if request.method=="GET":
    return jsonify(read_csv(DATA))
  data = request.json or {}
  if not os.path.exists(DATA):
    write_csv(DATA, [data], fieldnames=list(data.keys()))
    return jsonify(data),201
  rows = read_csv(DATA)
  if not data.get("id"): data["id"]=str(uuid.uuid4())
  rows.append(data)
  write_csv(DATA, rows, fieldnames=rows[0].keys())
  return jsonify(data),201

@bp.route("/<uid>", methods=["PUT","DELETE"])
def users_modify(uid):
  rows = read_csv(DATA)
  for i,r in enumerate(rows):
    if r.get("id")==uid or r.get("username")==uid:
      if request.method=="PUT":
        r.update(request.json or {})
        rows[i]=r; write_csv(DATA, rows, fieldnames=rows[0].keys()); return jsonify(r)
      else:
        rows.pop(i); write_csv(DATA, rows, fieldnames=rows[0].keys() if rows else ["id"]); return jsonify({"ok":True})
  return jsonify({"error":"not found"}),404
