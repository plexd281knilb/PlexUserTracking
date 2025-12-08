from flask_mail import Mail, Message

mail = Mail()

def send_reminder(app, to, subject, body):
    with app.app_context():
        msg = Message(subject, recipients=[to], body=body, sender=app.config.get('MAIL_DEFAULT_SENDER'))
        mail.send(msg)
