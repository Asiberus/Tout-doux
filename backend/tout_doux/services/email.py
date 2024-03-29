import threading

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import get_template

from tout_doux.utils.token import encode_uid, get_token_from_user


class EmailService:
    @staticmethod
    def _send_mail(**kwargs):
        html_body = kwargs.pop('html_body')
        email = EmailMultiAlternatives(**kwargs)
        if html_body:
            email.attach_alternative(html_body, 'text/html')

        email.send()

    @staticmethod
    def _send_mail_async(**kwargs):
        threading.Thread(target=EmailService._send_mail, kwargs=kwargs).start()

    @staticmethod
    def send_user_creation_email(user):
        uidb64 = encode_uid(user.pk)
        token = get_token_from_user(user)

        link = f'{settings.SERVER_URL}activate?uidb64={uidb64}&token={token}'
        context = {'user': user, 'link': link}

        html_template = get_template('email/user-creation.html')
        html_body = html_template.render(context)

        subject = 'Tout Doux - Activate your account'
        to = (user.email,)

        EmailService._send_mail_async(subject=subject, to=to, html_body=html_body)

    @staticmethod
    def send_reset_password_email(user):
        uidb64 = encode_uid(user.pk)
        token = get_token_from_user(user)
        link = f'{settings.SERVER_URL}password-reset?uidb64={uidb64}&token={token}'
        context = {'user': user, 'link': link}

        html_template = get_template('email/password-reset.html')
        html_body = html_template.render(context)

        subject = 'Tout Doux - Reset your password'
        to = (user.email,)

        EmailService._send_mail_async(subject=subject, to=to, html_body=html_body)

    @staticmethod
    def send_change_email_request_email(user, new_email, token):
        link = f'{settings.SERVER_URL}confirm-email?token={token}'
        context = {'user': user, 'link': link}

        html_template = get_template('email/change-email.html')
        html_body = html_template.render(context)

        subject = 'Tout Doux - Confirm your email address'
        to = (new_email,)

        EmailService._send_mail_async(subject=subject, to=to, html_body=html_body)

    @staticmethod
    def send_email_changed_email(user, previous_email):
        context = {'user': user}

        html_template = get_template('email/email-has-changed.html')
        html_body = html_template.render(context)

        subject = 'Tout Doux - Your email address has been changed'
        to = (previous_email,)

        EmailService._send_mail_async(subject=subject, to=to, html_body=html_body)
