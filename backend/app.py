import os
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from models import Session, init_db, EmailAccount, User, Payment, Setting
from payment_scanner import scan_once
from tautulli import get_tautulli_users, disable_user
from mailer import mail, send_reminder
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
import dotenv

# Load env
dotenv.load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), 'config.example.env'))

app = Flask(__name__, static_folder=None)
CORS(app)

# Mail config
app.config.update(
    MAIL_SERVER=os.getenv('SMTP_HOST'),
    MAIL_PORT=int(os.getenv('SMTP_PORT', '587')),
    MAIL_USERNAME=os.getenv('SMTP_USER'),
    MAIL_PASSWORD=os.getenv('SMTP_PASSWORD'),
    MAIL_USE_TLS=True,
    MAIL_DEFAULT_SENDER=os.getenv('EMAIL_FROM')
)
mail.init_app(app)

# DB init
init_db()
DB = Session()

# Scheduler
scheduler = BackgroundScheduler()
SCAN_INTERVAL_MIN = int(os.getenv('SCAN_INTERVAL_MIN', '10'))

def scheduled_scan():
    try:
        appended = scan_once()
        print("Scheduled scan appended:", appended)
    except Exception as e:
        print("Scan error", e)

scheduler.add_job(scheduled_scan, 'interval', minutes=SCAN_INTERVAL_MIN, id='scan_job')
scheduler.start()

# --- Email accounts endpoints ---
@app.route('/api/email-accounts', methods=['GET','POST'])
def email_accounts():
    if request.method == 'GET':
        rows = DB.query(EmailAccount).all()
        return jsonify([{
            'id': r.id, 'name': r.name, 'address': r.address, 'imap_server': r.imap_server,
            'imap_port': r.imap_port, 'folder': r.folder, 'search_term': r.search_term,
            'last_checked': r.last_checked.isoformat() if r.last_checked else None
        } for r in rows])
    else:
        data = request.json
        a = EmailAccount(
            name=data.get('name'),
            address=data.get('address'),
            imap_server=data.get('imap_server'),
            imap_port=data.get('imap_port', 993),
            password=data.get('password'),
            folder=data.get('folder','INBOX'),
            search_term=data.get('search_term','UNSEEN')
        )
        DB.add(a); DB.commit()
        return jsonify({'id': a.id}), 201

@app.route('/api/email-accounts/<int:aid>', methods=['PUT','DELETE'])
def email_account_update(aid):
    a = DB.query(EmailAccount).get(aid)
    if not a:
        return jsonify({'error':'not found'}), 404
    if request.method == 'DELETE':
        DB.delete(a); DB.commit(); return jsonify({'status':'deleted'})
    for k,v in request.json.items():
        if hasattr(a,k):
            setattr(a,k,v)
    DB.commit(); return jsonify({'status':'ok'})

# --- Users endpoints ---
@app.route('/api/users', methods=['GET','POST'])
def users_list():
    if request.method == 'GET':
        rows = DB.query(User).all()
        return jsonify([{
            'id':u.id,'plex_username':u.plex_username,'real_name':u.real_name,'emails':u.emails,
            'venmo':u.venmo,'zelle':u.zelle,'billing_amount':u.billing_amount,'billing_frequency':u.billing_frequency,
            'next_due':u.next_due.isoformat() if u.next_due else None,'active':u.active
        } for u in rows])
    else:
        data = request.json
        u = User(
            plex_username=data.get('plex_username'),
            real_name=data.get('real_name',''),
            emails=data.get('emails',''),
            venmo=data.get('venmo',''),
            zelle=data.get('zelle',''),
            billing_amount=float(data.get('billing_amount') or 0),
            billing_frequency=data.get('billing_frequency','monthly'),
            next_due=datetime.fromisoformat(data['next_due']) if data.get('next_due') else None,
            active=bool(data.get('active',True))
        )
        DB.add(u); DB.commit()
        return jsonify({'id':u.id}), 201

