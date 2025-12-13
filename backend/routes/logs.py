from flask import Blueprint, jsonify
from database import load_payment_logs

logs_bp = Blueprint('logs', __name__, url_prefix='/api/payment_logs')

@logs_bp.route('', methods=['GET'])
def get_logs():
    return jsonify(load_payment_logs())