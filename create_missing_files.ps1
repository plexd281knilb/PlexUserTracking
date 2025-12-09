# create_missing_files.ps1
# Run from repo root (C:\Users\Dom\Documents\GitHub\PlexUserTracking)
# This script WILL overwrite files. Back up first if needed.

param(
  [switch]$Force = $true
)

$root = Get-Location
Write-Host "Running from $root"

function Ensure-Dir {
  param($p)
  if (-not (Test-Path $p)) {
    New-Item -ItemType Directory -Path $p -Force | Out-Null
    Write-Host "Created dir: $p"
  } else {
    Write-Host "Dir exists: $p"
  }
}

function Write-File {
  param($path, $content)
  $dir = Split-Path $path
  Ensure-Dir $dir
  $content | Out-File -FilePath $path -Encoding UTF8 -Force
  Write-Host "Wrote $path"
}

# --- FRONTEND FILES ---
$frontendSrc = Join-Path $root "frontend\src"

# create payments folder and files
Ensure-Dir (Join-Path $frontendSrc "pages\payments")

$venmo = @'
import React from "react";
import PaymentsBase from "../Payments"; // reuse Payments.jsx UI if present
export default function Venmo(){
  return <div><h2>Venmo Payments</h2><PaymentsBase service="venmo" /></div>;
}
'@
Write-File (Join-Path $frontendSrc "pages\payments\Venmo.jsx") $venmo

$zelle = @'
import React from "react";
import PaymentsBase from "../Payments";
export default function Zelle(){
  return <div><h2>Zelle Payments</h2><PaymentsBase service="zelle" /></div>;
}
'@
Write-File (Join-Path $frontendSrc "pages\payments\Zelle.jsx") $zelle

$paypal = @'
import React from "react";
import PaymentsBase from "../Payments";
export default function Paypal(){
  return <div><h2>PayPal Payments</h2><PaymentsBase service="paypal" /></div>;
}
'@
Write-File (Join-Path $frontendSrc "pages\payments\Paypal.jsx") $paypal

# create settings subpages
Ensure-Dir (Join-Path $frontendSrc "pages\settings")

$tautulli = @'
import React, { useState, useEffect } from "react";
import { apiGet, apiPost } from "../../api";
export default function Tautulli(){
  const [cfg, setCfg] = useState({url:"",api_key:""});
  useEffect(()=>{ apiGet("/api/settings/tautulli").then(r=>setCfg(r)).catch(()=>{}) },[]);
  async function save(){ await apiPost("/api/settings/tautulli", cfg, localStorage.getItem("admin_token")); alert("Saved"); }
  return (
    <div className="card">
      <h3>Tautulli Settings</h3>
      <input className="input" placeholder="Tautulli URL" value={cfg.url} onChange={e=>setCfg({...cfg,url:e.target.value})} /><br/>
      <input className="input" placeholder="API Key" value={cfg.api_key} onChange={e=>setCfg({...cfg,api_key:e.target.value})} /><br/>
      <button className="button" onClick={save}>Save</button>
    </div>
  );
}
'@
Write-File (Join-Path $frontendSrc "pages\settings\Tautulli.jsx") $tautulli

$display = @'
import React, { useState, useEffect } from "react";
import { apiGet, apiPost } from "../../api";
export default function Display(){
  const [cfg, setCfg] = useState({theme:"light"});
  useEffect(()=>{ apiGet("/api/settings/appearance").then(r=>setCfg(r)).catch(()=>{}) },[]);
  async function save(){ await apiPost("/api/settings/appearance", cfg, localStorage.getItem("admin_token")); alert("Saved"); }
  return (
    <div className="card">
      <h3>Appearance</h3>
      <label className="small">Theme</label>
      <select value={cfg.theme} onChange={e=>setCfg({...cfg,theme:e.target.value})} className="input">
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      <br/><button className="button" onClick={save}>Save</button>
    </div>
  );
}
'@
Write-File (Join-Path $frontendSrc "pages\settings\Display.jsx") $display

