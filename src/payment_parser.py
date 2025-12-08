import re

def _first_group(regex, text):
    m = re.search(regex, text, re.IGNORECASE)
    return m.group(1).strip() if m else None

def parse_payment(body, service_type):
    """
    Heuristics for extracting amount and payer from bodies.
    Returns (amount_str or None, payer_str or None)
    """
    if not body:
        return None, None

    # Generic amount search
    amount = _first_group(r"\$([0-9]+(?:\.[0-9]{2})?)", body)

    payer = None
    if service_type and service_type.lower() == "paypal":
        # Try "You received $X from John Doe" or "Paid by John Doe"
        payer = _first_group(r"from\s+([A-Z][\w .'-]+)", body) or _first_group(r"Paid by\s+([A-Z][\w .'-]+)", body)
    elif service_type and service_type.lower() == "venmo":
        # Try "John Doe paid you $X" or "You received $X from John Doe"
        payer = _first_group(r"([A-Z][\w .'-]+)\s+paid you", body) or _first_group(r"from\s+([A-Z][\w .'-]+)", body)
    elif service_type and service_type.lower() in ("zelle", "zelle_sms"):
        payer = _first_group(r"from\s+([A-Z][\w .'-]+)", body) or _first_group(r"([A-Z][\w .'-]+)\s+sent you", body)

    # Extra attempt: look for "Memo:" or "Note:" to capture possible username mention
    memo = _first_group(r"(?:Memo|Note)[:\-]\s*([A-Za-z0-9_ @\.\-]{2,60})", body)
    if memo and (not payer or len(memo) < len(payer or "")):
        # If memo contains an obvious username or plex username, prefer it as payer
        payer = memo

    return amount, payer
