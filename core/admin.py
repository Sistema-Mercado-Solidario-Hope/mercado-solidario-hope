from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from core.models import (
    ActivityLog,
    BeneficiaryFamily,
    Category,
    DeliveryItem,
    DonationIntake,
    DonationItem,
    GlobalConfiguration,
    OutboundDelivery,
    Product,
    Usuario,
)


# Custom User Admin
@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ('username', 'email', 'nome_completo', 'cargo', 'status', 'is_staff', 'is_superuser')
    list_filter = ('cargo', 'status', 'is_staff', 'is_superuser', 'is_active')
    fieldsets = UserAdmin.fieldsets + (
        ('Informações do Mercado Solidário', {'fields': ('nome_completo', 'cpf_cnpj', 'telefone', 'cargo', 'status')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Informações do Mercado Solidário', {'fields': ('nome_completo', 'cpf_cnpj', 'telefone', 'cargo', 'status')}),
    )
    search_fields = ('username', 'email', 'nome_completo', 'cpf_cnpj')
    ordering = ('username',)

# Beneficiary Families
@admin.register(BeneficiaryFamily)
class BeneficiaryFamilyAdmin(admin.ModelAdmin):
    list_display = ('nome_familia', 'responsavel_nome', 'cpf', 'nis', 'telefone', 'status', 'data_ultima_entrega', 'lgpd_accept')
    list_filter = ('status', 'lgpd_accept', 'data_cadastro')
    search_fields = ('nome_familia', 'responsavel_nome', 'cpf', 'nis', 'telefone')
    ordering = ('nome_familia',)

# Categories
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('nome', 'descricao')
    search_fields = ('nome',)
    ordering = ('nome',)

# Products
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('nome_produto', 'categoria', 'unidade_medida', 'estoque_atual', 'estoque_minimo', 'estoque_maximo')
    list_filter = ('categoria__nome', 'unidade_medida')
    search_fields = ('nome_produto', 'categoria__nome')
    ordering = ('nome_produto',)

# Donation Items Inline
class DonationItemInline(admin.TabularInline):
    model = DonationItem
    extra = 0

# Donation Intake
@admin.register(DonationIntake)
class DonationIntakeAdmin(admin.ModelAdmin):
    list_display = ('codigo_rastreamento', 'nome_doador', 'telefone_doador', 'status_doacao', 'data_registro', 'data_recebimento')
    list_filter = ('status_doacao', 'data_registro')
    search_fields = ('codigo_rastreamento', 'nome_doador', 'telefone_doador')
    inlines = [DonationItemInline]
    ordering = ('-data_registro',)

# Delivery Items Inline
class DeliveryItemInline(admin.TabularInline):
    model = DeliveryItem
    extra = 0

# Outbound Delivery
@admin.register(OutboundDelivery)
class OutboundDeliveryAdmin(admin.ModelAdmin):
    list_display = ('id_entrega', 'id_familia', 'id_usuario_operador', 'data_entrega')
    list_filter = ('data_entrega',)
    search_fields = ('id_familia__nome_familia', 'id_usuario_operador__nome_completo', 'id_usuario_operador__username')
    inlines = [DeliveryItemInline]
    ordering = ('-data_entrega',)

# Activity Logs
@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('id_historico', 'id_usuario', 'acao', 'descricao', 'data_hora')
    list_filter = ('acao', 'data_hora')
    search_fields = ('id_usuario__username', 'id_usuario__nome_completo', 'acao', 'descricao')
    ordering = ('-data_hora',)

# Global System Configuration
@admin.register(GlobalConfiguration)
class GlobalConfigurationAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'telefone_contato', 'pix_key', 'cnpj', 'email_contato', 'instagram_link')

    def has_add_permission(self, request):
        # Prevent creating multiple configurations (only one row is allowed)
        return not GlobalConfiguration.objects.exists()

    def has_delete_permission(self, request, obj=None):
        # Prevent deleting the configuration
        return False
