from flask import Flask, jsonify
from flask_cors import CORS

# 1. Create the App
app = Flask(__name__)
CORS(app)

# 2. Import Blueprints INSIDE the block to prevent circular errors
# (This is a common safety pattern in Flask)
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

@app.route('/')
def home():
    return jsonify({
        "status": "running", 
        "message": "Plex User Tracking API is Online"
    })

if __name__ == '__main__':
    # Run on all interfaces (0.0.0.0) so Docker exposes it
    app.run(host='0.0.0.0', port=5000, debug=True)