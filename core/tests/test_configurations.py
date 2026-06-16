import json

from django.test import TestCase

from core.models import GlobalConfiguration, Usuario
from core.views import generate_token


class ConfigurationTests(TestCase):
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
        self.admin_token = generate_token(self.admin)
        self.admin_headers = {'HTTP_AUTHORIZATION': f'Bearer {self.admin_token}'}

        self.operator = Usuario.objects.create_user(
            username='op@test.com',
            email='op@test.com',
            nome_completo='Operator User',
            cargo='operador',
            status='ativo'
        )
        self.operator.set_password('password')
        self.operator.save()
        self.operator_token = generate_token(self.operator)
        self.operator_headers = {'HTTP_AUTHORIZATION': f'Bearer {self.operator_token}'}

        # Clear existing configs and create one
        GlobalConfiguration.objects.all().delete()
        self.config = GlobalConfiguration.objects.create(
            telefone_contato='554732073009',
            endereco_instituicao='Rua Teste, 123',
            pix_key='pix@teste.com',
            cnpj='12345678000199',
            email_contato='teste@contato.com',
            instagram_link='https://instagram.com/teste'
        )

    def test_get_configurations(self):
        response = self.client.get('/api/configuracoes')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(data['telefone_contato'], '554732073009')
        self.assertEqual(data['cnpj'], '12345678000199')

    def test_update_configurations_requires_auth(self):
        payload = {'telefone_contato': '5547999998888'}
        response = self.client.post(
            '/api/configuracoes',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 401)

    def test_update_configurations_operator_denied(self):
        payload = {'telefone_contato': '5547999998888'}
        response = self.client.post(
            '/api/configuracoes',
            data=json.dumps(payload),
            content_type='application/json',
            **self.operator_headers
        )
        self.assertEqual(response.status_code, 403)

    def test_update_configurations_admin_success(self):
        payload = {
            'telefone_contato': '5547999998888',
            'endereco_instituicao': 'Nova Rua, 456'
        }
        response = self.client.post(
            '/api/configuracoes',
            data=json.dumps(payload),
            content_type='application/json',
            **self.admin_headers
        )
        self.assertEqual(response.status_code, 200)
        self.config.refresh_from_db()
        self.assertEqual(self.config.telefone_contato, '5547999998888')
        self.assertEqual(self.config.endereco_instituicao, 'Nova Rua, 456')
