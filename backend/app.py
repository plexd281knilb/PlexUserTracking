import os
import atexit
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
# Import the new automation function
from automation import check_automation

# 1. PATH SETUP
current_dir = os.getcwd()
possible_paths = [
    os.path.join(current_dir, '..', 'frontend', 'build'),
    os.path.join(current_dir, 'frontend', 'build'),
    '/app/frontend/build',
    '/frontend/build'
]

FRONTEND_FOLDER = current_dir
for path in possible_paths:
    if os.path.exists(path):
        FRONTEND_FOLDER = path
        break

app = Flask(__name__, static_folder=FRONTEND_FOLDER, static_url_path='/')
CORS(app)

# 2. SETUP SCHEDULER
# This runs the check_automation function every day at 9:00 AM server time
scheduler = BackgroundScheduler()
scheduler.add_job(func=check_automation, trigger="cron", hour=9)
scheduler.start()
atexit.register(lambda: scheduler.shutdown())

# 3. REGISTER BLUEPRINTS
from routes.users import users_bp
from routes.settings import settings_bp
from routes.dashboard import dashboard_bp
from routes.payments import payments_bp
from routes.logs import logs_bp
from routes.expenses import expenses_bp

app.register_blueprint(users_bp)
app.register_blueprint(settings_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(payments_bp)
app.register_blueprint(logs_bp)
app.register_blueprint(expenses_bp)

# 4. SERVE FRONTEND
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)