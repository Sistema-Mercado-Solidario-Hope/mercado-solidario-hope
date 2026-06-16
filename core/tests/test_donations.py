import json

from django.test import TestCase

from core.models import Category, DonationIntake, DonationItem, Product, Usuario
from core.views import generate_token


class DonationTests(TestCase):
    def setUp(self):
        self.operator = Usuario.objects.create_user(
            username='op@test.com',
            email='op@test.com',
            nome_completo='Operator User',
            cargo='operador',
            status='ativo'
        )
        self.operator.set_password('password')
        self.operator.save()
        self.token = generate_token(self.operator)
        self.headers = {'HTTP_AUTHORIZATION': f'Bearer {self.token}'}

        cat, _ = Category.objects.get_or_create(nome='Cesta Básica')
        self.product = Product.objects.create(
            nome_produto='Arroz (kg)',
            categoria=cat,
            unidade_medida='kg',
            estoque_atual=100.00,
            estoque_minimo=10.00
        )

    def test_create_donation_intake_success(self):
        payload = {
            'doador': {
                'nome': 'Doador Exemplo',
                'telefone': '(47) 99999-1234'
            },
            'itens': [
                {'id': self.product.id_produto, 'quantidade': 50.00}
            ]
        }
        response = self.client.post(
            '/api/intencao-doacao',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.content)
        self.assertTrue(data['sucesso'])
        self.assertIn('codigo_rastreamento', data)
        self.assertTrue(DonationIntake.objects.filter(codigo_rastreamento=data['codigo_rastreamento']).exists())

    def test_get_donations_requires_auth(self):
        # Without authorization
        response = self.client.get('/api/intencao-doacao')
        self.assertEqual(response.status_code, 401)

        # With authorization
        response_auth = self.client.get('/api/intencao-doacao', **self.headers)
        self.assertEqual(response_auth.status_code, 200)

    def test_complete_donation_increases_stock(self):
        donation = DonationIntake.objects.create(
            nome_doador='Doador Exemplo',
            telefone_doador='(47) 99999-1234',
            status_doacao='pendente',
            codigo_rastreamento='#DOA-2026-TESTE'
        )
        DonationItem.objects.create(
            id_doacao=donation,
            id_produto=self.product,
            quantidade=25.00
        )

        payload = {'status': 'concluida'}
        response = self.client.patch(
            f'/api/intencao-doacao/{donation.id_doacao}/status',
            data=json.dumps(payload),
            content_type='application/json',
            **self.headers
        )
        self.assertEqual(response.status_code, 200)

        # Refresh database instances
        donation.refresh_from_db()
        self.product.refresh_from_db()

        self.assertEqual(donation.status_doacao, 'concluida')
        self.assertIsNotNone(donation.data_recebimento)
        self.assertEqual(float(self.product.estoque_atual), 125.00) # 100.00 + 25.00
