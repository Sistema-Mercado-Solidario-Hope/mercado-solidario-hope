from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from core.models import Usuario, Product, Category, BeneficiaryFamily, OutboundDelivery, DeliveryItem, DonationIntake, DonationItem
from core.views import generate_token
import json

class ProductCRUDTests(TestCase):
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
        self.token = generate_token(self.admin)
        self.headers = {'HTTP_AUTHORIZATION': f'Bearer {self.token}'}

    def test_create_product(self):
        payload = {
            'nome': 'Arroz Especial',
            'categoria': 'Cesta Básica',
            'unidade': 'kg',
            'quantidade': 100.50,
            'estoqueMinimo': 20.00,
            'estoque_maximo': 1000.00
        }
        response = self.client.post(
            '/api/estoque/produtos',
            data=json.dumps(payload),
            content_type='application/json',
            **self.headers
        )
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.content)
        self.assertTrue(Product.objects.filter(pk=data['id']).exists())
        self.assertEqual(Product.objects.get(pk=data['id']).nome_produto, 'Arroz Especial')

    def test_update_product(self):
        cat, _ = Category.objects.get_or_create(nome='Cesta Básica')
        p = Product.objects.create(
            nome_produto='Feijão Teste',
            categoria=cat,
            unidade_medida='kg',
            estoque_atual=50.00,
            estoque_minimo=10.00
        )
        payload = {'nome': 'Feijão Modificado', 'quantidade': 40.00}
        response = self.client.patch(
            f'/api/estoque/produtos/{p.id_produto}',
            data=json.dumps(payload),
            content_type='application/json',
            **self.headers
        )
        self.assertEqual(response.status_code, 200)
        p.refresh_from_db()
        self.assertEqual(p.nome_produto, 'Feijão Modificado')
        self.assertEqual(float(p.estoque_atual), 40.00)

    def test_delete_product(self):
        cat, _ = Category.objects.get_or_create(nome='Cesta Básica')
        p = Product.objects.create(
            nome_produto='Excluir Teste',
            categoria=cat,
            unidade_medida='un',
            estoque_atual=10.00
        )
        response = self.client.delete(
            f'/api/estoque/produtos/{p.id_produto}',
            **self.headers
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Product.objects.filter(pk=p.id_produto).exists())


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
            cpf_nis='11122233344',
            telefone='(47) 99999-5555',
            status='ativo',
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