$notifications = @'
import React, { useState, useEffect } from "react";
import { apiGet, apiPost } from "../../api";
export default function Notifications(){
  const [cfg,setCfg]=useState({enabled:false, smtp_server:"", from_email:""});
  useEffect(()=>{ apiGet("/api/settings/email").then(r=>setCfg(r)).catch(()=>{}) },[]);
  async function save(){ await apiPost("/api/settings/email", cfg, localStorage.getItem("admin_token")); alert("Saved"); }
  return (
    <div className="card">
      <h3>Email Reminders</h3>
      <label className="small">Enabled</label>
      <input type="checkbox" checked={cfg.enabled} onChange={e=>setCfg({...cfg,enabled:e.target.checked})} />
      <br/>
      <input className="input" placeholder="SMTP server" value={cfg.smtp_server} onChange={e=>setCfg({...cfg,smtp_server:e.target.value})} />
      <input className="input" placeholder="From email" value={cfg.from_email} onChange={e=>setCfg({...cfg,from_email:e.target.value})} />
      <br/><button className="button" onClick={save}>Save</button>
    </div>
  );
}
'@
Write-File (Join-Path $frontendSrc "pages\settings\Notifications.jsx") $notifications

$scan = @'
import React, { useState, useEffect } from "react";
import { apiGet, apiPost } from "../../api";
export default function ScanSettings(){
  const [cfg,setCfg]=useState({scan_interval_min:60});
  useEffect(()=>{ apiGet("/api/settings/scanning").then(r=>setCfg(r)).catch(()=>{}) },[]);
  async function save(){ await apiPost("/api/settings/scanning", cfg, localStorage.getItem("admin_token")); alert("Saved"); }
  return (
    <div className="card">
      <h3>Scanning</h3>
      <label className="small">Interval (min)</label>
      <input className="input" type="number" value={cfg.scan_interval_min} onChange={e=>setCfg({...cfg,scan_interval_min:parseInt(e.target.value||0)})} />
      <br/><button className="button" onClick={save}>Save</button>
    </div>
  );
}
'@
Write-File (Join-Path $frontendSrc "pages\settings\Scan.jsx") $scan

$system = @'
import React, { useState, useEffect } from "react";
import { apiGet, apiPost } from "../../api";
export default function System(){
  const [cfg,setCfg]=useState({web_port:5050});
  useEffect(()=>{ apiGet("/api/settings/general").then(r=>setCfg(r)).catch(()=>{}) },[]);
  async function save(){ await apiPost("/api/settings/general", cfg, localStorage.getItem("admin_token")); alert("Saved"); }
  return (
    <div className="card">
      <h3>System</h3>
      <label className="small">Web port</label>
      <input className="input" type="number" value={cfg.web_port} onChange={e=>setCfg({...cfg,web_port:parseInt(e.target.value||0)})} />
      <br/><button className="button" onClick={save}>Save</button>
    </div>
  );
}
'@
Write-File (Join-Path $frontendSrc "pages\settings\System.jsx") $system

# admin pages
Ensure-Dir (Join-Path $frontendSrc "pages\admin")
$adminSetup = @'
import React, { useState } from "react";
import { apiPost } from "../../api";
export default function AdminSetup(){
  const [form,setForm]=useState({username:"",password:""});
  async function doSetup(){
    await apiPost("/api/admin/setup", form);
    alert("Admin created. Please login.");
  }
  return (
    <div className="card">
      <h3>Admin Setup</h3>
      <input className="input" placeholder="username" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} />
      <input className="input" type="password" placeholder="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
      <button className="button" onClick={doSetup}>Create Admin</button>
    </div>
  );
}
'@
Write-File (Join-Path $frontendSrc "pages\admin\AdminSetup.jsx") $adminSetup

$adminLogin = @'
import React, { useState } from "react";
import { apiPost } from "../../api";
import { useNavigate } from "react-router-dom";
export default function AdminLogin(){
  const [form,setForm]=useState({username:"",password:""});
  const nav = useNavigate();
  async function login(){
    const r = await apiPost("/api/admin/login", form);
    if (r.token) {
      localStorage.setItem("admin_token", r.token);
      nav("/dashboard");
    } else {
      alert("Login failed");
    }
  }
  return (
    <div className="card">
      <h3>Admin Login</h3>
      <input className="input" placeholder="username" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} />
      <input className="input" type="password" placeholder="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
      <button className="button" onClick={login}>Login</button>
    </div>
  );
}
'@
Write-File (Join-Path $frontendSrc "pages\admin\AdminLogin.jsx") $adminLogin

