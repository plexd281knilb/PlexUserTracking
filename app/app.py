import imaplib
import email
from email.header import decode_header
import yaml
import csv
import re
import os
from datetime import datetime

def decode_text(value):
    decoded, charset = decode_header(value)[0]
    if isinstance(decoded, bytes):
        return decoded.decode(charset or "utf-8", errors="ignore")
    return decoded

def load_config():
    with open("/config/config.yaml", "r") as f:
        return yaml.safe_load(f)

def append_payment(output_file, entry):
    file_exists = os.path.exists(output_file)
    with open(output_file, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=entry.keys())
        if not file_exists:
            writer.writeheader()
        writer.writerow(entry)

def parse_amount(body):
    match = re.search(r"\$([0-9]+\.[0-9]{2})", body)
    return match.group(1) if match else None

def extract_body(msg):
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                return part.get_payload(decode=True).decode(errors="ignore")
    return msg.get_payload(decode=True).decode(errors="ignore")

def process_account(account, output_file):
    print(f"Checking {account['address']}...")

    imap = imaplib.IMAP4_SSL(account["imap_server"])
    imap.login(account["address"], account["password"])
    imap.select(account["folder"])

    search_string = f'(UNSEEN {account["search_term"]})'
    status, data = imap.search(None, search_string)

    email_ids = data[0].split()
    print(f"Found {len(email_ids)} matching emails.")

    for eid in email_ids:
        _, msg_data = imap.fetch(eid, "(RFC822)")
        msg = email.message_from_bytes(msg_data[0][1])

        subject = decode_text(msg["Subject"])
        sender = decode_text(msg["From"])
        body = extract_body(msg)

        # Special Zelle SMS parsing
        if account["type"] == "zelle_sms":
            payer_match = re.search(r"from ([A-Za-z0-9 .]+)", body)
            payer = payer_match.group(1).strip() if payer_match else "UNKNOWN"
            amount = parse_amount(body) or "UNKNOWN"
        else:
            payer = sender
            amount = parse_amount(body) or "UNKNOWN"

        entry = {
            "timestamp": datetime.now().isoformat(),
            "source": account["type"],
            "email": account["address"],
            "sender": payer,
            "subject": subject,
            "amount": amount,
            "body": body.replace("\n", " ")[:500],
        }

        append_payment(output_file, entry)

        # mark email as read
        imap.store(eid, "+FLAGS", "\\Seen")

    imap.close()
    imap.logout()

def main():
    config = load_config()
    output_file = config["output_file"]
    for account in config["emails"]:
        process_account(account, output_file)

if __name__ == "__main__":
    main()
