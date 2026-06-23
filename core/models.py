from django.contrib.auth.models import AbstractUser
from django.db import models


class Usuario(AbstractUser):
    nome_completo = models.CharField(max_length=255)
    cpf_cnpj = models.CharField(max_length=20, unique=True, null=True, blank=True)
    telefone = models.CharField(max_length=20, null=True, blank=True)
    cargo = models.CharField(max_length=50, default='doador')  # 'admin', 'colaborador', 'doador'
    status = models.CharField(max_length=20, default='ativo')  # 'ativo', 'inativo'
    data_cadastro = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'usuarios'

    def __str__(self):
        return self.nome_completo or self.username

class BeneficiaryFamily(models.Model):
    id_familia = models.AutoField(primary_key=True)
    nome_familia = models.CharField(max_length=100)
    responsavel_nome = models.CharField(max_length=255)
    cpf_nis = models.CharField(max_length=20, unique=True, null=True, blank=True)
    telefone = models.CharField(max_length=20)
    endereco = models.CharField(max_length=255, null=True, blank=True)
    numero_membros = models.IntegerField(default=1)
    status = models.CharField(max_length=20, default='ativo')  # 'ativo', 'inativo'
    data_ultima_entrega = models.DateTimeField(null=True, blank=True)
    data_cadastro = models.DateTimeField(auto_now_add=True)
    lgpd_accept = models.BooleanField(default=False)

    class Meta:
        db_table = 'familias'

    def __str__(self):
        return self.nome_familia

class Category(models.Model):
    id_categoria = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=100, unique=True)
    descricao = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'categorias'

    def __str__(self):
        return self.nome

class Product(models.Model):
    id_produto = models.AutoField(primary_key=True)
    nome_produto = models.CharField(max_length=255)
    categoria = models.ForeignKey(Category, on_delete=models.PROTECT, db_column='id_categoria', related_name='produtos')
    unidade_medida = models.CharField(max_length=10)  # Ex: kg, un, L
    estoque_atual = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    estoque_minimo = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    estoque_maximo = models.DecimalField(max_digits=10, decimal_places=2, default=1000.00)
    meta = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    imagem_url = models.CharField(max_length=255, null=True, blank=True)
    data_cadastro = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'produtos'

    def __str__(self):
        return self.nome_produto

class DonationIntake(models.Model):
    id_doacao = models.AutoField(primary_key=True)
    nome_doador = models.CharField(max_length=255)
    telefone_doador = models.CharField(max_length=20)
    id_usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_usuario')
    status_doacao = models.CharField(max_length=50, default='pendente')  # 'pendente', 'concluida', 'cancelada'
    data_registro = models.DateTimeField(auto_now_add=True)
    data_recebimento = models.DateTimeField(null=True, blank=True)
    codigo_rastreamento = models.CharField(max_length=20, unique=True)

    class Meta:
        db_table = 'doacoes_entradas'

    def __str__(self):
        return f"Doação {self.codigo_rastreamento} - {self.nome_doador}"

class DonationItem(models.Model):
    id_doacao_item = models.AutoField(primary_key=True)
    id_doacao = models.ForeignKey(DonationIntake, on_delete=models.CASCADE, db_column='id_doacao', related_name='itens')
    id_produto = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_produto')
    nome_item_personalizado = models.CharField(max_length=255, null=True, blank=True)
    quantidade = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'doacoes_itens'

    def __str__(self):
        return f"{self.quantidade} x {self.id_produto.nome_produto if self.id_produto else self.nome_item_personalizado}"

class OutboundDelivery(models.Model):
    id_entrega = models.AutoField(primary_key=True)
    id_familia = models.ForeignKey(BeneficiaryFamily, on_delete=models.RESTRICT, db_column='id_familia')
    id_usuario_operador = models.ForeignKey(Usuario, on_delete=models.RESTRICT, db_column='id_usuario_operador')
    data_entrega = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'entregas_saidas'

    def __str__(self):
        return f"Entrega {self.id_entrega} para {self.id_familia.nome_familia}"

class DeliveryItem(models.Model):
    id_entrega_item = models.AutoField(primary_key=True)
    id_entrega = models.ForeignKey(OutboundDelivery, on_delete=models.CASCADE, db_column='id_entrega', related_name='itens')
    id_produto = models.ForeignKey(Product, on_delete=models.RESTRICT, db_column='id_produto')
    quantidade = models.DecimalField(max_digits=10, decimal_places=2)
    percentual_cota_utilizada = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = 'entregas_itens'

    def __str__(self):
        return f"{self.quantidade} x {self.id_produto.nome_produto} na Entrega {self.id_entrega.id_entrega}"

class ActivityLog(models.Model):
    id_historico = models.AutoField(primary_key=True)
    id_usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='id_usuario')
    acao = models.CharField(max_length=100)  # Ex: 'LOGIN', 'AJUSTE_ESTOQUE', 'CADASTRO_FAMILIA'
    descricao = models.TextField()
    data_hora = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'historico_atividades'

    def __str__(self):
        return f"{self.acao} por {self.id_usuario.username} em {self.data_hora}"

class GlobalConfiguration(models.Model):
    telefone_contato = models.CharField(max_length=20, default='554732073009')
    cep_instituicao = models.CharField(max_length=10, default='89205-000')
    endereco_instituicao = models.CharField(max_length=255, default='Rua Aubé, 895 – Boa Vista, Joinville/SC')
    pix_key = models.CharField(max_length=255, default='joinville@ondadura.com')
    qr_code_image = models.TextField(blank=True)  # base64 string or image URL
    cnpj = models.CharField(max_length=20, default='22788440000198')
    email_contato = models.CharField(max_length=255, default='contato@ondadura.com')
    instagram_link = models.CharField(max_length=255, default='https://www.instagram.com/ondadura/')

    class Meta:
        db_table = 'global_configuration'

    def __str__(self):
        return "Configuração Global do Sistema"
