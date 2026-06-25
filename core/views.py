import base64
import json
import os
import random
import string
import uuid
from decimal import Decimal
from functools import wraps

from django.conf import settings
from django.core.signing import BadSignature, Signer
from django.db import models, transaction
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import render
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

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

signer = Signer()

# Helper functions for custom Token Authentication
def generate_token(user):
    return signer.sign(str(user.id))

def get_user_from_token(token):
    try:
        user_id = signer.unsign(token)
        return Usuario.objects.get(id=user_id)
    except (BadSignature, Usuario.DoesNotExist):
        return None

def save_base64_image(base64_str):
    if not base64_str or not isinstance(base64_str, str):
        return base64_str
    if not base64_str.startswith('data:image/'):
        return base64_str
    try:
        header, base64_data = base64_str.split(';base64,')
        ext = header.split('/')[-1]
        if ext == 'jpeg':
            ext = 'jpg'
        ext = ext.split(';')[0]
        image_data = base64.b64decode(base64_data)
        upload_dir = os.path.join(settings.BASE_DIR, 'core', 'static', 'img', 'uploads')
        os.makedirs(upload_dir, exist_ok=True)
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join(upload_dir, filename)
        with open(filepath, 'wb') as f:
            f.write(image_data)
        return f"/img/uploads/{filename}"
    except Exception as e:
        print(f"Error saving base64 image: {e}")
        return base64_str

# Auth decorator for API views
def api_auth_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'erro': 'Não autorizado'}, status=401)
        token = auth_header.split(' ')[1]
        user = get_user_from_token(token)
        if not user or user.status == 'inativo':
            return JsonResponse({'erro': 'Não autorizado'}, status=401)
        request.user = user
        return view_func(request, *args, **kwargs)
    return _wrapped_view

# ==================== PAGE VIEWS ====================
def home_view(request):
    return render(request, 'home.html')

def vitrine_view(request):
    return render(request, 'vitrine-necessidade.html')

def intencao_doacao_view(request):
    return render(request, 'intencao-doacao.html')

def sucesso_view(request):
    return render(request, 'sucesso.html')

def login_view(request):
    return render(request, 'login.html')

def contato_view(request):
    return render(request, 'contato.html')

def perfil_view(request):
    return render(request, 'perfil.html')

def gestao_estoque_view(request):
    return render(request, 'gestao-estoque.html')

def visao_geral_view(request):
    return render(request, 'visao-geral-estoque.html')

def inserir_estoque_view(request):
    return render(request, 'inserir-estoque.html')

def validar_intencoes_view(request):
    return render(request, 'validar-intencoes.html')

def frente_caixa_view(request):
    return render(request, 'frente-caixa.html')

def cadastro_familia_view(request):
    return render(request, 'cadastro-familia.html')

def familia_listagem_view(request):
    return render(request, 'familia-listagem.html')

def cadastro_produto_view(request):
    return render(request, 'cadastro-produto.html')

def configuracoes_view(request):
    return render(request, 'configuracoes.html')

def admin_view(request):
    return render(request, 'admin.html')

def metas_produtos_view(request):
    return render(request, 'metas-produtos.html')

def base_view(request):
    return render(request, 'base.html')



# ==================== AUTH API ====================
@csrf_exempt
def api_login(request):
    if request.method != 'POST':
        return JsonResponse({'erro': 'Método não permitido'}, status=405)

    try:
        data = json.loads(request.body)
        identificador = data.get('identificador', '').strip()
        senha = data.get('senha', '')

        if not identificador or not senha:
            return JsonResponse({'erro': 'Identificador e senha são obrigatórios'}, status=400)

        # Procura por email ou por CPF/CNPJ
        user = Usuario.objects.filter(Q(email=identificador) | Q(cpf_cnpj=identificador)).first()

        if user and user.check_password(senha):
            if user.status == 'inativo':
                return JsonResponse({'erro': 'Usuário inativo'}, status=403)

            token = generate_token(user)
            # Registrar log
            ActivityLog.objects.create(
                id_usuario=user,
                acao='LOGIN',
                descricao='Usuário realizou login com sucesso'
            )
            return JsonResponse({
                'token': token,
                'usuario': {
                    'id': user.id,
                    'nome': user.nome_completo,
                    'tipo': user.cargo
                }
            })

        return JsonResponse({'erro': 'Credenciais inválidas. Use admin@mercadosolidario.com / admin'}, status=401)
    except Exception as e:
        return JsonResponse({'erro': str(e)}, status=500)

@csrf_exempt
@api_auth_required
def api_usuario_perfil(request):
    user = request.user
    if request.method == 'GET':
        return JsonResponse({
            'id': user.id,
            'nome_completo': user.nome_completo,
            'email': user.email,
            'cpf_cnpj': user.cpf_cnpj,
            'telefone': user.telefone,
            'cargo': user.cargo,
            'status': user.status
        })

    elif request.method in ['PUT', 'PATCH']:
        try:
            data = json.loads(request.body)
            nome_completo = data.get('nome_completo')
            telefone = data.get('telefone')
            senha_atual = data.get('senha_atual')
            nova_senha = data.get('nova_senha')

            # Se tentar atualizar a senha
            if senha_atual and nova_senha:
                if not user.check_password(senha_atual):
                    return JsonResponse({'erro': 'Senha atual incorreta'}, status=400)
                user.set_password(nova_senha)

            if nome_completo:
                user.nome_completo = nome_completo.strip()
            if telefone:
                user.telefone = telefone.strip()

            user.save()

            ActivityLog.objects.create(
                id_usuario=user,
                acao='ATUALIZA_PERFIL',
                descricao='Usuário atualizou dados do perfil'
            )
            return JsonResponse({
                'id': user.id,
                'nome_completo': user.nome_completo,
                'email': user.email,
                'telefone': user.telefone
            })
        except Exception as e:
            return JsonResponse({'erro': str(e)}, status=500)

    return JsonResponse({'erro': 'Método não permitido'}, status=405)


