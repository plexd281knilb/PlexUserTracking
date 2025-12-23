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

# --- PATH CONFIGURATION ---
# Get the absolute path to the frontend build directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_BUILD_DIR = os.path.join(os.path.dirname(BASE_DIR), 'frontend', 'build')

app = Flask(__name__, static_folder=FRONTEND_BUILD_DIR, static_url_path='/')
CORS(app)

# --- SCHEDULER (Automation) ---
if not app.debug or os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
    try:
        scheduler = BackgroundScheduler()
        scheduler.add_job(func=check_automation, trigger="cron", hour=9)
        scheduler.start()
        atexit.register(lambda: scheduler.shutdown())
    except Exception as e:
        print(f"Scheduler failed: {e}")

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
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    
    # Fallback to index.html for React Router
    if os.path.exists(os.path.join(app.static_folder, 'index.html')):
        return send_from_directory(app.static_folder, 'index.html')
        
    return "Frontend not found. Please run 'npm run build' in the frontend directory.", 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5052, debug=True)