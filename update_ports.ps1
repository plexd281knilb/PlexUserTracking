# update_ports.ps1
# PowerShell script to update PlexUserTracking ports and config for Unraid Docker

# --- Configurable Variables ---
$backendPort = 5052
$frontendPort = 8082
$hostIP = "192.168.1.87"  # Change this to your server IP if needed

# --- Paths ---
$dockerComposePath = ".\docker-compose.yml"
$nginxConfPath = ".\frontend\nginx.conf"
$apiFilePath = ".\frontend\src\api.js"
$menuFilePath = ".\frontend\src\components\Menu.js"

# --- Update docker-compose.yml ---
if (Test-Path $dockerComposePath) {
    $composeContent = Get-Content $dockerComposePath

    # Update frontend port
    $composeContent = $composeContent -replace '(?<=- ")\d+:80"', "${frontendPort}:80`""
    # Update backend port
    $composeContent = $composeContent -replace '(?<=- ")\d+:5000"', "${backendPort}:5052`""
    # Use bridge network
    $composeContent = $composeContent -replace '(?<=networks:\s+)\w+', "bridge"

    Set-Content -Path $dockerComposePath -Value $composeContent
    Write-Host "docker-compose.yml updated."
} else {
    Write-Host "docker-compose.yml not found!"
}

# --- Update frontend nginx.conf ---
$nginxConfContent = @"
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
        proxy_pass http://${hostIP}:${backendPort}/;
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

if (Test-Path $nginxConfPath) {
    Set-Content -Path $nginxConfPath -Value $nginxConfContent
    Write-Host "frontend/nginx.conf updated."
} else {
    Write-Host "frontend/nginx.conf not found!"
}

# --- Update frontend API calls ---
if (Test-Path $apiFilePath) {
    $apiContent = Get-Content $apiFilePath
    $apiContent = $apiContent -replace "http://.*?:\d+/api", "http://${hostIP}:${backendPort}/api"
    Set-Content -Path $apiFilePath -Value $apiContent
    Write-Host "frontend/src/api.js updated with new backend URL."
} else {
    Write-Host "frontend/src/api.js not found!"
}

# --- Update menu highlight logic ---
if (Test-Path $menuFilePath) {
    $menuContent = Get-Content $menuFilePath

    # Ensure menu highlights active page
    $menuContent = $menuContent -replace 'className="menu-item"', 'className={`menu-item ${window.location.pathname.includes(to) ? "active" : ""}`}'
    
    Set-Content -Path $menuFilePath -Value $menuContent
    Write-Host "frontend/src/components/Menu.js updated for active page highlighting."
} else {
    Write-Host "frontend/src/components/Menu.js not found!"
}

Write-Host "All updates complete! Please rebuild your Docker containers on the Unraid server."
