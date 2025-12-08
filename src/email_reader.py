import imaplib
import email
from email.header import decode_header
import re

def _decode_header(value):
    if value is None:
        return ""
    decoded, charset = decode_header(value)[0]
    if isinstance(decoded, bytes):
        return decoded.decode(charset or "utf-8", errors="ignore")
    return decoded

class EmailReader:
    def __init__(self, host, username, password, mailbox="INBOX"):
        self.host = host
        self.username = username
        self.password = password
        self.mailbox = mailbox
        self.conn = None

    def connect(self):
        self.conn = imaplib.IMAP4_SSL(self.host)
        self.conn.login(self.username, self.password)
        self.conn.select(self.mailbox)

    def _extract_body(self, msg):
        if msg.is_multipart():
            parts = []
            for part in msg.walk():
                ctype = part.get_content_type()
                disp = str(part.get("Content-Disposition"))
                if ctype == "text/plain" and "attachment" not in disp:
                    payload = part.get_payload(decode=True)
                    if payload:
                        parts.append(payload.decode("utf-8", errors="ignore"))
            return "\n".join(parts)
        else:
            payload = msg.get_payload(decode=True)
            return payload.decode("utf-8", errors="ignore") if payload else ""

    def search(self, search_term, mark_seen=False):
        """
        search_term: a raw IMAP search snippet, e.g. 'BODY "Zelle"' or 'FROM "paypal"'
        returns list of dicts: subject, from, date, body
        """
        self.connect()
        # Defensive: if empty search_term -> UNSEEN
        crit = f'(UNSEEN {search_term})' if search_term else 'UNSEEN'
        typ, data = self.conn.search(None, crit)
        results = []
        if typ != "OK":
            return results
        for num in data[0].split():
            typ, msg_data = self.conn.fetch(num, "(RFC822)")
            if typ != "OK":
                continue
            raw = msg_data[0][1]
            msg = email.message_from_bytes(raw)
            subject = _decode_header(msg.get("Subject"))
            frm = _decode_header(msg.get("From"))
            date = _decode_header(msg.get("Date"))
            body = self._extract_body(msg)
            results.append({"subject": subject, "from": frm, "date": date, "body": body, "uid": num.decode() if isinstance(num, bytes) else str(num)})
            if mark_seen:
                try:
                    self.conn.store(num, "+FLAGS", "\\Seen")
                except:
                    pass
        try:
            self.conn.close()
            self.conn.logout()
        except:
            pass
        return results
