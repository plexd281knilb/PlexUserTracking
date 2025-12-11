from flask import Flask, send_from_directory
import os

def create_app():
    # Initialize Flask pointing to the folder where we copied the React build
    app = Flask(__name__, static_folder='static_build', static_url_path='/')

    # Register your existing blueprints/routes here if you have them
    # e.g., app.register_blueprint(users_bp)
    
    # 1. API Routes should be registered here (usually prefixed with /api)

    # 2. Serve the React Application
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        # Check if the requested file exists in the static folder (e.g. css/js files)
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        
        # Otherwise, serve the index.html for React Router to handle
        return send_from_directory(app.static_folder, 'index.html')

    return app

if __name__ == '__main__':
    app = create_app()
    # Host must be 0.0.0.0 for Docker
    app.run(host='0.0.0.0', port=5052, debug=True)