# expense modals/components
Ensure-Dir (Join-Path $frontendSrc "components")
$editExpense = @'
import React from "react";
export default function EditExpenseModal({expense, onSave}) {
  if (!expense) return null;
  const save = () => {
    const updated = {...expense};
    const amt = parseFloat(document.getElementById("edit-amt").value||"0");
    updated.amount = amt.toString();
    updated.description = document.getElementById("edit-desc").value;
    updated.category = document.getElementById("edit-cat").value;
    onSave(updated);
  };
  return (
    <div className="card">
      <h4>Edit Expense</h4>
      <input id="edit-desc" defaultValue={expense.description} className="input" />
      <input id="edit-cat" defaultValue={expense.category} className="input" />
      <input id="edit-amt" defaultValue={expense.amount} className="input" />
      <button className="button" onClick={save}>Save</button>
    </div>
  );
}
'@
Write-File (Join-Path $frontendSrc "components\EditExpenseModal.jsx") $editExpense

$addExpense = @'
import React from "react";
export default function AddExpenseModal({onAdd}) {
  const add = () => {
    const row = {
      date: document.getElementById("add-date").value,
      description: document.getElementById("add-desc").value,
      category: document.getElementById("add-cat").value,
      amount: document.getElementById("add-amt").value
    };
    onAdd(row);
  };
  return (
    <div className="card">
      <h4>Add Expense</h4>
      <input id="add-date" type="date" className="input" />
      <input id="add-desc" placeholder="desc" className="input" />
      <input id="add-cat" placeholder="category" className="input" />
      <input id="add-amt" placeholder="amount" className="input" />
      <button className="button" onClick={add}>Add</button>
    </div>
  );
}
'@
Write-File (Join-Path $frontendSrc "components\AddExpenseModal.jsx") $addExpense

# update App.jsx to include new routes
$appPath = Join-Path $frontendSrc "App.jsx"
$appContent = @'
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Expenses from "./pages/Expenses";
import Payments from "./pages/Payments";
import SettingsIndex from "./pages/settings/SettingsIndex";
import Venmo from "./pages/payments/Venmo";
import Zelle from "./pages/payments/Zelle";
import Paypal from "./pages/payments/Paypal";
import Tautulli from "./pages/settings/Tautulli";
import Display from "./pages/settings/Display";
import Notifications from "./pages/settings/Notifications";
import ScanSettings from "./pages/settings/Scan";
import System from "./pages/settings/System";
import AdminSetup from "./pages/admin/AdminSetup";
import AdminLogin from "./pages/admin/AdminLogin";
import Login from "./pages/Login";

