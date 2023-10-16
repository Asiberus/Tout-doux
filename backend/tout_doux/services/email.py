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

        html_template = get_template('email/html/user-creation.html')
        text_template = get_template('email/text/user-creation.txt')
        html_body = html_template.render(context)
        text_body = text_template.render(context)

        subject = 'Tout Doux - Création de compte'
        to = (user.email,)

        EmailService._send_mail_async(subject=subject, to=to, body=text_body, html_body=html_body)

    @staticmethod
    def send_reset_password_email(user):
        uidb64 = encode_uid(user.pk)
        token = get_token_from_user(user)
        link = f'{settings.SERVER_URL}password-reset?uidb64={uidb64}&token={token}'
        context = {'user': user, 'link': link}

        html_template = get_template('email/html/password-reset.html')
        text_template = get_template('email/text/password-reset.txt')
        html_body = html_template.render(context)
        text_body = text_template.render(context)

        subject = 'Tout Doux - Réinitialisation de mot de passe'
        to = (user.email,)

        EmailService._send_mail_async(subject=subject, to=to, body=text_body, html_body=html_body)
