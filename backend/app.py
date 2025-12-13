import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

# 1. ROBUST PATH FINDING
# We look for the 'build' folder in common Docker locations
# Standard: /app/frontend/build (if backend is in /app/backend)
# Fallback: /frontend/build
current_dir = os.getcwd()
possible_paths = [
    os.path.join(current_dir, '..', 'frontend', 'build'), # ../frontend/build
    os.path.join(current_dir, 'frontend', 'build'),       # ./frontend/build
    '/app/frontend/build',                                # Absolute Docker path
    '/frontend/build'                                     # Root fallback
]

FRONTEND_FOLDER = None
for path in possible_paths:
    if os.path.exists(path):
        FRONTEND_FOLDER = path
        break

# If we still can't find it, default to current dir so it doesn't crash, 
# but the UI won't load until build is fixed.
if not FRONTEND_FOLDER:
    print("WARNING: Could not find React build folder. UI will not load.")
    FRONTEND_FOLDER = current_dir

app = Flask(__name__, static_folder=FRONTEND_FOLDER, static_url_path='/')
CORS(app)

# 2. Import Blueprints
from routes.users import users_bp
from routes.settings import settings_bp
from routes.dashboard import dashboard_bp
from routes.payments import payments_bp
from routes.logs import logs_bp
from routes.expenses import expenses_bp

# 3. Register Blueprints
app.register_blueprint(users_bp)
app.register_blueprint(settings_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(payments_bp)
app.register_blueprint(logs_bp)
app.register_blueprint(expenses_bp)

# 4. Serve React App
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)