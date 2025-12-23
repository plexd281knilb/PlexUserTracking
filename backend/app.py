import os
import atexit
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
from automation import check_automation

# Import Blueprints
from routes.users import users_bp
from routes.payments import payments_bp
from routes.dashboard import dashboard_bp
from routes.settings import settings_bp
from routes.upcoming import upcoming_bp
from routes.expenses import expenses_bp

app = Flask(__name__, static_folder='../frontend/build', static_url_path='/')
CORS(app)

# --- SCHEDULER (Automation) ---
# Runs check_automation() every day at 9:00 AM
if not app.debug or os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
    scheduler = BackgroundScheduler()
    scheduler.add_job(func=check_automation, trigger="cron", hour=9)
    scheduler.start()
    atexit.register(lambda: scheduler.shutdown())

# --- REGISTER BLUEPRINTS ---
app.register_blueprint(users_bp)
app.register_blueprint(payments_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(settings_bp)
app.register_blueprint(upcoming_bp)
app.register_blueprint(expenses_bp)

# --- SERVE REACT APP ---
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5052, debug=True)