import imaplib, email
from models import Session, EmailAccount, Payment
from payment_parser import parse_payment
from datetime import datetime
from email.header import decode_header

def _dec(v):
    if not v:
        return ""
    decoded, enc = decode_header(v)[0]
    if isinstance(decoded, bytes):
        return decoded.decode(enc or 'utf-8', errors='ignore')
    return decoded

def scan_once():
    session = Session()
    accounts = session.query(EmailAccount).all()
    appended = 0
    for a in accounts:
        try:
            imap = imaplib.IMAP4_SSL(a.imap_server, a.imap_port, timeout=30)
            imap.login(a.address, a.password)
            imap.select(a.folder)
            crit = f'(UNSEEN {a.search_term})' if a.search_term else 'UNSEEN'
            typ, data = imap.search(None, crit)
            if typ != 'OK' or not data or not data[0]:
                try:
                    imap.close(); imap.logout()
                except:
                    pass
                continue
            for num in data[0].split():
                typ, msg_data = imap.fetch(num, '(RFC822)')
                if typ != 'OK':
                    continue
                msg = email.message_from_bytes(msg_data[0][1])
                subject = _dec(msg.get('Subject'))
                frm = _dec(msg.get('From'))
                date = _dec(msg.get('Date'))
                body = ""
                if msg.is_multipart():
                    for part in msg.walk():
                        ctype = part.get_content_type()
                        disp = str(part.get("Content-Disposition"))
                        if ctype == "text/plain" and "attachment" not in disp:
                            payload = part.get_payload(decode=True)
                            if payload:
                                body += payload.decode('utf-8', errors='ignore')
                else:
                    payload = msg.get_payload(decode=True)
                    if payload:
                        body = payload.decode('utf-8', errors='ignore')
                amount, payer = parse_payment(body, a.name or a.search_term or a.address)
                payment = Payment(
                    service=a.name or a.address,
                    amount=float(amount) if amount else None,
                    payer=payer,
                    subject=subject,
                    sender=frm,
                    date=date,
                    body=body
                )
                session.add(payment)
                appended += 1
                # mark seen
                try:
                    imap.store(num, '+FLAGS', '\\Seen')
                except:
                    pass
            try:
                imap.close(); imap.logout()
            except:
                pass
            a.last_checked = datetime.utcnow()
            session.commit()
        except Exception as e:
            session.rollback()
            print("scan account error", e)
    session.close()
    return appended
