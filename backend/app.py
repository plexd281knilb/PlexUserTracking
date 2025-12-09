from flask import Flask
from routes.dashboard import dashboard_bp
from routes.users import users_bp
from routes.payments import payments_bp
from routes.expenses import expenses_bp
from routes.settings import settings_bp
from routes.admin import admin_bp

def create_app():
    app = Flask(__name__)

    app.register_blueprint(dashboard_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(payments_bp)
    app.register_blueprint(expenses_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(admin_bp)

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host='0.0.0.0', port=5000)
