from flask import Flask, send_from_directory
import os

# Import routes - ensure your __init__.py in routes sets these up correctly
# If you are using blueprints, import and register them here.
# Example: from routes import users_bp, settings_bp... 

def create_app():
    # Initialize Flask pointing to the folder where we copied the React build
    app = Flask(__name__, static_folder='static_build', static_url_path='/')

    # --- REGISTER BLUEPRINTS HERE ---
    # You need to ensure your routes/__init__.py exposes your blueprints
    # or import them directly from the files.
    # from routes.users import users_bp
    # app.register_blueprint(users_bp, url_prefix='/api/users')
    
    # Placeholder for direct route imports if not using Blueprints:
    # (Existing logic from your original app.py should go here)

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