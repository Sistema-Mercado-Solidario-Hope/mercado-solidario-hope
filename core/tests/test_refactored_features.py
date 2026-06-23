import json
from django.test import TestCase
from django.utils import timezone
from core.models import Usuario, Category, Product, ActivityLog, DonationIntake, DonationItem
from core.views import generate_token

class RefactoredFeaturesTests(TestCase):
    def setUp(self):
        # Create user accounts
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
            username='operator@test.com',
            email='operator@test.com',
            nome_completo='Operator User',
            cargo='operador',
            status='ativo'
        )
        self.operator.set_password('password')
        self.operator.save()
        self.operator_token = generate_token(self.operator)
        self.operator_headers = {'HTTP_AUTHORIZATION': f'Bearer {self.operator_token}'}

        # Create some initial database entries
        self.cat_cesta = Category.objects.create(nome='Cesta Básica')
        self.cat_higiene = Category.objects.create(nome='Higiene')

        self.product_arroz = Product.objects.create(
            nome_produto='Arroz',
            categoria=self.cat_cesta,
            unidade_medida='kg',
            estoque_atual=10.00,
            estoque_minimo=20.00,  # Low stock!
            meta=100.00
        )
        self.product_sabonete = Product.objects.create(
            nome_produto='Sabonete',
            categoria=self.cat_higiene,
            unidade_medida='un',
            estoque_atual=50.00,
            estoque_minimo=10.00,  # Good stock!
            meta=200.00
        )

    def test_signup_redirect_and_deprecation(self):
        # cadastro.html page route should redirect to login.html
        response = self.client.get('/cadastro.html')
        self.assertEqual(response.status_code, 302)
        self.assertIn('/login.html', response['Location'])

        # Public signup API should not exist or be deprecated/removed
        response_post = self.client.post('/api/auth/cadastro', data={})
        # Should return 404 since it's removed from urls.py
        self.assertEqual(response_post.status_code, 404)

    def test_product_meta_crud(self):
        # Create product with meta
        payload = {
            'nome': 'Feijão',
            'categoria': 'Cesta Básica',
            'unidade': 'kg',
            'quantidade': 15.00,
            'estoqueMinimo': 5.00,
            'meta': 50.00
        }
        # Clear out activity logs to prevent matching old logs
        ActivityLog.objects.all().delete()
        
        response = self.client.post(
            '/api/estoque/produtos',
            data=json.dumps(payload),
            content_type='application/json',
            **self.admin_headers
        )
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.content)
        product_id = data['id']

        # Verify meta exists in database
        prod = Product.objects.get(pk=product_id)
        self.assertEqual(float(prod.meta), 50.00)

        # Update meta via patch
        update_payload = {'meta': 75.00}
        response_patch = self.client.patch(
            f'/api/estoque/produtos/{product_id}',
            data=json.dumps(update_payload),
            content_type='application/json',
            **self.admin_headers
        )
        self.assertEqual(response_patch.status_code, 200)
        prod.refresh_from_db()
        self.assertEqual(float(prod.meta), 75.00)

        # GET products list and check for meta field
        response_get = self.client.get('/api/estoque/produtos')
        self.assertEqual(response_get.status_code, 200)
        get_data = json.loads(response_get.content)
        prod_json = next(p for p in get_data['produtos'] if p['id'] == product_id)
        self.assertEqual(prod_json['meta'], 75.00)

    def test_api_dashboard_stats(self):
        # Clear existing donations/items/logs
        DonationItem.objects.all().delete()
        DonationIntake.objects.all().delete()
        ActivityLog.objects.all().delete()

        # Perform a donation intake transaction to test weight calculation
        donation = DonationIntake.objects.create(
            nome_doador='Doador Teste',
            telefone_doador='123456789',
            status_doacao='concluida',
            codigo_rastreamento='DON-TEST-123'
        )
        DonationItem.objects.create(
            id_doacao=donation,
            id_produto=self.product_arroz,
            quantidade=15.00
        )
        DonationItem.objects.create(
            id_doacao=donation,
            id_produto=self.product_sabonete,
            quantidade=20.00
        )

        # Create a log entry for today
        ActivityLog.objects.create(
            id_usuario=self.admin,
            acao='CADASTRO_PRODUTO',
            descricao='Teste do dashboard'
        )

        # Query dashboard statistics
        response = self.client.get('/api/estoque/dashboard', **self.admin_headers)
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)

        # Verify values
        self.assertEqual(data['total_produtos'], 2)
        self.assertEqual(data['total_baixo_estoque'], 1)  # only arroz (10 <= 20)
        self.assertEqual(data['total_recebido_kg'], 15.00)  # only arroz is 'kg'
        self.assertEqual(data['total_recebido_itens'], 35.00)  # 15 + 20
        self.assertGreaterEqual(data['movimentacoes_hoje'], 1)

        # Check top needs sorting
        needs = data['produtos_maior_necessidade']
        self.assertEqual(len(needs), 2)
        # arroz: 10/100 = 10%
        # sabonete: 50/200 = 25%
        # So arroz should be first (lower percentage)
        self.assertEqual(needs[0]['nome'], 'Arroz')
        self.assertEqual(needs[1]['nome'], 'Sabonete')

    def test_api_notificacoes(self):
        # Clear existing logs
        ActivityLog.objects.all().delete()

        # Query notifications without auth token (should fail)
        response_no_auth = self.client.get('/api/notificacoes')
        self.assertEqual(response_no_auth.status_code, 401)

        # Query with operator token
        response = self.client.get('/api/notificacoes', **self.operator_headers)
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)

        # Check that it returns the low stock warning for arroz
        notifs = data['notificacoes']
        low_stock_notifs = [n for n in notifs if n['id'].startswith('low-stock-')]
        self.assertEqual(len(low_stock_notifs), 1)
        self.assertIn('Arroz', low_stock_notifs[0]['description'])
