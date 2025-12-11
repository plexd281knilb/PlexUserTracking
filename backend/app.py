from flask import Flask, send_from_directory
import os

# Import Blueprints from the route files
from routes.users import users_bp
from routes.settings import settings_bp
from routes.payments import payments_bp
from routes.expenses import expenses_bp
from routes.dashboard import dashboard_bp
from routes.admin import admin_bp

def create_app():
    # Initialize Flask pointing to the folder where we copied the React build
    app = Flask(__name__, static_folder='static_build', static_url_path='/')

    # --- REGISTER BLUEPRINTS ---
    app.register_blueprint(users_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(payments_bp)
    app.register_blueprint(expenses_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(admin_bp)

    # Serve the React Application
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, 'index.html')

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5052, debug=True)