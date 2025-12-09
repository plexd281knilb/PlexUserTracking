# backend/routes/admin.py
from flask import Blueprint, request, jsonify, abort
import os, json, uuid
from werkzeug.security import generate_password_hash, check_password_hash
bp = Blueprint("admin", __name__, url_prefix="/api/admin")
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
ADMIN_FILE = os.path.join(DATA_DIR, "admin.json")
SETTINGS_GENERAL = os.path.join(DATA_DIR, "settings_general.json")

def admin_exists():
  return os.path.exists(ADMIN_FILE)

@bp.route("/setup-required", methods=["GET"])
def setup_required():
  return jsonify({"required": not admin_exists()})

@bp.route("/setup", methods=["POST"])
def setup():
  if admin_exists():
    return jsonify({"error":"exists"}),400
  data = request.json or {}
  if not data.get("username") or not data.get("password"):
    return jsonify({"error":"username/password required"}),400
  with open(ADMIN_FILE,"w",encoding="utf-8") as f:
    json.dump({"username": data["username"], "password_hash": generate_password_hash(data["password"])}, f)
  return jsonify({"ok":True})

@bp.route("/login", methods=["POST"])
def login():
  if not admin_exists(): return jsonify({"error":"no admin"}),400
  data = request.json or {}
  with open(ADMIN_FILE,"r",encoding="utf-8") as f:
    adm = json.load(f)
  if adm.get("username")!=data.get("username") or not check_password_hash(adm.get("password_hash",""), data.get("password","")):
    return jsonify({"error":"invalid"}),401
  token = str(uuid.uuid4())
  g = {}
  if os.path.exists(SETTINGS_GENERAL):
    with open(SETTINGS_GENERAL,"r",encoding="utf-8") as f: g = json.load(f)
  g["admin_token"]=token
  with open(SETTINGS_GENERAL,"w",encoding="utf-8") as f: json.dump(g,f,indent=2)
  return jsonify({"token": token})