export default function App(){
  return (
    <BrowserRouter>
      <div className="app-root">
        <Sidebar />
        <div className="main">
          <Topbar />
          <div className="content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/admin/setup" element={<AdminSetup />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/payments/venmo" element={<Venmo />} />
              <Route path="/payments/zelle" element={<Zelle />} />
              <Route path="/payments/paypal" element={<Paypal />} />
              <Route path="/settings" element={<SettingsIndex />} />
              <Route path="/settings/tautulli" element={<Tautulli />} />
              <Route path="/settings/display" element={<Display />} />
              <Route path="/settings/notifications" element={<Notifications />} />
              <Route path="/settings/scan" element={<ScanSettings />} />
              <Route path="/settings/system" element={<System />} />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}
'@
Write-File $appPath $appContent

# update Sidebar.jsx to include new links (overwrite)
$sidebarPath = Join-Path $frontendSrc "components\Sidebar.jsx"
$sidebarContent = @'
import React from "react";
import { Link } from "react-router-dom";
export default function Sidebar(){
  return (
    <div className="sidebar">
      <h3>PlexUserTracking</h3>
      <div className="nav">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/users">Users</Link>
        <Link to="/payments/venmo">Venmo</Link>
        <Link to="/payments/zelle">Zelle</Link>
        <Link to="/payments/paypal">PayPal</Link>
        <Link to="/expenses">Expenses</Link>
        <Link to="/settings">Settings</Link>
        <Link to="/admin/setup">Admin Setup</Link>
        <Link to="/admin/login">Admin Login</Link>
      </div>
    </div>
  );
}
'@
Write-File $sidebarPath $sidebarContent

# ensure Payments.jsx (base UI) exists to be reused
$paymentsBase = @'
import React from "react";
import { useNavigate } from "react-router-dom";
export default function PaymentsBase({service}) {
  // fallback UI if service provided as prop, else instruct user to pick one
  return (
    <div>
      <h3>{service ? service.toUpperCase() + " Payments" : "Payments"}</h3>
      <p>Use the dedicated page: /payments/venmo, /payments/zelle, /payments/paypal</p>
    </div>
  );
}
'@
Write-File (Join-Path $frontendSrc "pages\Payments.jsx") $paymentsBase

# --- BACKEND FILES ---
$backend = Join-Path $root "backend"
Ensure-Dir $backend
Ensure-Dir (Join-Path $backend "routes")
Ensure-Dir (Join-Path $backend "models")
Ensure-Dir (Join-Path $backend "data")

# backend models (simple helpers)
$modelsPayments = @'
# backend/models/models_payments.py
# simple helpers to read/write CSVs used by routes
import csv, os, uuid, json

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

def path_for(name):
    return os.path.join(DATA_DIR, name)

def read_csv(path):
    if not os.path.exists(path):
        return []
    with open(path, newline="", encoding="utf-8") as f:
        import csv
        return list(csv.DictReader(f))

def write_csv(path, rows, fieldnames=None):
    if not rows and fieldnames is None:
        open(path, "w").close()
        return
    if fieldnames is None:
        fieldnames = list(rows[0].keys())
    with open(path, "w", newline="", encoding="utf-8") as f:
        import csv
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)
'@
Write-File (Join-Path $backend "models\models_payments.py") $modelsPayments

$modelsExpenses = @'
# backend/models/models_expenses.py
import os, csv, uuid
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
EXPENSES = os.path.join(DATA_DIR, "expenses.csv")

def read_expenses():
    if not os.path.exists(EXPENSES):
        return []
    with open(EXPENSES, newline="", encoding="utf-8") as f:
        import csv
        return list(csv.DictReader(f))

def write_expenses(rows):
    if not rows:
        open(EXPENSES, "w").close(); return
    with open(EXPENSES, "w", newline="", encoding="utf-8") as f:
        import csv
        w = csv.DictWriter(f, fieldnames=rows[0].keys())
        w.writeheader(); w.writerows(rows)
'@
Write-File (Join-Path $backend "models\models_expenses.py") $modelsExpenses

$modelsSettings = @'
# backend/models/models_settings.py
import json, os
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
def read_settings(name, default={}):
    p = os.path.join(DATA_DIR, name + ".json")
    if not os.path.exists(p):
        return default
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)
def write_settings(name, data):
    p = os.path.join(DATA_DIR, name + ".json")
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
'@
Write-File (Join-Path $backend "models\models_settings.py") $modelsSettings

# backend routes - payments
$routesPayments = @'
# backend/routes/payments.py
from flask import Blueprint, request, jsonify
import os, uuid
from ..models.models_payments import read_csv, write_csv, path_for
from ..models.models_settings import read_settings
bp = Blueprint("payments", __name__, url_prefix="/api/payments")

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
FILES = {
  "venmo": os.path.join(DATA_DIR, "payments_venmo.csv"),
  "zelle": os.path.join(DATA_DIR, "payments_zelle.csv"),
  "paypal": os.path.join(DATA_DIR, "payments_paypal.csv")
}

def ensure(row):
  if not row.get("id"):
    row["id"] = str(uuid.uuid4())
  return row

@bp.route("/<ptype>", methods=["GET","POST"])
def payments_list(ptype):
  if ptype not in FILES:
    return jsonify({"error":"invalid type"}), 400
  path = FILES[ptype]
  if request.method=="GET":
    return jsonify(read_csv(path))
  data = request.json or {}
  row = ensure({
    "id":"",
    "date": data.get("date",""),
    "amount": str(data.get("amount","0")),
    "payer": data.get("payer",""),
    "notes": data.get("notes","")
  })
  # append
  rows = read_csv(path)
  rows.append(row)
  write_csv(path, rows, fieldnames=row.keys())
  return jsonify(row), 201

@bp.route("/<ptype>/<pid>", methods=["PUT","DELETE"])
def payments_modify(ptype,pid):
  if ptype not in FILES: return jsonify({"error":"invalid type"}),400
  path = FILES[ptype]
  rows = read_csv(path)
  for i,r in enumerate(rows):
    if r.get("id")==pid:
      if request.method=="PUT":
        r.update(request.json or {})
        rows[i]=r
        write_csv(path, rows, fieldnames=rows[0].keys())
        return jsonify(r)
      else:
        rows.pop(i); write_csv(path, rows, fieldnames=rows[0].keys() if rows else ["id"])
        return jsonify({"ok":True})
  return jsonify({"error":"not found"}),404
