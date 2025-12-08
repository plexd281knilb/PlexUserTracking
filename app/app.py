import yaml
import csv
import os
from email_reader import EmailReader

CONFIG_PATH = "/config/config.yaml"

def load_config():
    with open(CONFIG_PATH, "r") as f:
        return yaml.safe_load(f)

def append_to_csv(csv_path, rows):
    file_exists = os.path.isfile(csv_path)
    with open(csv_path, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["service", "subject", "from", "date"])
        if not file_exists:
            writer.writeheader()
        for row in rows:
            writer.writerow(row)

def main():
    config = load_config()
    output = config["output_file"]
    all_rows = []

    for account in config["emails"]:
        reader = EmailReader(
            host=account["imap_server"],
            username=account["address"],
            password=account["password"],
            mailbox=account.get("folder", "INBOX")
        )

        emails = reader.search([account["search_term"]])

        for e in emails:
            all_rows.append({
                "service": account["type"],
                "subject": e["subject"],
                "from": e["from"],
                "date": e["date"],
            })

    if all_rows:
        append_to_csv(output, all_rows)
        print(f"Added {len(all_rows)} new payments")
    else:
        print("No payment emails found.")

if __name__ == "__main__":
    main()
