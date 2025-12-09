# File: init_plexusertracking.ps1
# Usage: Run in your PlexUserTracking root folder
# This will create/overwrite all backend/frontend/Nginx files

$ErrorActionPreference = "Stop"

# --- Folders ---
$folders = @(
    "backend/routes",
    "frontend/public",
    "frontend/src",
    "frontend/src/components",
    "frontend/src/pages",
    "nginx"
)

foreach ($folder in $folders) {
    if (!(Test-Path $folder)) {
        New-Item -Path $folder -ItemType Directory -Force | Out-Null
    }
}

# --- Backend files ---
$backendFiles = @{
    "backend/app.py" = @"
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
"@

    "backend/routes/__init__.py" = ""

    "backend/routes/dashboard.py" = @"
from flask import Blueprint, jsonify

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('/summary', methods=['GET'])
def summary():
    return jsonify({
        'total_users': 0,
        'total_emails': 0,
        'total_payments': 0,
        'total_income_year': 0,
        'total_expenses_year': 0
    })
"@

    "backend/routes/users.py" = @"
from flask import Blueprint, jsonify

users_bp = Blueprint('users', __name__, url_prefix='/api/users')

@users_bp.route('', methods=['GET'])
def get_users():
    return jsonify([])

@users_bp.route('/<user_id>', methods=['PUT'])
def update_user(user_id):
    return jsonify({'status': 'ok'})
"@

    "backend/routes/payments.py" = @"
from flask import Blueprint, jsonify

payments_bp = Blueprint('payments', __name__, url_prefix='/api/payment_emails')

@payments_bp.route('/venmo', methods=['GET'])
def venmo():
    return jsonify([])

@payments_bp.route('/zelle', methods=['GET'])
def zelle():
    return jsonify([])

@payments_bp.route('/paypal', methods=['GET'])
def paypal():
    return jsonify([])
"@

    "backend/routes/expenses.py" = @"
from flask import Blueprint, jsonify

expenses_bp = Blueprint('expenses', __name__, url_prefix='/api/expenses')

@expenses_bp.route('', methods=['GET'])
def get_expenses():
    return jsonify([])

@expenses_bp.route('', methods=['POST'])
def add_expense():
    return jsonify({'status': 'ok'})
"@

    "backend/routes/settings.py" = @"
from flask import Blueprint, jsonify

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')

@settings_bp.route('', methods=['GET'])
def get_settings():
    return jsonify({'dark_mode': False})

@settings_bp.route('', methods=['PUT'])
def update_settings():
    return jsonify({'status': 'ok'})
"@

    "backend/routes/admin.py" = @"
from flask import Blueprint, jsonify

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/setup-required', methods=['GET'])
def setup_required():
    return jsonify({'setup_required': True})

@admin_bp.route('/setup', methods=['POST'])
def setup_admin():
    return jsonify({'status': 'ok'})

@admin_bp.route('/login', methods=['POST'])
def admin_login():
    return jsonify({'status': 'ok'})
"@
}

foreach ($file in $backendFiles.Keys) {
    $backendFiles[$file] | Out-File -FilePath $file -Encoding UTF8 -Force
}

# --- Frontend files ---
$frontendFiles = @{
    "frontend/src/api.js" = @"
import axios from 'axios';

export default axios.create({
  baseURL: '/api',
});
"@

    "frontend/src/App.jsx" = @"
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import PaymentsVenmo from './pages/PaymentsVenmo';
import PaymentsZelle from './pages/PaymentsZelle';
import PaymentsPaypal from './pages/PaymentsPaypal';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';
import AdminSetup from './pages/AdminSetup';
import AdminLogin from './pages/AdminLogin';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/users' element={<Users />} />
        <Route path='/payments/venmo' element={<PaymentsVenmo />} />
        <Route path='/payments/zelle' element={<PaymentsZelle />} />
        <Route path='/payments/paypal' element={<PaymentsPaypal />} />
        <Route path='/expenses' element={<Expenses />} />
        <Route path='/settings' element={<Settings />} />
        <Route path='/admin/setup' element={<AdminSetup />} />
        <Route path='/admin/login' element={<AdminLogin />} />
      </Routes>
    </Router>
  );
}

export default App;
"@

    "frontend/src/pages/Dashboard.jsx" = @"
import React, { useEffect, useState } from 'react';
import api from '../api';

const Dashboard = () => {
  const [summary, setSummary] = useState({});

  useEffect(() => {
    api.get('/dashboard/summary').then(res => setSummary(res.data));
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <pre>{JSON.stringify(summary, null, 2)}</pre>
    </div>
  );
};

export default Dashboard;
"@

    "frontend/src/pages/Users.jsx" = "import React from 'react'; const Users = () => <div><h1>Users Page</h1></div>; export default Users;"
    "frontend/src/pages/PaymentsVenmo.jsx" = "import React from 'react'; const PaymentsVenmo = () => <div><h1>Venmo Payments</h1></div>; export default PaymentsVenmo;"
    "frontend/src/pages/PaymentsZelle.jsx" = "import React from 'react'; const PaymentsZelle = () => <div><h1>Zelle Payments</h1></div>; export default PaymentsZelle;"
    "frontend/src/pages/PaymentsPaypal.jsx" = "import React from 'react'; const PaymentsPaypal = () => <div><h1>PayPal Payments</h1></div>; export default PaymentsPaypal;"
    "frontend/src/pages/Expenses.jsx" = "import React from 'react'; const Expenses = () => <div><h1>Expenses Page</h1></div>; export default Expenses;"
    "frontend/src/pages/Settings.jsx" = "import React from 'react'; const Settings = () => <div><h1>Settings Page</h1></div>; export default Settings;"
    "frontend/src/pages/AdminSetup.jsx" = "import React from 'react'; const AdminSetup = () => <div><h1>Admin Setup</h1></div>; export default AdminSetup;"
    "frontend/src/pages/AdminLogin.jsx" = "import React from 'react'; const AdminLogin = () => <div><h1>Admin Login</h1></div>; export default AdminLogin;"
}

foreach ($file in $frontendFiles.Keys) {
    $frontendFiles[$file] | Out-File -FilePath $file -Encoding UTF8 -Force
}

# --- Nginx ---
$nginxConf = @"
upstream backend {
    server plexusertracking-backend:5000;
}

server {
    listen 80;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files \$uri /index.html;
    }

    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
"@

$nginxConf | Out-File -FilePath "nginx/default.conf" -Encoding UTF8 -Force

Write-Host "All files and folders created/overwritten successfully!"
