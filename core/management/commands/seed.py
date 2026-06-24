from django.core.management.base import BaseCommand

from core.models import Usuario, GlobalConfiguration


class Command(BaseCommand):
    help = 'Seeds initial database state for Mercado Solidário (HOPE)'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # Seed Users
        # Admin User
        admin_user, created = Usuario.objects.get_or_create(
            username='admin@mercadosolidario.com',
            defaults={
                'email': 'admin@mercadosolidario.com',
                'nome_completo': 'Administrador do Sistema',
                'cargo': 'admin',
                'status': 'ativo',
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin_user.set_password('admin')
            admin_user.save()
            self.stdout.write('Admin user created (admin@mercadosolidario.com / admin).')

        # Operator User
        operator_user, created = Usuario.objects.get_or_create(
            username='operador@mercadosolidario.com',
            defaults={
                'email': 'operador@mercadosolidario.com',
                'nome_completo': 'Operador',
                'cargo': 'operador',
                'status': 'ativo',
                'is_staff': True
            }
        )
        if created:
            operator_user.set_password('password')
            operator_user.save()
            self.stdout.write('Operator user created (operador@mercadosolidario.com / password).')

        # Seed Global Configuration
        config, created = GlobalConfiguration.objects.get_or_create(
            id=1,
            defaults={
                'telefone_contato': '554732073009',
                'cep_instituicao': '89205-000',
                'endereco_instituicao': 'Rua Aubé, 895 – Boa Vista, Joinville/SC',
                'pix_key': 'joinville@ondadura.com',
                'cnpj': '22788440000198',
                'email_contato': 'contato@ondadura.com',
                'instagram_link': 'https://www.instagram.com/ondadura/'
            }
        )
        if created:
            self.stdout.write('Global configurations seeded.')

        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))
