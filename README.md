# PlexPayments

PlexPayments scans multiple IMAP inboxes (PayPal, Venmo, Zelle forwarded SMS), extracts payment info, and writes deduplicated rows to `/data/payments.csv`.

## Quickstart (Unraid)

1. Clone repo to your Unraid appdata or work folder.
2. Copy `config/sample_settings.yaml` → `config/settings.yaml`, then edit with real IMAP credentials.
   - For Gmail accounts, use an App Password.
3. (Optional) Edit docker-compose.yml or use Unraid Docker build.
4. Build container:
5. Run:
The container runs cron and executes `main.py` every day at 6pm minutes. Logs in `./logs/plexpayments.log`.
6. Check `/data/payments.csv` for parsed payments.

## Notes
- Keep `config/settings.yaml` secret — it's listed in `.gitignore`.
- Tune `search_term` for each mailbox (IMAP search syntax).
- If Zelle uses SMS forwarded to email, set that forwarding to one of the monitored inboxes.

## Next steps
- Add user matching (map payer → Plex username)
- Add reminder emails
- Add Tautulli integration to revoke access