@app.route('/api/users/<int:uid>', methods=['PUT','DELETE'])
def user_update(uid):
    u = DB.query(User).get(uid)
    if not u:
        return jsonify({'error':'not found'}),404
    if request.method == 'DELETE':
        DB.delete(u); DB.commit(); return jsonify({'status':'deleted'})
    for k,v in request.json.items():
        if hasattr(u,k):
            if k == 'next_due' and v:
                setattr(u, k, datetime.fromisoformat(v))
            else:
                setattr(u, k, v)
    DB.commit(); return jsonify({'status':'ok'})

# --- Payments endpoints ---
@app.route('/api/payments', methods=['GET'])
def payments():
    q = DB.query(Payment).order_by(Payment.created_at.desc()).limit(500).all()
    return jsonify([{
        'id': p.id, 'service': p.service, 'amount': p.amount, 'payer': p.payer,
        'subject': p.subject, 'sender': p.sender, 'date': p.date, 'matched_user_id': p.matched_user_id
    } for p in q])

@app.route('/api/payments/<int:pid>/match', methods=['POST'])
def match_payment(pid):
    p = DB.query(Payment).get(pid)
    if not p: return jsonify({'error':'not found'}), 404
    uid = request.json.get('user_id')
    p.matched_user_id = uid
    DB.commit()
    return jsonify({'status':'ok'})

@app.route('/api/payments/<int:pid>/unmatch', methods=['POST'])
def unmatch_payment(pid):
    p = DB.query(Payment).get(pid)
    if not p: return jsonify({'error':'not found'}), 404
    p.matched_user_id = None
    DB.commit()
    return jsonify({'status':'ok'})

# --- Settings endpoints ---
@app.route('/api/settings', methods=['GET','PUT'])
def settings():
    if request.method == 'GET':
        rows = DB.query(Setting).all()
        return jsonify({r.key: r.value for r in rows})
    else:
        for k,v in request.json.items():
            s = DB.query(Setting).get(k)
            if s:
                s.value = str(v)
            else:
                DB.add(Setting(key=k, value=str(v)))
        DB.commit()
        return jsonify({'status':'ok'})

# --- trigger scan now ---
@app.route('/api/scan', methods=['POST'])
def trigger_scan():
    appended = scan_once()
    return jsonify({'appended': appended})

# --- sync with tautulli ---
@app.route('/api/sync-tautulli', methods=['POST'])
def sync_tautulli():
    tautulli_url = os.getenv('TAUTULLI_URL')
    tautulli_key = os.getenv('TAUTULLI_API_KEY')
    if not tautulli_url or not tautulli_key:
        return jsonify({'error':'tautulli not configured'}), 400
    data = get_tautulli_users(tautulli_url, tautulli_key)
    added = 0
    for d in data:
        uname = d.get('username') or d.get('friendly_name') or d.get('user_id')
        if not DB.query(User).filter_by(plex_username=uname).first():
            u = User(plex_username=uname, real_name=d.get('friendly_name') or '', emails='', billing_amount=0.0)
            DB.add(u); added += 1
    DB.commit()
    return jsonify({'added': added})

# --- disable overdue users via Tautulli ---
@app.route('/api/disable-overdue', methods=['POST'])
def disable_overdue():
    now = datetime.utcnow()
    grace = int(os.getenv('GRACE_DAYS','7'))
    disabled = 0
    users = DB.query(User).all()
    for u in users:
        if u.next_due and now > (u.next_due + timedelta(days=grace)):
            try:
                # Best practice: map plex_username to Tautulli user id. Here we attempt direct call using plex_username.
                res = disable_user(os.getenv('TAUTULLI_URL'), os.getenv('TAUTULLI_API_KEY'), u.plex_username)
                u.active = False
                disabled += 1
            except Exception as e:
                print("disable error", e)
    DB.commit()
    return jsonify({'disabled': disabled})

if __name__ == '__main__':
    port = int(os.getenv('WEB_PORT', '8080'))
    app.run(host='0.0.0.0', port=port)