# ==================== PRODUCTS API ====================
@csrf_exempt
def api_produtos(request):
    if request.method == 'GET':
        categoria = request.GET.get('categoria')
        query = Product.objects.select_related('categoria').all()
        if categoria:
            # Normalizar categoria para busca
            query = query.filter(categoria__nome__iexact=categoria.replace('_', ' '))

        produtos_list = []
        for p in query:
            produtos_list.append({
                'id': p.id_produto,
                'nome': p.nome_produto,
                'name': p.nome_produto,
                'categoria': p.categoria.nome,
                'category': p.categoria.nome,
                'unidade': p.unidade_medida,
                'unidade_medida': p.unidade_medida,
                'quantidade': float(p.estoque_atual),
                'quantityEstoque': float(p.estoque_atual),
                'estoque_atual': float(p.estoque_atual),
                'estoqueMinimo': float(p.estoque_minimo),
                'estoque_minimo': float(p.estoque_minimo),
                'estoque_maximo': float(p.estoque_maximo),
                'esgotado': p.estoque_atual <= 0,
                'estoqueCritico': p.estoque_atual <= p.estoque_minimo,
                'foto': p.imagem_url or '',
                'meta': float(p.meta),
                'description': f"Lote: {p.id_produto} - Cadastrado",
            })
        return JsonResponse({'produtos': produtos_list})

    elif request.method == 'POST':
        # Requer autenticação para criar
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return JsonResponse({'erro': 'Não autorizado'}, status=401)
        user = get_user_from_token(auth_header.split(' ')[1])
        if not user or user.cargo != 'admin':
            return JsonResponse({'erro': 'Apenas administradores podem cadastrar produtos'}, status=403)

        try:
            data = json.loads(request.body)
            nome_produto = data.get('nome') or data.get('nome_produto')
            categoria = data.get('categoria')
            unidade_medida = data.get('unidade') or data.get('unidade_medida')
            estoque_atual = data.get('quantidade') or data.get('estoque_atual') or 0.00
            estoque_minimo = data.get('estoqueMinimo') or data.get('estoque_minimo') or 0.00
            estoque_maximo = data.get('estoque_maximo') or 1000.00
            meta = data.get('meta') or 0.00
            imagem_url = data.get('imagem_url') or data.get('foto')

            if not nome_produto or not categoria or not unidade_medida:
                return JsonResponse({'erro': 'Campos obrigatórios ausentes'}, status=400)

            if imagem_url:
                imagem_url = save_base64_image(imagem_url)

            category_obj, _ = Category.objects.get_or_create(nome=categoria.strip())
            p = Product.objects.create(
                nome_produto=nome_produto.strip(),
                categoria=category_obj,
                unidade_medida=unidade_medida.strip(),
                estoque_atual=float(estoque_atual),
                estoque_minimo=float(estoque_minimo),
                estoque_maximo=float(estoque_maximo),
                meta=float(meta),
                imagem_url=imagem_url
            )

            ActivityLog.objects.create(
                id_usuario=user,
                acao='CADASTRO_PRODUTO',
                descricao=f'Produto {p.nome_produto} cadastrado com estoque inicial de {p.estoque_atual}'
            )

            return JsonResponse({
                'id': p.id_produto,
                'nome': p.nome_produto,
                'quantidade': float(p.estoque_atual)
            }, status=201)
        except Exception as e:
            return JsonResponse({'erro': str(e)}, status=500)

    return JsonResponse({'erro': 'Método não permitido'}, status=405)

@csrf_exempt
def api_produto_detail(request, pk):
    try:
        p = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return JsonResponse({'erro': 'Produto não encontrado'}, status=404)

    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return JsonResponse({'erro': 'Não autorizado'}, status=401)
    user = get_user_from_token(auth_header.split(' ')[1])
    if not user:
        return JsonResponse({'erro': 'Não autorizado'}, status=401)

    if request.method in ['PUT', 'PATCH']:
        if user.cargo != 'admin':
            return JsonResponse({'erro': 'Apenas administradores podem alterar produtos'}, status=403)

        try:
            data = json.loads(request.body)
            nome = data.get('nome') or data.get('nome_produto')
            categoria = data.get('categoria')
            unidade = data.get('unidade') or data.get('unidade_medida')
            estoque_minimo = data.get('estoqueMinimo') or data.get('estoque_minimo')
            estoque_atual = data.get('quantidade') or data.get('estoque_atual')
            meta = data.get('meta')
            imagem_url = data.get('imagem_url') or data.get('foto')

            if nome:
                p.nome_produto = nome.strip()
            if categoria:
                category_obj, _ = Category.objects.get_or_create(nome=categoria.strip())
                p.categoria = category_obj
            if unidade:
                p.unidade_medida = unidade.strip()
            if estoque_minimo is not None:
                p.estoque_minimo = float(estoque_minimo)
            if estoque_atual is not None:
                p.estoque_atual = float(estoque_atual)
            if meta is not None:
                p.meta = float(meta)
            if imagem_url is not None:
                p.imagem_url = save_base64_image(imagem_url)

            p.save()

            ActivityLog.objects.create(
                id_usuario=user,
                acao='EDICAO_PRODUTO',
                descricao=f'Produto {p.nome_produto} atualizado.'
            )
            return JsonResponse({
                'id': p.id_produto,
                'nome': p.nome_produto,
                'quantidade': float(p.estoque_atual)
            })
        except Exception as e:
            return JsonResponse({'erro': str(e)}, status=500)

    elif request.method == 'DELETE':
        if user.cargo != 'admin':
            return JsonResponse({'erro': 'Apenas administradores podem excluir produtos'}, status=403)

        nome_prod = p.nome_produto
        p.delete()
        ActivityLog.objects.create(
            id_usuario=user,
            acao='EXCLUSAO_PRODUTO',
            descricao=f'Produto {nome_prod} excluído permanentemente.'
        )
        return JsonResponse({'sucesso': True})

    return JsonResponse({'erro': 'Método não permitido'}, status=405)

