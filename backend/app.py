# backend/app.py - simplified app that registers route blueprints
import os
from flask import Flask, jsonify
from flask_cors import CORS

def create_app():
  app = Flask(__name__, static_folder=None)
  CORS(app)
  # register blueprints
  from .routes import payments, expenses, settings, users, dashboard, admin
  app.register_blueprint(payments.bp)
  app.register_blueprint(expenses.bp)
  app.register_blueprint(settings.bp)
  app.register_blueprint(users.bp)
  app.register_blueprint(dashboard.bp)
  app.register_blueprint(admin.bp)

  @app.route("/api/health")
  def health():
    return jsonify({"ok":True})
  return app

if __name__ == "__main__":
  app = create_app()
  port = int(os.environ.get("PORT", "5000"))
  app.run(host="0.0.0.0", port=port)
