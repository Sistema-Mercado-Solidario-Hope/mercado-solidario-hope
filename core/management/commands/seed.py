from django.core.management.base import BaseCommand

from core.models import Usuario


class Command(BaseCommand):
    help = 'Seeds initial database state for Mercado Solidário (HOPE)'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # Seed Users
        # Admin User
        admin_user, created = Usuario.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@exemplo.com',
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
            self.stdout.write('Admin user created (admin / admin).')

        # Operator User
        operator_user, created = Usuario.objects.get_or_create(
            username='operador@mercadosolidario.com.br',
            defaults={
                'email': 'operador@mercadosolidario.com.br',
                'nome_completo': 'Operador',
                'cargo': 'operador',
                'status': 'ativo',
                'is_staff': True
            }
        )
        if created:
            operator_user.set_password('password')
            operator_user.save()
            self.stdout.write('Operator user created (operador@mercadosolidario.com.br / password).')

        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))