@csrf_exempt
@api_auth_required
def api_produto_quantidade(request, pk):
    if request.method != 'PATCH':
        return JsonResponse({'erro': 'Método não permitido'}, status=405)

    try:
        p = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return JsonResponse({'erro': 'Produto não encontrado'}, status=404)

    try:
        data = json.loads(request.body)
        quantidade = data.get('quantidade')

        if quantidade is None:
            return JsonResponse({'erro': 'Quantidade é obrigatória'}, status=400)

        antiga_qtd = p.estoque_atual
        p.estoque_atual = max(0.00, float(quantidade))
        p.save()

        ActivityLog.objects.create(
            id_usuario=request.user,
            acao='AJUSTE_ESTOQUE',
            descricao=f'Quantidade de {p.nome_produto} ajustada de {antiga_qtd} para {p.estoque_atual}'
        )

        return JsonResponse({
            'produto': {
                'id': p.id_produto,
                'quantidade_estoque': float(p.estoque_atual)
            }
        })
    except Exception as e:
        return JsonResponse({'erro': str(e)}, status=500)


# ==================== BENEFICIARIES API ====================
@csrf_exempt
@api_auth_required
def api_beneficiarios(request):
    if request.method == 'GET':
        query = BeneficiaryFamily.objects.all()
        beneficiarios_list = []
        for f in query:
            last_delivery_days = None
            if f.data_ultima_entrega:
                last_delivery_days = (timezone.now() - f.data_ultima_entrega).days

            beneficiarios_list.append({
                'id': f.id_familia,
                'nome': f.nome_familia,
                'name': f.nome_familia,
                'nomeFamilia': f.nome_familia,
                'responsavel': f.responsavel_nome,
                'responsavel_nome': f.responsavel_nome,
                'telefone': f.telefone,
                'endereco': f.endereco or '',
                'numMembros': f.numero_membros,
                'members': f.numero_membros,
                'qtdIntegrantes': f.numero_membros,
                'status': 'ACTIVE' if f.status == 'ativo' else 'INACTIVE',
                'status_pt': f.status,
                'cpf_nis': f.cpf_nis or '',
                'cpf': f.cpf_nis or '',
                'nis': f.cpf_nis or '',
                'lastDeliveryDays': last_delivery_days,
                'ultimaParticipacao': f.data_ultima_entrega.strftime('%Y-%m-%d') if f.data_ultima_entrega else '—'
            })
        return JsonResponse({'beneficiarios': beneficiarios_list})

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            nome_familia = data.get('nome') or data.get('nomeFamilia')
            responsavel_nome = data.get('responsavel') or data.get('responsavel_nome')
            cpf_nis = data.get('cpf_nis') or data.get('nis') or data.get('cpf')
            telefone = data.get('telefone')
            endereco = data.get('endereco')
            numero_membros = data.get('numMembros') or data.get('members') or 1
            status = data.get('status') or 'ativo'
            lgpd_accept = data.get('lgpd_accept') or data.get('lgpdConsent') or False

            # Sanitiza nome_familia para prefixar 'Família ' se não tiver
            if nome_familia and not nome_familia.lower().startswith('família'):
                nome_familia = f"Família {nome_familia}"

            if not nome_familia or not responsavel_nome or not telefone or not cpf_nis or not endereco:
                return JsonResponse({'erro': 'Nome da família, responsável, telefone, CPF/NIS e endereço são obrigatórios'}, status=400)

            # Verifica LGPD
            if not lgpd_accept:
                return JsonResponse({'erro': 'Aceite da política de proteção de dados (LGPD) é obrigatório'}, status=400)

            if cpf_nis and BeneficiaryFamily.objects.filter(cpf_nis=cpf_nis).exists():
                return JsonResponse({'erro': 'CPF/NIS já cadastrado para outra família'}, status=409)

            f = BeneficiaryFamily.objects.create(
                nome_familia=nome_familia.strip(),
                responsavel_nome=responsavel_nome.strip(),
                cpf_nis=cpf_nis.strip() if cpf_nis else None,
                telefone=telefone.strip(),
                endereco=endereco.strip() if endereco else None,
                numero_membros=int(numero_membros),
                status=status.lower(),
                lgpd_accept=True
            )

            ActivityLog.objects.create(
                id_usuario=request.user,
                acao='CADASTRO_FAMILIA',
                descricao=f'Família {f.nome_familia} cadastrada com sucesso.'
            )
            return JsonResponse({'id': f.id_familia, 'nome': f.nome_familia}, status=201)
        except Exception as e:
            return JsonResponse({'erro': str(e)}, status=500)

    return JsonResponse({'erro': 'Método não permitido'}, status=405)

