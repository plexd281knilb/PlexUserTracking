import email
import re

def parse_payment_email(service, msg):
    """
    Parses an email message based on the payment service and extracts key info.
    
    This is a stub. Real implementation requires analyzing email senders and body patterns.
    """
    sender = msg.get('From', '').lower()
    subject = msg.get('Subject', '')
    
    # Simple placeholder logic:
    if service == 'venmo' and 'venmo' in sender and 'paid you' in subject:
        return {
            'status': 'Paid',
            'amount': 25.00, # Placeholder
            'recipient_email': 'user@example.com' # Must extract the actual Plex user's email/identifier
        }
    
    if service == 'zelle' and 'zelle' in sender and 'money received' in subject:
        return {
            'status': 'Paid',
            'amount': 25.00,
            'recipient_email': 'user@example.com' 
        }

    # ... and so on for PayPal

    return None