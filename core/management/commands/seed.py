from django.core.management.base import BaseCommand
from core.models import Usuario, Product, BeneficiaryFamily, GlobalConfiguration
from django.utils import timezone
from datetime import timedelta

class Command(BaseCommand):
    help = 'Seeds initial database state for Mercado Solidário (HOPE)'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # 1. Seed Global Configuration
        config, created = GlobalConfiguration.objects.get_or_create(
            id=1,
            defaults={
                'telefone_contato': '+55 (47) 3207-3009',
                'endereco_instituicao': 'Sede: Rua Aubé, 895 – Boa Vista, Joinville/SC',
                'pix_key': 'joinville@ondadura.com',
                'cnpj': '22.788.440/0001-98',
                'email_contato': 'contato@ondadura.com',
                'instagram_link': 'https://www.instagram.com/ondadura/',
                'qr_code_image': ''  # To be uploaded or set base64 later
            }
        )
        if created:
            self.stdout.write('GlobalConfiguration created.')

        # 2. Seed Users
        # Admin User
        admin_user, created = Usuario.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@exemplo.com',
                'nome_completo': 'Administrador do Sistema',
                'cpf_cnpj': '000.000.000-00',
                'telefone': '(11) 99999-9999',
                'cargo': 'admin',
                'status': 'ativo',
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin_user.set_password('admin')
            admin_user.save()
            self.stdout.write('Admin user created (admin / admin).')

        # Operator User
        operator_user, created = Usuario.objects.get_or_create(
            username='operador@mercadosolidario.com.br',
            defaults={
                'email': 'operador@mercadosolidario.com.br',
                'nome_completo': 'Operador',
                'cpf_cnpj': '777.777.777-77',
                'telefone': '(11) 98888-8888',
                'cargo': 'operador',
                'status': 'ativo',
                'is_staff': True
            }
        )
        if created:
            operator_user.set_password('password')
            operator_user.save()
            self.stdout.write('Operator user created (operador@mercadosolidario.com.br / password).')

        # 3. Seed Products
        products_data = [
            {
                'nome_produto': 'Ovos (Dúzia)',
                'categoria': 'Cesta Básica',
                'unidade_medida': 'un',
                'estoque_atual': 0.00,
                'estoque_minimo': 0.00,
                'estoque_maximo': 0.00,
                'imagem_url': 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?auto=format&fit=crop&w=120'
            },
            {
                'nome_produto': 'Arroz Agulhinha (Pacote 5kg)',
                'categoria': 'Cesta Básica',
                'unidade_medida': 'kg',
                'estoque_atual': 0.00,
                'estoque_minimo': 0.00,
                'estoque_maximo': 0.00,
                'imagem_url': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=120'
            },
            {
                'nome_produto': 'Óleo de Soja (900ml)',
                'categoria': 'Cesta Básica',
                'unidade_medida': 'un',
                'estoque_atual': 0.00,
                'estoque_minimo': 0.00,
                'estoque_maximo': 0.00,
                'imagem_url': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=120'
            },
            {
                'nome_produto': 'Feijão Carioca Tipo 1 (1kg)',
                'categoria': 'Cesta Básica',
                'unidade_medida': 'kg',
                'estoque_atual': 0.00,
                'estoque_minimo': 0.00,
                'estoque_maximo': 0.00,
                'imagem_url': 'https://images.unsplash.com/photo-1551462147-37885acc36f1?auto=format&fit=crop&w=120'
            },
            {
                'nome_produto': 'Papel Higiênico (Pct 4 rolos)',
                'categoria': 'Higiene',
                'unidade_medida': 'un',
                'estoque_atual': 0.00,
                'estoque_minimo': 0.00,
                'estoque_maximo': 0.00,
                'imagem_url': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=120'
            },
            {
                'nome_produto': 'Detergente Neutro',
                'categoria': 'Limpeza',
                'unidade_medida': 'un',
                'estoque_atual': 0.00,
                'estoque_minimo': 0.00,
                'estoque_maximo': 0.00,
                'imagem_url': 'https://images.unsplash.com/photo-1607006342411-9c140d73a0ef?auto=format&fit=crop&w=120'
            },
            {
                'nome_produto': 'Leite Integral (Caixa 1L)',
                'categoria': 'Proteínas',
                'unidade_medida': 'un',
                'estoque_atual': 0.00,
                'estoque_minimo': 0.00,
                'estoque_maximo': 0.00,
                'imagem_url': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=120'
            },
            {
                'nome_produto': 'Feijão Preto Tipo 1 (1kg)',
                'categoria': 'Cesta Básica',
                'unidade_medida': 'kg',
                'estoque_atual': 0.00,
                'estoque_minimo': 0.00,
                'estoque_maximo': 0.00,
                'imagem_url': 'https://images.unsplash.com/photo-1551462147-37885acc36f1?auto=format&fit=crop&w=120'
            },
            {
                'nome_produto': 'Frango Desfiado (Cozido)',
                'categoria': 'Proteínas',
                'unidade_medida': 'kg',
                'estoque_atual': 0.00,
                'estoque_minimo': 0.00,
                'estoque_maximo': 0.00,
                'imagem_url': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=120'
            },
            {
                'nome_produto': 'Sardinha em Lata (Coqueiro)',
                'categoria': 'Proteínas',
                'unidade_medida': 'un',
                'estoque_atual': 0.00,
                'estoque_minimo': 0.00,
                'estoque_maximo': 0.00,
                'imagem_url': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=120'
            },
            {
                'nome_produto': 'Sabonete Glicerina',
                'categoria': 'Higiene',
                'unidade_medida': 'un',
                'estoque_atual': 0.00,
                'estoque_minimo': 0.00,
                'estoque_maximo': 0.00,
                'imagem_url': 'https://images.unsplash.com/photo-1547483238-f400e65ccd56?auto=format&fit=crop&w=120'
            },
            {
                'nome_produto': 'Fralda Infantil Premium',
                'categoria': 'Higiene',
                'unidade_medida': 'un',
                'estoque_atual': 0.00,
                'estoque_minimo': 0.00,
                'estoque_maximo': 0.00,
                'imagem_url': 'https://images.unsplash.com/photo-1595244500059-d3ad51020202?auto=format&fit=crop&w=120'
            },
            {
                'nome_produto': 'Sabão em Pó Omo 1kg',
                'categoria': 'Limpeza',
                'unidade_medida': 'un',
                'estoque_atual': 0.00,
                'estoque_minimo': 0.00,
                'estoque_maximo': 0.00,
                'imagem_url': 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=120'
            }
        ]

        for p_data in products_data:
            Product.objects.get_or_create(
                nome_produto=p_data['nome_produto'],
                defaults=p_data
            )
        self.stdout.write('Products seeded.')
        
        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))
