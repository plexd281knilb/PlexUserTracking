# update_ports_fixed.ps1
# Ensures directories exist, then updates files with backend:5052, frontend:8082

Write-Host "Updating PlexUserTracking project ports..."

# ---- Ensure directories exist ----
$dirs = @(".\backend", ".\frontend")
foreach ($d in $dirs) {
    if (-not (Test-Path $d)) {
        New-Item -ItemType Directory -Path $d | Out-Null
        Write-Host "Created missing directory: $d"
    }
}

# ---- 1️⃣ Backend app.py ----
$backendApp = @"
from flask import Flask

def create_app():
    app = Flask(__name__)
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5052, debug=True)
"@
Set-Content -Path ".\backend\app.py" -Value $backendApp -Force
Write-Host "Updated backend/app.py to port 5052"

# ---- 2️⃣ Backend Dockerfile ----
$backendDockerfile = @"
FROM python:3.11-slim

WORKDIR /app
COPY . /app

RUN apt-get update && apt-get install -y --no-install-recommends cron && rm -rf /var/lib/apt/lists/*
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

EXPOSE 5052

CMD [\"python\", \"app.py\"]
"@
Set-Content -Path ".\backend\Dockerfile" -Value $backendDockerfile -Force
Write-Host "Updated backend/Dockerfile to expose 5052"

# ---- 3️⃣ Frontend Nginx config ----
$nginxConf = @"
server {
    listen 80;

    root /usr/share/nginx/html;
    index index.html index.htm;

    # Serve React app
    location / {
        try_files \$uri /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://plexusertracking-backend:5052/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
"@
Set-Content -Path ".\frontend\nginx.conf" -Value $nginxConf -Force
Write-Host "Updated frontend/nginx.conf to proxy backend:5052"

# ---- 4️⃣ Docker Compose ----
$dockerCompose = @"
version: '3.9'

services:
  backend:
    build: ./backend
    container_name: plexusertracking-backend
    ports:
      - "5052:5052"
    networks:
      - bridge

  frontend:
    build: ./frontend
    container_name: plexusertracking-frontend
    ports:
      - "8082:80"
    networks:
      - bridge

networks:
  bridge:
    external: true
"@
Set-Content -Path ".\docker-compose.yml" -Value $dockerCompose -Force
Write-Host "Updated docker-compose.yml with backend:5052 and frontend:8082 using bridge network"

Write-Host "All files updated successfully."
