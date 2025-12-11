import email

def parse_payment_email(service, msg):
    """
    Parses an email message based on the payment service and extracts key info.
    You will need to expand this logic for production use!
    """
    sender = msg.get('From', '').lower()
    subject = msg.get('Subject', '')
    
    # Placeholder logic to determine if payment was received
    if service == 'venmo' and ('@venmo.com' in sender or 'venmo' in subject.lower()) and 'paid you' in subject.lower():
        # In a real app, you would parse the body to find the user's name/email and amount
        return {
            'status': 'Paid',
            'recipient_email': 'user_email_to_match_in_users_json@example.com' 
        }
    
    if service == 'zelle' and ('zellepay.com' in sender or 'money received' in subject.lower()):
        return {
            'status': 'Paid',
            'recipient_email': 'user_email_to_match_in_users_json@example.com' 
        }

    if service == 'paypal' and ('service@paypal.com' in sender and 'money received' in subject.lower()):
        return {
            'status': 'Paid',
            'recipient_email': 'user_email_to_match_in_users_json@example.com' 
        }

    return None