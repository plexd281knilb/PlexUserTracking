import os
import yaml
import logging
from datetime import datetime
from email_reader import EmailReader
from payment_parser import parse_payment
from csv_writer import append_rows, ensure_csv_exists

# Logging
LOG_PATH = "/logs/plexpayments.log"
os.makedirs("/logs", exist_ok=True)
logging.basicConfig(
    filename=LOG_PATH,
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s"
)

CONFIG_PATH = "/config/settings.yaml"

def load_config():
    with open(CONFIG_PATH, "r") as f:
        return yaml.safe_load(f)

def run_once():
    cfg = load_config()
    output = cfg.get("output_file", "/data/payments.csv")
    ensure_csv_exists(output)

    collected = []
    for account in cfg.get("emails", []):
        try:
            reader = EmailReader(
                host=account["imap_server"],
                username=account["address"],
                password=account["password"],
                mailbox=account.get("folder", "INBOX")
            )
            logging.info(f"Checking {account['address']} ({account.get('type')})")
            matches = reader.search(account.get("search_term"), mark_seen=True)
            for m in matches:
                amount, payer = parse_payment(m.get("body",""), account.get("type"))
                row = {
                    "service": account.get("type"),
                    "amount": amount or "UNKNOWN",
                    "payer": payer or m.get("from",""),
                    "subject": m.get("subject",""),
                    "sender": m.get("from",""),
                    "date": m.get("date",""),
                    "body": (m.get("body","") or "")[:1000]
                }
                collected.append(row)
        except Exception as e:
            logging.exception(f"Error processing account {account.get('address')}: {e}")

    if collected:
        appended = append_rows(output, collected)
        logging.info(f"Appended {appended} new rows to {output}")
    else:
        logging.info("No new rows found this run.")

if __name__ == "__main__":
    run_once()