@csrf_exempt
@api_auth_required
def api_beneficiarios_busca(request):
    if request.method != 'GET':
        return JsonResponse({'erro': 'Método não permitido'}, status=405)

    q = request.GET.get('q', '').strip()

    query = BeneficiaryFamily.objects.all()
    if q:
        # Busca por nome da família, CPF/NIS, ou responsável
        query = query.filter(
            Q(nome_familia__icontains=q) |
            Q(cpf_nis__icontains=q) |
            Q(responsavel_nome__icontains=q)
        )

    beneficiarios_list = []
    for f in query:
        last_delivery_days = None
        if f.data_ultima_entrega:
            last_delivery_days = (timezone.now() - f.data_ultima_entrega).days

        beneficiarios_list.append({
            'id': f.id_familia,
            'nome': f.nome_familia,
            'name': f.nome_familia,
            'nomeFamilia': f.nome_familia,
            'responsavel': f.responsavel_nome,
            'responsavel_nome': f.responsavel_nome,
            'telefone': f.telefone,
            'endereco': f.endereco or '',
            'numMembros': f.numero_membros,
            'members': f.numero_membros,
            'qtdIntegrantes': f.numero_membros,
            'status': 'ACTIVE' if f.status == 'ativo' else 'INACTIVE',
            'status_pt': f.status,
            'cpf_nis': f.cpf_nis or '',
            'cpf': f.cpf_nis or '',
            'nis': f.cpf_nis or '',
            'lastDeliveryDays': last_delivery_days,
            'ultimaParticipacao': f.data_ultima_entrega.strftime('%Y-%m-%d') if f.data_ultima_entrega else '—'
        })
    return JsonResponse({'beneficiarios': beneficiarios_list})

@csrf_exempt
@api_auth_required
def api_beneficiario_detail(request, pk):
    try:
        f = BeneficiaryFamily.objects.get(pk=pk)
    except BeneficiaryFamily.DoesNotExist:
        return JsonResponse({'erro': 'Beneficiário não encontrado'}, status=404)

    if request.method == 'GET':
        last_delivery_days = None
        if f.data_ultima_entrega:
            last_delivery_days = (timezone.now() - f.data_ultima_entrega).days

        return JsonResponse({
            'id': f.id_familia,
            'nome': f.nome_familia,
            'name': f.nome_familia,
            'nomeFamilia': f.nome_familia,
            'responsavel': f.responsavel_nome,
            'responsavel_nome': f.responsavel_nome,
            'telefone': f.telefone,
            'endereco': f.endereco or '',
            'numMembros': f.numero_membros,
            'members': f.numero_membros,
            'qtdIntegrantes': f.numero_membros,
            'status': 'ACTIVE' if f.status == 'ativo' else 'INACTIVE',
            'status_pt': f.status,
            'cpf_nis': f.cpf_nis or '',
            'cpf': f.cpf_nis or '',
            'nis': f.cpf_nis or '',
            'lastDeliveryDays': last_delivery_days,
            'elegivel': f.status == 'ativo',
            'cotaPercent': 0  # mock/calculated
        })

    elif request.method in ['PUT', 'PATCH']:
        try:
            data = json.loads(request.body)
            nome_familia = data.get('nome') or data.get('nomeFamilia')
            responsavel_nome = data.get('responsavel') or data.get('responsavel_nome')
            cpf_nis = data.get('cpf_nis') or data.get('nis') or data.get('cpf')
            telefone = data.get('telefone')
            endereco = data.get('endereco')
            numero_membros = data.get('numMembros') or data.get('members')
            status = data.get('status')

            if 'nome' in data or 'nomeFamilia' in data:
                if not nome_familia or not nome_familia.strip():
                    return JsonResponse({'erro': 'Nome da família é obrigatório'}, status=400)
                if not nome_familia.lower().startswith('família'):
                    nome_familia = f"Família {nome_familia}"
                f.nome_familia = nome_familia.strip()
            if 'responsavel' in data or 'responsavel_nome' in data:
                if not responsavel_nome or not responsavel_nome.strip():
                    return JsonResponse({'erro': 'Responsável é obrigatório'}, status=400)
                f.responsavel_nome = responsavel_nome.strip()
            if 'cpf_nis' in data or 'nis' in data or 'cpf' in data:
                if not cpf_nis or not cpf_nis.strip():
                    return JsonResponse({'erro': 'CPF/NIS é obrigatório'}, status=400)
                # Verifica duplicidade
                if BeneficiaryFamily.objects.filter(cpf_nis=cpf_nis.strip()).exclude(pk=f.pk).exists():
                    return JsonResponse({'erro': 'CPF/NIS já cadastrado para outra família'}, status=409)
                f.cpf_nis = cpf_nis.strip()
            if 'telefone' in data:
                if not telefone or not telefone.strip():
                    return JsonResponse({'erro': 'Telefone é obrigatório'}, status=400)
                f.telefone = telefone.strip()
            if 'endereco' in data:
                if not endereco or not endereco.strip():
                    return JsonResponse({'erro': 'Endereço é obrigatório'}, status=400)
                f.endereco = endereco.strip()
            if numero_membros is not None:
                f.numero_membros = int(numero_membros)
            if status:
                f.status = status.lower() if status.lower() in ['ativo', 'inativo'] else f.status

            f.save()
            ActivityLog.objects.create(
                id_usuario=request.user,
                acao='EDICAO_FAMILIA',
                descricao=f'Cadastro da família {f.nome_familia} atualizado.'
            )
            return JsonResponse({'id': f.id_familia, 'nome': f.nome_familia})
        except Exception as e:
            return JsonResponse({'erro': str(e)}, status=500)

    elif request.method == 'DELETE':
        if request.user.cargo != 'admin':
            return JsonResponse({'erro': 'Apenas administradores podem excluir cadastros'}, status=403)

        nome_fam = f.nome_familia
        f.delete()
        ActivityLog.objects.create(
            id_usuario=request.user,
            acao='EXCLUSAO_FAMILIA',
            descricao=f'Família {nome_fam} excluída permanentemente.'
        )
        return JsonResponse({'sucesso': True})

    return JsonResponse({'erro': 'Método não permitido'}, status=405)


