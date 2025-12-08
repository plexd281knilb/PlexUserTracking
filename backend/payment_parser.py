import re

def _first_group(regex, text):
    m = re.search(regex, text, re.IGNORECASE)
    return m.group(1).strip() if m else None

def parse_payment(body, service_type):
    """
    Return (amount_str_or_None, payer_str_or_None)
    """
    if not body:
        return None, None

    # Generic amount search
    amount = _first_group(r"\$([0-9]+(?:\.[0-9]{2})?)", body)

    payer = None
    s = (service_type or "").lower()
    if s == "paypal":
        payer = _first_group(r"from\s+([A-Z][\w .'\-@]+)", body) or _first_group(r"Paid by\s+([A-Z][\w .'\-@]+)", body)
    elif s == "venmo":
        payer = _first_group(r"([A-Z][\w .'\-]+)\s+paid you", body) or _first_group(r"from\s+([A-Z][\w .'\-]+)", body)
    elif s.startswith("zelle"):
        payer = _first_group(r"from\s+([A-Z][\w .'\-]+)", body) or _first_group(r"([A-Z][\w .'\-]+)\s+sent you", body)

    # Memo / Note might contain username
    memo = _first_group(r"(?:Memo|Note)[:\-]\s*([A-Za-z0-9_ @\.\-]{2,80})", body)
    if memo:
        # If memo looks like a username or short token, prefer it
        if not payer or len(memo) < len(payer):
            payer = memo

    return amount, payer
