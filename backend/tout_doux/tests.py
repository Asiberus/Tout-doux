"""
Garde-fou de la migration Django 3.2 → 6.1 (docs/workflows/django-6-migration.md §0.3).

Ces tests ne couvrent pas le métier : ils couvrent la plomberie que la montée de versions met en
danger — résolution d'URL, knox, DRF, pagination maison, django-filter, django-cors-headers, ORM
et rendu des templates d'e-mail.
"""
from unittest.mock import patch

from django.core import mail
from django.test import SimpleTestCase, TestCase
from django.urls import Resolver404, resolve, reverse
from rest_framework.test import APIClient

from tout_doux.models import Project, Tag, User
from tout_doux.services.email import EmailService

PASSWORD = 'Sm0ke!Test'


class RoutingTest(SimpleTestCase):
    NAMED_ROUTES = (
        'login', 'logout', 'register', 'activate', 'resend_activation_email',
        'reset_password_request', 'reset_password', 'validate_password',
        'confirm_email_change', 'check_token', 'check_password', 'preferences',
        'project-list', 'list-list', 'task-list', 'daily_task-list', 'section-list',
        'event-list', 'tag-list', 'common_task-list', 'user-list', 'feedback-list',
    )

    def test_every_named_route_reverses(self):
        for name in self.NAMED_ROUTES:
            with self.subTest(route=name):
                self.assertTrue(reverse(name).startswith('/'))

    def test_routes_are_anchored(self):
        """§1.1 / R5 — ROUGE avant migration : url() résout par re.search, sans ancrage."""
        for path in ('/prefixe/auth/login/', '/prefixe/project/'):
            with self.subTest(path=path):
                with self.assertRaises(Resolver404):
                    resolve(path)


class AuthenticatedTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('smoke', 'smoke@example.com', PASSWORD)
        self.client = APIClient()

    def authenticate(self, user=None):
        user = user or self.user
        response = self.client.post(
            reverse('login'), {'email': user.email, 'password': PASSWORD}, format='json'
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {response.data["token"]}')
        return response.data


class KnoxAuthTest(AuthenticatedTestCase):
    def test_login_returns_token_and_expiry(self):
        data = self.authenticate()
        self.assertIn('token', data)
        self.assertIn('expiry', data)

    def test_wrong_password_is_rejected(self):
        # 403 et non 401 : EmailPasswordAuthentication n'implémente pas authenticate_header(),
        # donc DRF ne peut pas émettre de WWW-Authenticate et dégrade le 401 en 403.
        response = self.client.post(
            reverse('login'), {'email': self.user.email, 'password': 'wrong'}, format='json'
        )
        self.assertEqual(response.status_code, 403)

    def test_endpoint_is_closed_without_token(self):
        self.assertEqual(self.client.get(reverse('project-list')).status_code, 401)

    def test_logout_revokes_the_token(self):
        self.authenticate()
        self.assertEqual(self.client.get(reverse('project-list')).status_code, 200)
        self.assertEqual(self.client.post(reverse('logout')).status_code, 204)
        self.assertEqual(self.client.get(reverse('project-list')).status_code, 401)


class ProjectApiTest(AuthenticatedTestCase):
    def setUp(self):
        super().setUp()
        self.authenticate()

    def test_post_answers_with_the_read_shape(self):
        response = self.client.post(
            reverse('project-list'), {'name': 'Projet', 'description': 'desc'}, format='json'
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(
            set(response.data), {'id', 'name', 'description', 'tags', 'archived', 'createdOn'}
        )

    def test_queryset_is_scoped_to_the_current_user(self):
        other = User.objects.create_user('other', 'other@example.com', PASSWORD)
        Project.objects.create(user=other, name='Pas à moi', description='')
        Project.objects.create(user=self.user, name='À moi', description='')

        response = self.client.get(reverse('project-list'))
        self.assertEqual([p['name'] for p in response.data['content']], ['À moi'])

    def test_a_tag_owned_by_someone_else_is_refused(self):
        other = User.objects.create_user('other', 'other@example.com', PASSWORD)
        tag = Tag.objects.create(user=other, type=Tag.Type.PROJECT, name='t', color=Tag.Color.BLUE)

        response = self.client.post(
            reverse('project-list'),
            {'name': 'Projet', 'description': '', 'tagIds': [tag.pk]},
            format='json',
        )
        self.assertEqual(response.status_code, 400)

    def test_pagination_envelope_and_size_zero(self):
        for index in range(3):
            Project.objects.create(user=self.user, name=f'P{index}', description='')

        paginated = self.client.get(reverse('project-list'), {'size': 2}).data
        self.assertEqual(set(paginated), {'count', 'page', 'size', 'first', 'last', 'content'})
        self.assertEqual(len(paginated['content']), 2)

        everything = self.client.get(reverse('project-list'), {'size': 0}).data
        self.assertEqual(everything['size'], 0)
        self.assertEqual(len(everything['content']), 3)

    def test_django_filter_backend_is_wired(self):
        Project.objects.create(user=self.user, name='Actif', description='')
        Project.objects.create(user=self.user, name='Archivé', description='', archived=True)

        response = self.client.get(reverse('project-list'), {'archived': 'true'})
        self.assertEqual([p['name'] for p in response.data['content']], ['Archivé'])


class CorsTest(TestCase):
    def test_the_middleware_still_answers(self):
        """§1.3 — le renommage de CORS_ORIGIN_ALLOW_ALL casse ce header en silence."""
        response = self.client.get('/project/', HTTP_ORIGIN='http://localhost:8080')
        self.assertIn('Access-Control-Allow-Origin', response)


class EmailTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('smoke', 'smoke@example.com', PASSWORD)

    # L'envoi réel part dans un thread (adr/0005) : on le rend synchrone pour lire mail.outbox.
    @patch.object(EmailService, '_send_mail_async', side_effect=EmailService._send_mail)
    def test_account_emails_render_and_send(self, _):
        EmailService.send_user_creation_email(self.user)
        EmailService.send_reset_password_email(self.user)
        EmailService.send_change_email_request_email(self.user, 'new@example.com', 'jeton')
        EmailService.send_email_changed_email(self.user, 'old@example.com')

        self.assertEqual(len(mail.outbox), 4)
        for message in mail.outbox:
            with self.subTest(subject=message.subject):
                self.assertEqual(len(message.alternatives), 1)
                self.assertEqual(message.alternatives[0][1], 'text/html')
