# PlexUserTracking

A dashboard + backend for tracking donations/payments (PayPal, Venmo, Zelle via email/SMS forwarding),
managing users, and integrating with Tautulli for access control.

## Quickstart (Unraid)

1. Clone repo to Unraid appdata or working folder.
2. Edit `backend/config.example.env` values or set environment variables in docker-compose.yml.
3. Build and run:
4. Open dashboard: `http://<unraid-ip>:3000`
Backend API: `http://<unraid-ip>:8080/api/...` (used by frontend)
5. In the UI:
- Add email accounts (IMAP credentials)
- Add users or sync from Tautulli
- Run "Run Scan Now" to pull new payments
- Match payments to users (click on payments -> match)
- Set settings (scan interval, grace days, SMTP settings)

## Notes
- Database is SQLite: `/backend/data/plexusertracking.db`
- Keep your IMAP passwords and SMTP credentials secure.
- For Gmail accounts, use App Passwords.