# ==================== DELIVERIES API (CHECOUT) ====================
@csrf_exempt
@api_auth_required
def api_entregas_confirmar(request):
    if request.method != 'POST':
        return JsonResponse({'erro': 'Método não permitido'}, status=405)

    try:
        data = json.loads(request.body)
        beneficiario_id = data.get('beneficiario_id')
        itens = data.get('itens', [])

        if not beneficiario_id or not itens:
            return JsonResponse({'erro': 'Beneficiário e itens são obrigatórios'}, status=400)

        try:
            family = BeneficiaryFamily.objects.get(pk=beneficiario_id)
        except BeneficiaryFamily.DoesNotExist:
            return JsonResponse({'erro': 'Beneficiário não encontrado'}, status=422)

        if family.status != 'ativo':
            return JsonResponse({'erro': 'Beneficiário inativo ou não elegível'}, status=422)

        # Atomically check and update stock levels to prevent corruption/concurrency issues
        with transaction.atomic():
            # 1. Verification phase (ensure positive stock levels - RN001)
            verified_items = []
            for item in itens:
                prod_id = item.get('produto_id')
                quantidade = Decimal(str(item.get('quantidade', 0)))

                if quantidade <= 0:
                    continue

                try:
                    product = Product.objects.get(pk=prod_id)
                except Product.DoesNotExist:
                    return JsonResponse({'erro': f'Produto ID {prod_id} não catalogado'}, status=422)

                if product.estoque_atual < quantidade:
                    return JsonResponse({'erro': f'Estoque insuficiente para {product.nome_produto}. Saldo: {product.estoque_atual} {product.unidade_medida}'}, status=422)

                verified_items.append((product, quantidade))

            if not verified_items:
                return JsonResponse({'erro': 'Carrinho vazio ou quantidades zeradas'}, status=400)

            # 2. Saving phase
            delivery = OutboundDelivery.objects.create(
                id_familia=family,
                id_usuario_operador=request.user
            )

            total_items = 0
            for product, qty in verified_items:
                # Decrement stock count
                product.estoque_atual = product.estoque_atual - qty
                product.save()

                # Create delivery transaction ledger item
                DeliveryItem.objects.create(
                    id_entrega=delivery,
                    id_produto=product,
                    quantidade=qty,
                    percentual_cota_utilizada=None  # Can be calculated if limits exist
                )
                total_items += qty

            # 3. Update family's last delivery date
            family.data_ultima_entrega = timezone.now()
            family.save()

            # 4. Activity logging
            ActivityLog.objects.create(
                id_usuario=request.user,
                acao='DISTRIBUICAO',
                descricao=f'Entrega registrada para {family.nome_familia}. Total de itens: {total_items}'
            )

        return JsonResponse({
            'entrega': {
                'id': f"del-{delivery.id_entrega}",
                'data': delivery.data_entrega.isoformat(),
                'beneficiario': family.nome_familia,
                'total_itens': total_items
            }
        }, status=201)

    except Exception as e:
        return JsonResponse({'erro': str(e)}, status=500)


# ==================== CONFIGURATIONS API ====================
@csrf_exempt
def api_configuracoes(request):
    config = GlobalConfiguration.objects.first()
    if not config:
        config = GlobalConfiguration.objects.create(id=1)

    if request.method == 'GET':
        return JsonResponse({
            'telefone_contato': config.telefone_contato,
            'endereco_instituicao': config.endereco_instituicao,
            'cep_instituicao': config.cep_instituicao,
            'pix_key': config.pix_key,
            'cnpj': config.cnpj,
            'email_contato': config.email_contato,
            'instagram_link': config.instagram_link,
            'qr_code_image': config.qr_code_image
        })

    elif request.method == 'POST':
        # Requer autenticação
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return JsonResponse({'erro': 'Não autorizado'}, status=401)
        user = get_user_from_token(auth_header.split(' ')[1])
        if not user or user.cargo != 'admin':
            return JsonResponse({'erro': 'Apenas administradores podem atualizar configurações'}, status=403)

        try:
            data = json.loads(request.body)
            config.telefone_contato = data.get('telefone_contato', config.telefone_contato)
            config.endereco_instituicao = data.get('endereco_instituicao', config.endereco_instituicao)
            config.cep_instituicao = data.get('cep_instituicao', config.cep_instituicao)
            config.pix_key = data.get('pix_key', config.pix_key)
            config.cnpj = data.get('cnpj', config.cnpj)
            config.email_contato = data.get('email_contato', config.email_contato)
            config.instagram_link = data.get('instagram_link', config.instagram_link)
            config.qr_code_image = data.get('qr_code_image', config.qr_code_image)
            config.save()

            ActivityLog.objects.create(
                id_usuario=user,
                acao='ATUALIZA_CONFIG',
                descricao='Configurações globais do sistema atualizadas'
            )
            return JsonResponse({'sucesso': True})
        except Exception as e:
            return JsonResponse({'erro': str(e)}, status=500)

    return JsonResponse({'erro': 'Método não permitido'}, status=405)


