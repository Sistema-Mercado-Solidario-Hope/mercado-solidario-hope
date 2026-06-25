import json
import os

from django.conf import settings
from django.test import TestCase

from core.models import Category, Product, Usuario
from core.views import generate_token


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

    def test_create_product_with_base64_image(self):
        base64_png = (
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
        )
        payload = {
            'nome': 'Produto com Imagem',
            'categoria': 'Higiene',
            'unidade': 'un',
            'quantidade': 10,
            'estoqueMinimo': 2.00,
            'estoque_maximo': 100.00,
            'imagem_url': base64_png
        }
        response = self.client.post(
            '/api/estoque/produtos',
            data=json.dumps(payload),
            content_type='application/json',
            **self.headers
        )
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.content)
        product = Product.objects.get(pk=data['id'])
        self.assertTrue(product.imagem_url.startswith('/img/uploads/'))

        filename = product.imagem_url.replace('/img/uploads/', '')
        filepath = os.path.join(settings.BASE_DIR, 'core', 'static', 'img', 'uploads', filename)
        self.assertTrue(os.path.exists(filepath))

        if os.path.exists(filepath):
            os.remove(filepath)

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
