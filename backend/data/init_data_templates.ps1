# Create default CSV/JSON templates for PlexUserTracking backend

Write-Host "Initializing backend data templates..." -ForegroundColor Cyan

# Ensure script runs inside backend/data
$current = Get-Location
Write-Host "Running in: $current" -ForegroundColor Yellow

# Create files if they don't exist
function New-IfMissing($path, $content) {
    if (!(Test-Path $path)) {
        Write-Host "Creating $path ..." -ForegroundColor Green
        $content | Out-File -Encoding UTF8 $path
    } else {
        Write-Host "Skipping $path (already exists)" -ForegroundColor DarkYellow
    }
}

# Users JSON
New-IfMissing "users.json" @"
[]
"@

# Email accounts JSON
New-IfMissing "email_accounts.json" @"
[]
"@

# Payments CSV
New-IfMissing "payments.csv" @"
id,payer,payment_type,amount,date,notes
"@

# Expenses CSV
New-IfMissing "expenses.csv" @"
id,date,description,amount,category
"@

# Settings JSON
New-IfMissing "settings.json" @"
{
    ""dark_mode"": false,
    ""scan_interval"": 60,
    ""grace_days"": 7,
    ""port"": 5000,
    ""tautulli"": {
        ""url"": "",
        ""api_key"": ""
    },
    ""email_notifications"": {
        ""enabled"": false,
        ""smtp_server"": "",
        ""smtp_port"": 587,
        ""username"": "",
        ""password"": ""
    }
}
"@

Write-Host "Templates initialized successfully!" -ForegroundColor Cyan
