# Navigate to frontend folder
$frontendPath = ".\frontend"
Set-Location $frontendPath

# Check if package.json exists
if (-Not (Test-Path "package.json")) {
    Write-Error "package.json not found in frontend folder! Cannot continue."
    exit 1
}

# Check if package-lock.json exists, generate if missing
if (-Not (Test-Path "package-lock.json")) {
    Write-Host "package-lock.json not found. Generating..."
    npm install --package-lock-only
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to generate package-lock.json"
        exit 1
    }
    Write-Host "package-lock.json created successfully."
} else {
    Write-Host "package-lock.json already exists."
}

# Return to repo root
Set-Location ..

# Build Docker containers
Write-Host "Building Docker containers..."
docker compose build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker build failed."
    exit 1
}

# Bring up containers
Write-Host "Starting Docker containers..."
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to start Docker containers."
    exit 1
}

Write-Host "Build and startup complete!"
