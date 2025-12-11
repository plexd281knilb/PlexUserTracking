import os
import re

def create_file(path, content):
    """Creates a file with the given content, overwriting if it exists."""
    # Fix: Check if there is a directory path before trying to create it
    dirname = os.path.dirname(path)
    if dirname:
        os.makedirs(dirname, exist_ok=True)
        
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip())
    print(f"✅ Created/Updated: {path}")

def fix_imports_in_routes():
    """Renames models.py to database.py and updates imports in routes."""
    backend_dir = os.path.join(os.getcwd(), 'backend')
    models_file = os.path.join(backend_dir, 'models.py')
    database_file = os.path.join(backend_dir, 'database.py')
    routes_dir = os.path.join(backend_dir, 'routes')

    # 1. Rename models.py -> database.py
    if os.path.exists(models_file):
        if os.path.exists(database_file):
            try:
                os.remove(models_file)
                print(f"⚠️  {models_file} removed (merged into existing database.py)")
            except Exception as e:
                print(f"❌ Error removing models.py: {e}")
        else:
            try:
                os.rename(models_file, database_file)
                print(f"🔄 Renamed: models.py -> database.py")
            except Exception as e:
                print(f"❌ Error renaming models.py: {e}")
    elif os.path.exists(database_file):
        print(f"ℹ️  database.py already exists. Skipping rename.")
    else:
        print(f"⚠️  Could not find backend/models.py to rename. Please check manually.")

    # 2. Update imports in all files in backend/routes/
    if os.path.exists(routes_dir):
        for filename in os.listdir(routes_dir):
            if filename.endswith(".py"):
                file_path = os.path.join(routes_dir, filename)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Replace 'from models import' with 'from database import'
                    new_content = re.sub(r'from\s+(\w*\.?)(models)\s+import', r'from \1database import', content)
                    
                    if content != new_content:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"🔧 Fixed imports in: backend/routes/{filename}")
                except Exception as e:
                    print(f"❌ Error processing {filename}: {e}")

# --- FILE CONTENTS ---

DOCKERFILE_CONTENT = """
# STAGE 1: Build the React Frontend
FROM node:20-alpine as frontend-build
WORKDIR /app/frontend

# Copy frontend dependency files
COPY frontend/package.json frontend/package-lock.json ./
# Install dependencies
RUN npm install

# Copy the rest of the frontend source code
COPY frontend/ ./
# Build the React application
RUN npm run build

# STAGE 2: Set up the Flask Backend
FROM python:3.11-slim
WORKDIR /app

# Copy backend requirements and install them
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend source code
COPY backend/ .

# Copy the built React frontend from Stage 1 into a 'static_build' folder in the backend
COPY --from=frontend-build /app/frontend/build ./static_build

# Expose the port Flask runs on
EXPOSE 5052

# Run the application
CMD ["python", "app.py"]
"""

GITHUB_WORKFLOW_CONTENT = """
name: Build and Push Docker Image

on:
  push:
    branches: [ "main", "master" ]
    paths:
      - 'backend/**'
      - 'frontend/**'
      - 'Dockerfile'
      - '.github/workflows/docker-build.yml'
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile
          push: true
          # Using the lowercase naming convention
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/plexusertracking:latest
"""

BACKEND_APP_CONTENT = """
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
"""

FRONTEND_API_JS_CONTENT = """
// Base URL for backend API
// Since backend and frontend are on the same origin in the single container, we use relative path.
export const API_BASE_URL = `/api`;
"""

def main():
    print("🚀 Starting PlexUserTracking Fix Script...")
    
    # 1. Create the Unified Dockerfile
    create_file("Dockerfile", DOCKERFILE_CONTENT)
    
    # 2. Create the GitHub Action
    create_file(".github/workflows/docker-build.yml", GITHUB_WORKFLOW_CONTENT)
    
    # 3. Fix Backend App Entry Point
    if os.path.exists("backend/app.py"):
        print("⚠️  Updating backend/app.py (ensure you check Blueprint registrations manually afterwards)")
    create_file("backend/app.py", BACKEND_APP_CONTENT)

    # 4. Fix Frontend API URL
    create_file("frontend/src/api.js", FRONTEND_API_JS_CONTENT)
    
    # 5. Fix Import Errors (rename models.py -> database.py)
    fix_imports_in_routes()

    print("\n✅ All operations complete!")
    print("👉 Next Steps:")
    print("   1. Verify 'backend/app.py' imports your routes correctly.")
    print("   2. Push these changes to GitHub.")
    print("   3. Check Unraid to pull the new 'plexd281knilb/plexusertracking:latest'.")

if __name__ == "__main__":
    main()