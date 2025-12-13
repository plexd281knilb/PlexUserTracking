import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

# 1. Setup paths to the frontend build folder
# This assumes your Dockerfile copies 'frontend/build' to a folder named 'frontend/build' or 'build'
# Adjust '../frontend/build' if your structure is different. 
# Standard structure: /app/backend (code) and /app/frontend/build (static)
FRONTEND_FOLDER = os.path.join(os.getcwd(), '..', 'frontend', 'build')

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

# 4. Serve React App (The Magic Part)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        # Return index.html for any other path (React Router handles the rest)
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    # Run on 0.0.0.0 so Docker exposes it
    app.run(host='0.0.0.0', port=5000, debug=True)