from django.test import TestCase

from core.models import Usuario
from core.views import generate_token


class AuthAndRBACTests(TestCase):
    def setUp(self):
        self.admin = Usuario.objects.create_user(
            username='admin@test.com',
            email='admin@test.com',
            nome_completo='Admin User',
            cargo='admin',
            status='ativo'
        )
        self.admin.set_password('password')
        self.admin.save()

        self.operator = Usuario.objects.create_user(
            username='operator@test.com',
            email='operator@test.com',
            nome_completo='Operator User',
            cargo='operador',
            status='ativo'
        )
        self.operator.set_password('password')
        self.operator.save()

    def test_operator_cannot_manage_users(self):
        token = generate_token(self.operator)
        headers = {'HTTP_AUTHORIZATION': f'Bearer {token}'}

        # Try to GET all users
        response = self.client.get('/api/usuarios', **headers)
        self.assertEqual(response.status_code, 403)

        # Admin should succeed
        admin_token = generate_token(self.admin)
        admin_headers = {'HTTP_AUTHORIZATION': f'Bearer {admin_token}'}
        response2 = self.client.get('/api/usuarios', **admin_headers)
        self.assertEqual(response2.status_code, 200)
