from flask import Flask, jsonify
from flask_cors import CORS
from routes.users import users_bp
from routes.settings import settings_bp
from routes.dashboard import dashboard_bp
from routes.payments import payments_bp
from routes.logs import logs_bp              # <--- NEW IMPORT

app = Flask(__name__)
CORS(app)

# Register Blueprints
app.register_blueprint(users_bp)
app.register_blueprint(settings_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(payments_bp)
app.register_blueprint(logs_bp)              # <--- NEW REGISTRATION

@app.route('/')
def home():
    return jsonify({"status": "running", "message": "Plex User Tracking API"})

if __name__ == '__main__':
    # Use 0.0.0.0 to make it available outside the container
    app.run(host='0.0.0.0', port=5000, debug=True)