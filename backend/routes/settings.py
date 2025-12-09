# backend/routes/settings.py
from flask import Blueprint, request, jsonify
from ..models.models_settings import read_settings, write_settings
bp = Blueprint("settings", __name__, url_prefix="/api/settings")

@bp.route("/<group>", methods=["GET","POST"])
def group(group):
  if request.method=="GET":
    return jsonify(read_settings(group, {}))
  data = request.json or {}
  write_settings(group, data)
  return jsonify({"ok": True})