# ==================== ACTIVITY HISTORY API ====================
@csrf_exempt
@api_auth_required
def api_historico(request):
    if request.method == 'GET':
        # Retorna o histórico ordenado pelo mais recente
        logs = ActivityLog.objects.all().order_by('-data_hora')[:100]
        logs_list = []
        for l in logs:
            logs_list.append({
                'id': l.id_historico,
                'usuario': l.id_usuario.nome_completo or l.id_usuario.username,
                'acao': l.acao,
                'descricao': l.descricao,
                'data_hora': l.data_hora.strftime('%d/%m/%Y %H:%M:%S'),
                'time': l.data_hora.isoformat()
            })
        return JsonResponse({'historico': logs_list})

    elif request.method == 'DELETE':
        if request.user.cargo != 'admin':
            return JsonResponse({'erro': 'Apenas administradores podem limpar o histórico de atividades'}, status=403)
        ActivityLog.objects.all().delete()
        ActivityLog.objects.create(
            id_usuario=request.user,
            acao='LIMPEZA_HISTORICO',
            descricao='Todo o histórico de atividades foi limpo.'
        )
        return JsonResponse({'sucesso': True})

    return JsonResponse({'erro': 'Método não permitido'}, status=405)


# ==================== DONATION INTENTIONS API ====================
@csrf_exempt
def api_intencao_doacao(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            doador = data.get('doador', {})
            nome = doador.get('nome', '').strip()
            telefone = doador.get('telefone', '').strip()
            itens = data.get('itens', [])
            status = data.get('status', 'pendente')

            if not nome or not telefone or not itens:
                return JsonResponse({'erro': 'Dados do doador e lista de itens são obrigatórios'}, status=400)

            if status not in ['pendente', 'concluida']:
                return JsonResponse({'erro': 'Status inválido'}, status=400)

            # Validar que todos os itens referenciam produtos cadastrados
            validated_items = []
            for item in itens:
                prod_id = item.get('id')
                quantidade = float(item.get('quantidade', 0))
                if not prod_id:
                    return JsonResponse({'erro': 'Todos os itens devem estar cadastrados no sistema'}, status=400)
                if quantidade <= 0:
                    return JsonResponse({'erro': 'A quantidade de cada item deve ser maior que zero'}, status=400)
                try:
                    product = Product.objects.get(pk=prod_id)
                    validated_items.append((product, quantidade))
                except Product.DoesNotExist:
                    return JsonResponse({'erro': f'Produto com ID {prod_id} não está cadastrado'}, status=400)

            user = None
            if status == 'concluida':
                auth_header = request.headers.get('Authorization')
                if not auth_header or not auth_header.startswith('Bearer '):
                    return JsonResponse({'erro': 'Não autorizado'}, status=401)
                token = auth_header.split(' ')[1]
                user = get_user_from_token(token)
                if not user or user.status == 'inativo' or user.cargo not in ['admin', 'colaborador', 'operador']:
                    return JsonResponse({'erro': 'Não autorizado'}, status=401)

            # Gerar código de rastreamento doação
            ano = timezone.now().year
            rand = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
            tracking_code = f"#DOA-{ano}-{rand}"

            with transaction.atomic():
                donation = DonationIntake.objects.create(
                    nome_doador=nome,
                    telefone_doador=telefone,
                    status_doacao=status,
                    codigo_rastreamento=tracking_code,
                    id_usuario=user if status == 'concluida' else None,
                    data_recebimento=timezone.now() if status == 'concluida' else None
                )

                for product, quantidade in validated_items:
                    DonationItem.objects.create(
                        id_doacao=donation,
                        id_produto=product,
                        nome_item_personalizado=None,
                        quantidade=quantidade
                    )

                    if status == 'concluida':
                        product.estoque_atual += Decimal(str(quantidade))
                        product.save()

                if status == 'concluida':
                    ActivityLog.objects.create(
                        id_usuario=user,
                        acao='ENTRADA_ESTOQUE_DIRETA',
                        descricao=f'Entrada direta de estoque registrada via doação {donation.codigo_rastreamento}.'
                    )

            return JsonResponse({
                'sucesso': True,
                'codigo_rastreamento': tracking_code
            }, status=201)

        except Exception as e:
            return JsonResponse({'erro': str(e)}, status=500)

    elif request.method == 'GET':
        # Requer autenticação
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return JsonResponse({'erro': 'Não autorizado'}, status=401)
        user = get_user_from_token(auth_header.split(' ')[1])
        if not user:
            return JsonResponse({'erro': 'Não autorizado'}, status=401)

        intentions = DonationIntake.objects.all().order_by('-data_registro')
        intentions_list = []
        for d in intentions:
            itens_query = DonationItem.objects.filter(id_doacao=d)
            itens_list = []
            for item in itens_query:
                itens_list.append({
                    'id': item.id_produto.id_produto if item.id_produto else None,
                    'produto_nome': item.id_produto.nome_produto if item.id_produto else item.nome_item_personalizado,
                    'quantidade': float(item.quantidade),
                    'unidade': item.id_produto.unidade_medida if item.id_produto else 'un'
                })

            intentions_list.append({
                'id': d.id_doacao,
                'nome_doador': d.nome_doador,
                'telefone_doador': d.telefone_doador,
                'status': d.status_doacao,
                'data_registro': d.data_registro.strftime('%d/%m/%Y'),
                'codigo': d.codigo_rastreamento,
                'itens': itens_list
            })

        return JsonResponse({'intencoes': intentions_list})

    return JsonResponse({'erro': 'Método não permitido'}, status=405)

@csrf_exempt
@api_auth_required
def api_intencao_doacao_status(request, pk):
    if request.method != 'PATCH':
        return JsonResponse({'erro': 'Método não permitido'}, status=405)

    try:
        donation = DonationIntake.objects.get(pk=pk)
    except DonationIntake.DoesNotExist:
        return JsonResponse({'erro': 'Intenção não encontrada'}, status=404)

    try:
        data = json.loads(request.body)
        status = data.get('status')  # 'concluida' ou 'cancelada'

        if status not in ['concluida', 'cancelada', 'pendente']:
            return JsonResponse({'erro': 'Status inválido'}, status=400)

        # Validar itens antes da transação se fornecidos
        itens_data = data.get('itens')
        validated_items = []
        if itens_data is not None:
            for item in itens_data:
                prod_id = item.get('id') or item.get('produto_id')
                quantidade = float(item.get('quantidade', 0))
                if not prod_id:
                    return JsonResponse({'erro': 'Todos os itens devem estar cadastrados no sistema'}, status=400)
                if quantidade <= 0:
                    return JsonResponse({'erro': 'A quantidade de cada item deve ser maior que zero'}, status=400)
                try:
                    product = Product.objects.get(pk=prod_id)
                    validated_items.append((product, quantidade))
                except Product.DoesNotExist:
                    return JsonResponse({'erro': f'Produto com ID {prod_id} não está cadastrado'}, status=400)

        with transaction.atomic():
            if itens_data is not None:
                donation.itens.all().delete()
                for product, quantidade in validated_items:
                    DonationItem.objects.create(
                        id_doacao=donation,
                        id_produto=product,
                        nome_item_personalizado=None,
                        quantidade=quantidade
                    )

            donation.status_doacao = status
            if status == 'concluida':
                donation.data_recebimento = timezone.now()
                donation.id_usuario = request.user

                # Incrementar o estoque dos produtos recebidos
                for item in donation.itens.all():
                    if item.id_produto:
                        item.id_produto.estoque_atual += item.quantidade
                        item.id_produto.save()

            donation.save()

            ActivityLog.objects.create(
                id_usuario=request.user,
                acao='INTENCAO_DOACAO_STATUS',
                descricao=f'Intenção de doação {donation.codigo_rastreamento} foi {status}.'
            )

        return JsonResponse({'sucesso': True})
    except Exception as e:
        return JsonResponse({'erro': str(e)}, status=500)


@csrf_exempt
@api_auth_required
def api_usuarios(request):
    if request.user.cargo != 'admin':
        return JsonResponse({'erro': 'Apenas administradores podem gerenciar usuários'}, status=403)

    if request.method == 'GET':
        users = Usuario.objects.all().order_by('nome_completo')
        users_list = []
        for u in users:
            users_list.append({
                'id': u.id,
                'nome': u.nome_completo,
                'email': u.email,
                'cargo': u.cargo,
                'status': u.status
            })
        return JsonResponse({'usuarios': users_list})

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            nome = data.get('nome_completo') or data.get('nome')
            email = data.get('email')
            cargo = data.get('cargo', 'operador')
            status = data.get('status', 'ativo')
            senha = data.get('senha', 'password')

            if not nome or not email:
                return JsonResponse({'erro': 'Nome completo e e-mail são obrigatórios'}, status=400)

            if Usuario.objects.filter(Q(email=email) | Q(username=email)).exists():
                return JsonResponse({'erro': 'E-mail já cadastrado'}, status=409)

            user = Usuario.objects.create_user(
                username=email,
                email=email,
                nome_completo=nome,
                cargo=cargo,
                status=status,
                is_staff=True
            )
            user.set_password(senha)
            user.save()

            ActivityLog.objects.create(
                id_usuario=request.user,
                acao='CRIACAO_USUARIO',
                descricao=f'Administrador criou o usuário {email}'
            )
            return JsonResponse({'sucesso': True, 'id': user.id}, status=201)
        except Exception as e:
            return JsonResponse({'erro': str(e)}, status=500)

    return JsonResponse({'erro': 'Método não permitido'}, status=405)


@csrf_exempt
@api_auth_required
def api_usuario_detail(request, pk):
    if request.user.cargo != 'admin':
        return JsonResponse({'erro': 'Apenas administradores podem gerenciar usuários'}, status=403)

    try:
        u = Usuario.objects.get(pk=pk)
    except Usuario.DoesNotExist:
        return JsonResponse({'erro': 'Usuário não encontrado'}, status=404)

    if request.method in ['PUT', 'PATCH']:
        try:
            data = json.loads(request.body)
            nome = data.get('nome') or data.get('nome_completo')
            cargo = data.get('cargo')
            status = data.get('status')

            if nome:
                u.nome_completo = nome.strip()
            if cargo:
                u.cargo = cargo.strip()
            if status:
                u.status = status.strip()

            u.save()
            return JsonResponse({'sucesso': True})
        except Exception as e:
            return JsonResponse({'erro': str(e)}, status=500)

    elif request.method == 'DELETE':
        if u.id == request.user.id:
            return JsonResponse({'erro': 'Você não pode excluir a si mesmo'}, status=400)
        u.delete()
        return JsonResponse({'sucesso': True})

    return JsonResponse({'erro': 'Método não permitido'}, status=405)


@csrf_exempt
@api_auth_required
def api_dashboard_stats(request):
    if request.method != 'GET':
        return JsonResponse({'erro': 'Método não permitido'}, status=405)

    try:
        # 1. Total products
        total_produtos = Product.objects.count()

        # 2. Low stock products
        total_baixo_estoque = Product.objects.filter(estoque_atual__lte=models.F('estoque_minimo')).count()

        # 3. Total weight received (KG)
        completed_donations = DonationIntake.objects.filter(status_doacao='concluida')
        completed_items = DonationItem.objects.filter(id_doacao__in=completed_donations)

        total_recebido_kg = sum(float(item.quantidade) for item in completed_items if item.id_produto and item.id_produto.unidade_medida.lower() == 'kg')
        total_recebido_itens = sum(float(item.quantidade) for item in completed_items)

        # 4. Movements today
        hoje = timezone.now().date()
        movimentacoes_hoje = ActivityLog.objects.filter(data_hora__date=hoje).count()

        # 5. Top needs
        produtos_meta = Product.objects.filter(meta__gt=0).select_related('categoria')
        top_necessidades = []
        for p in produtos_meta:
            percent = min(100.0, float((p.estoque_atual / p.meta) * 100))
            deficit = float(p.meta - p.estoque_atual)
            top_necessidades.append({
                'nome': p.nome_produto,
                'percentual': percent,
                'deficit': deficit,
                'categoria': p.categoria.nome
            })
        top_necessidades.sort(key=lambda x: x['percentual'])
        top_necessidades = top_necessidades[:5]

        # 6. Category achieved
        resumo_categoria = []
        for cat in Category.objects.all():
            prods = Product.objects.filter(categoria=cat)
            total_estoque = sum(p.estoque_atual for p in prods)
            total_meta = sum(p.meta for p in prods)
            percent = min(100.0, float((total_estoque / total_meta) * 100)) if total_meta > 0 else 0.0
            resumo_categoria.append({
                'nome': cat.nome,
                'percentual': percent
            })

        # 7. Recent activities
        recent_activities = []
        logs = ActivityLog.objects.all().order_by('-data_hora')[:5]
        for l in logs:
            icon = '➕'
            if 'CADASTRO' in l.acao or 'CRIACAO' in l.acao:
                icon = '👥'
            elif 'EDICAO' in l.acao or 'ATUALIZA' in l.acao:
                icon = '📝'
            elif 'DISTRIBUICAO' in l.acao or 'SAIDA' in l.acao:
                icon = '📦'
            elif 'AJUSTE' in l.acao:
                icon = '🔧'
            elif 'LIMPEZA' in l.acao:
                icon = '🗑️'

            diff = timezone.now() - l.data_hora
            if diff.days > 0:
                time_str = f"Há {diff.days} dia(s)"
            elif diff.seconds >= 3600:
                time_str = f"Há {diff.seconds // 3600} hora(s)"
            elif diff.seconds >= 60:
                time_str = f"Há {diff.seconds // 60} min"
            else:
                time_str = "Agora mesmo"

            recent_activities.append({
                'titulo': l.acao.replace('_', ' ').title(),
                'descricao': l.descricao,
                'tempo': time_str,
                'icon': icon
            })

        return JsonResponse({
            'total_produtos': total_produtos,
            'total_baixo_estoque': total_baixo_estoque,
            'total_recebido_kg': total_recebido_kg,
            'total_recebido_itens': total_recebido_itens,
            'movimentacoes_hoje': movimentacoes_hoje,
            'produtos_maior_necessidade': top_necessidades,
            'resumo_categoria': resumo_categoria,
            'atividades_recentes': recent_activities
        })
    except Exception as e:
        return JsonResponse({'erro': str(e)}, status=500)


@csrf_exempt
@api_auth_required
def api_notificacoes(request):
    if request.method != 'GET':
        return JsonResponse({'erro': 'Método não permitido'}, status=405)

    try:
        notifications_list = []

        # 1. Low stock products
        low_stock_prods = Product.objects.filter(estoque_atual__lte=models.F('estoque_minimo'))
        for p in low_stock_prods:
            notifications_list.append({
                'id': f"low-stock-{p.id_produto}",
                'title': 'Estoque baixo',
                'description': f"O produto {p.nome_produto} atingiu o estoque mínimo de {p.estoque_minimo} {p.unidade_medida}.",
                'time': 'Ação requerida',
                'icon': '⚠️',
                'read': False
            })

        # 2. Recent activity logs
        logs = ActivityLog.objects.all().order_by('-data_hora')[:5]
        for l in logs:
            icon = '👥' if 'CADASTRO' in l.acao or 'CRIACAO' in l.acao else '📦'

            diff = timezone.now() - l.data_hora
            if diff.days > 0:
                time_str = f"Há {diff.days} dia(s)"
            elif diff.seconds >= 3600:
                time_str = f"Há {diff.seconds // 3600} hora(s)"
            elif diff.seconds >= 60:
                time_str = f"Há {diff.seconds // 60} min"
            else:
                time_str = "Agora mesmo"

            notifications_list.append({
                'id': f"log-{l.id_historico}",
                'title': l.acao.replace('_', ' ').title(),
                'description': l.descricao,
                'time': time_str,
                'icon': icon,
                'read': True
            })

        return JsonResponse({'notificacoes': notifications_list})
    except Exception as e:
        return JsonResponse({'erro': str(e)}, status=500)


