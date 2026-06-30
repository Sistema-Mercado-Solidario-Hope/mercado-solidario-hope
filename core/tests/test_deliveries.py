import json

from django.test import TestCase

from core.models import BeneficiaryFamily, Category, Product, Usuario
from core.views import generate_token


class DeliveryTests(TestCase):
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

        self.family = BeneficiaryFamily.objects.create(
            nome_familia='Família Teste',
            responsavel_nome='Responsável Teste',
            cpf='11144477735',
            nis='11122233344',
            telefone='(47) 99999-5555',
            status='ativo',
            cota_limite=30,
            lgpd_accept=True
        )

        cat, _ = Category.objects.get_or_create(nome='Cesta Básica')
        self.product = Product.objects.create(
            nome_produto='Arroz (kg)',
            categoria=cat,
            unidade_medida='kg',
            estoque_atual=100.00,
            estoque_minimo=10.00
        )

    def test_delivery_success_and_stock_decrease(self):
        payload = {
            'beneficiario_id': self.family.id_familia,
            'itens': [
                {'produto_id': self.product.id_produto, 'quantidade': 15.50}
            ]
        }
        response = self.client.post(
            '/api/entregas/confirmar',
            data=json.dumps(payload),
            content_type='application/json',
            **self.headers
        )
        self.assertEqual(response.status_code, 201)

        # Check stock decrease
        self.product.refresh_from_db()
        self.assertEqual(float(self.product.estoque_atual), 84.50) # 100.00 - 15.50 (RN008 fractional weights)

        # Check last delivery update
        self.family.refresh_from_db()
        self.assertIsNotNone(self.family.data_ultima_entrega)

    def test_delivery_insufficient_stock_fails(self):
        payload = {
            'beneficiario_id': self.family.id_familia,
            'itens': [
                {'produto_id': self.product.id_produto, 'quantidade': 120.00} # Exceeds 100.00 in stock
            ]
        }
        response = self.client.post(
            '/api/entregas/confirmar',
            data=json.dumps(payload),
            content_type='application/json',
            **self.headers
        )
        self.assertEqual(response.status_code, 422) # Should fail (RN001: no negative stock)

        # Stock should remain unchanged
        self.product.refresh_from_db()
        self.assertEqual(float(self.product.estoque_atual), 100.00)

    def test_get_family_deliveries_history(self):
        # 1. Create a delivery
        payload = {
            'beneficiario_id': self.family.id_familia,
            'itens': [
                {'produto_id': self.product.id_produto, 'quantidade': 10.00}
            ]
        }
        res_post = self.client.post(
            '/api/entregas/confirmar',
            data=json.dumps(payload),
            content_type='application/json',
            **self.headers
        )
        self.assertEqual(res_post.status_code, 201)

        # 2. Query history API
        response = self.client.get(
            f'/api/beneficiarios/{self.family.id_familia}/entregas',
            **self.headers
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertIn('entregas', data)
        self.assertEqual(len(data['entregas']), 1)
        self.assertEqual(data['entregas'][0]['operador'], self.operator.nome_completo)
        self.assertEqual(len(data['entregas'][0]['itens']), 1)
        self.assertEqual(data['entregas'][0]['itens'][0]['produto_nome'], self.product.nome_produto)
        self.assertEqual(float(data['entregas'][0]['itens'][0]['quantidade']), 10.00)

    def test_delivery_exceeding_cota_limite_fails(self):
        # Configure a strict cota_limite of 5 items
        self.family.cota_limite = 5
        self.family.save()

        # Try to deliver 8 items (exceeds quota of 5)
        payload = {
            'beneficiario_id': self.family.id_familia,
            'itens': [
                {'produto_id': self.product.id_produto, 'quantidade': 8.00}
            ]
        }
        response = self.client.post(
            '/api/entregas/confirmar',
            data=json.dumps(payload),
            content_type='application/json',
            **self.headers
        )
        self.assertEqual(response.status_code, 422)
        self.assertIn('Limite de cota familiar excedido', json.loads(response.content)['erro'])

        # Stock should not change
        self.product.refresh_from_db()
        self.assertEqual(float(self.product.estoque_atual), 100.00)