'@
Write-File (Join-Path $backend "routes\payments.py") $routesPayments

# backend routes - expenses
$routesExpenses = @'
# backend/routes/expenses.py
from flask import Blueprint, request, jsonify
import uuid, os
from ..models.models_expenses import read_expenses, write_expenses
bp = Blueprint("expenses", __name__, url_prefix="/api/expenses")

@bp.route("", methods=["GET","POST"])
def expenses():
  if request.method=="GET":
    return jsonify(read_expenses())
  data = request.json or {}
  rows = read_expenses()
  new = {"id": str(uuid.uuid4()), "date": data.get("date",""), "description": data.get("description",""), "category": data.get("category",""), "amount": str(data.get("amount","0")), "notes": data.get("notes","")}
  rows.append(new)
  write_expenses(rows)
  return jsonify(new), 201

@bp.route("/<eid>", methods=["PUT","DELETE"])
def expense_modify(eid):
  rows = read_expenses()
  for i,r in enumerate(rows):
    if r.get("id")==eid:
      if request.method=="PUT":
        r.update(request.json or {})
        rows[i]=r; write_expenses(rows)
        return jsonify(r)
      else:
        rows.pop(i); write_expenses(rows)
        return jsonify({"ok":True})
  return jsonify({"error":"not found"}),404
'@
Write-File (Join-Path $backend "routes\expenses.py") $routesExpenses

# backend routes - settings
$routesSettings = @'
# backend/routes/settings.py
from flask import Blueprint, request, jsonify
from ..models.models_settings import read_settings, write_settings
bp = Blueprint("settings", __name__, url_prefix="/api/settings")

@bp.route("/<group>", methods=["GET","POST"])
def group(group):
  if request.method=="GET":
    return jsonify(read_settings(group, {}))
  data = request.json or {}
  write_settings(group, data)
  return jsonify({"ok": True})
'@
Write-File (Join-Path $backend "routes\settings.py") $routesSettings

# backend routes - users
$routesUsers = @'
# backend/routes/users.py
from flask import Blueprint, request, jsonify
import os, uuid, csv
bp = Blueprint("users", __name__, url_prefix="/api/users")
DATA = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "users.csv")

def read_csv(path):
  if not os.path.exists(path): return []
  with open(path, newline="", encoding="utf-8") as f:
    import csv
    return list(csv.DictReader(f))

def write_csv(path, rows, fieldnames=None):
  if not rows and fieldnames is None: open(path,"w").close(); return
  if fieldnames is None: fieldnames = list(rows[0].keys())
  with open(path, "w", newline="", encoding="utf-8") as f:
    import csv
    w = csv.DictWriter(f, fieldnames=fieldnames); w.writeheader(); w.writerows(rows)

@bp.route("", methods=["GET","POST"])
def users_list():
  if request.method=="GET":
    return jsonify(read_csv(DATA))
  data = request.json or {}
  if not os.path.exists(DATA):
    write_csv(DATA, [data], fieldnames=list(data.keys()))
    return jsonify(data),201
  rows = read_csv(DATA)
  if not data.get("id"): data["id"]=str(uuid.uuid4())
  rows.append(data)
  write_csv(DATA, rows, fieldnames=rows[0].keys())
  return jsonify(data),201

@bp.route("/<uid>", methods=["PUT","DELETE"])
def users_modify(uid):
  rows = read_csv(DATA)
  for i,r in enumerate(rows):
    if r.get("id")==uid or r.get("username")==uid:
      if request.method=="PUT":
        r.update(request.json or {})
        rows[i]=r; write_csv(DATA, rows, fieldnames=rows[0].keys()); return jsonify(r)
      else:
        rows.pop(i); write_csv(DATA, rows, fieldnames=rows[0].keys() if rows else ["id"]); return jsonify({"ok":True})
  return jsonify({"error":"not found"}),404
'@
Write-File (Join-Path $backend "routes\users.py") $routesUsers

# backend routes - dashboard (summary)
$routesDashboard = @'
# backend/routes/dashboard.py
from flask import Blueprint, jsonify
import os
bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

