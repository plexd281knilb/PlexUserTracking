# backend/routes/expenses.py
from flask import Blueprint, request, jsonify
import uuid, os
from ..models.models_expenses import read_expenses, write_expenses
bp = Blueprint("expenses", __name__, url_prefix="/api/expenses")

@bp.route("", methods=["GET","POST"])
def expenses():
  if request.method=="GET":
    return jsonify(read_expenses())
  data = request.json or {}
  rows = read_expenses()
  new = {"id": str(uuid.uuid4()), "date": data.get("date",""), "description": data.get("description",""), "category": data.get("category",""), "amount": str(data.get("amount","0")), "notes": data.get("notes","")}
  rows.append(new)
  write_expenses(rows)
  return jsonify(new), 201

@bp.route("/<eid>", methods=["PUT","DELETE"])
def expense_modify(eid):
  rows = read_expenses()
  for i,r in enumerate(rows):
    if r.get("id")==eid:
      if request.method=="PUT":
        r.update(request.json or {})
        rows[i]=r; write_expenses(rows)
        return jsonify(r)
      else:
        rows.pop(i); write_expenses(rows)
        return jsonify({"ok":True})
  return jsonify({"error":"not found"}),404