@bp.route("/summary", methods=["GET"])
def summary():
  import csv,json
  users = 0
  ufile = os.path.join(DATA_DIR, "users.csv")
  if os.path.exists(ufile):
    with open(ufile,newline="",encoding="utf-8") as f:
      users = len(list(csv.DictReader(f)))
  payments = 0; income = 0.0
  for name in ["payments_venmo.csv","payments_zelle.csv","payments_paypal.csv"]:
    path = os.path.join(DATA_DIR, name)
    if os.path.exists(path):
      with open(path,newline="",encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
        payments += len(rows)
        for r in rows:
          try: income += float(r.get("amount","0"))
          except: pass
  expenses = 0; total_expenses = 0.0
  expf = os.path.join(DATA_DIR, "expenses.csv")
  if os.path.exists(expf):
    with open(expf,newline="",encoding="utf-8") as f:
      rows = list(csv.DictReader(f)); expenses = len(rows)
      for r in rows:
        try: total_expenses += float(r.get("amount","0"))
        except: pass
  return jsonify({"total_users":users,"total_payments":payments,"income":income,"total_expenses":total_expenses})
'@
Write-File (Join-Path $backend "routes\dashboard.py") $routesDashboard

# backend admin route (basic)
$routesAdmin = @'
# backend/routes/admin.py
from flask import Blueprint, request, jsonify, abort
import os, json, uuid
from werkzeug.security import generate_password_hash, check_password_hash
bp = Blueprint("admin", __name__, url_prefix="/api/admin")
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
ADMIN_FILE = os.path.join(DATA_DIR, "admin.json")
SETTINGS_GENERAL = os.path.join(DATA_DIR, "settings_general.json")

def admin_exists():
  return os.path.exists(ADMIN_FILE)

@bp.route("/setup-required", methods=["GET"])
def setup_required():
  return jsonify({"required": not admin_exists()})

@bp.route("/setup", methods=["POST"])
def setup():
  if admin_exists():
    return jsonify({"error":"exists"}),400
  data = request.json or {}
  if not data.get("username") or not data.get("password"):
    return jsonify({"error":"username/password required"}),400
  with open(ADMIN_FILE,"w",encoding="utf-8") as f:
    json.dump({"username": data["username"], "password_hash": generate_password_hash(data["password"])}, f)
  return jsonify({"ok":True})

@bp.route("/login", methods=["POST"])
def login():
  if not admin_exists(): return jsonify({"error":"no admin"}),400
  data = request.json or {}
  with open(ADMIN_FILE,"r",encoding="utf-8") as f:
    adm = json.load(f)
  if adm.get("username")!=data.get("username") or not check_password_hash(adm.get("password_hash",""), data.get("password","")):
    return jsonify({"error":"invalid"}),401
  token = str(uuid.uuid4())
  g = {}
  if os.path.exists(SETTINGS_GENERAL):
    with open(SETTINGS_GENERAL,"r",encoding="utf-8") as f: g = json.load(f)
  g["admin_token"]=token
  with open(SETTINGS_GENERAL,"w",encoding="utf-8") as f: json.dump(g,f,indent=2)
  return jsonify({"token": token})
'@
Write-File (Join-Path $backend "routes\admin.py") $routesAdmin

# write new app.py that registers blueprints
$appNew = @'
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
'@
Write-File (Join-Path $backend "app.py") $appNew

# Create the three new data files (JSON) if missing or overwrite if forced
$emailVenmo = '[]'
$emailZelle = '[]'
$emailPaypal = '[]'
Write-File (Join-Path $backend "data\email_accounts_venmo.json") $emailVenmo
Write-File (Join-Path $backend "data\email_accounts_zelle.json") $emailZelle
Write-File (Join-Path $backend "data\email_accounts_paypal.json") $emailPaypal

Write-Host "All files created/overwritten. Next steps:" -ForegroundColor Green
Write-Host "1) In the frontend, run 'npm install' in the frontend folder to ensure package-lock.json and node_modules are present." -ForegroundColor Yellow
Write-Host "2) Commit & push changes to GitHub, then on Unraid run: git pull && docker compose up -d --build" -ForegroundColor Yellow
Write-Host "If you want, I can also generate a small Unraid update script to pull & rebuild automatically." -ForegroundColor Cyan
