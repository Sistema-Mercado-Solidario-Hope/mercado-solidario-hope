from django.urls import path
from core import views

urlpatterns = [
    # Page views (to serve HTML templates under standard path names)
    path('', views.home_view, name='home'),
    path('home.html', views.home_view),
    path('vitrine-necessidade.html', views.vitrine_view),
    path('intencao-doacao.html', views.intencao_doacao_view),
    path('sucesso.html', views.sucesso_view),
    path('login.html', views.login_view),
    path('contato.html', views.contato_view),
    path('perfil.html', views.perfil_view),
    path('gestao-estoque.html', views.gestao_estoque_view),
    path('visao-geral-estoque.html', views.visao_geral_view),
    path('inserir-estoque.html', views.inserir_estoque_view),
    path('validar-intencoes.html', views.validar_intencoes_view),
    path('frente-caixa.html', views.frente_caixa_view),
    path('cadastro-familia.html', views.cadastro_familia_view),
    path('familia-listagem.html', views.familia_listagem_view),
    path('cadastro-produto.html', views.cadastro_produto_view),
    path('configuracoes.html', views.configuracoes_view),
    path('admin.html', views.admin_view),
    path('cadastro.html', views.cadastro_view),
    path('base.html', views.base_view),

    # REST API views
    path('api/auth/login', views.api_login),
    path('api/auth/cadastro', views.api_cadastro),
    path('api/auth/usuario', views.api_usuario_perfil),
    
    path('api/estoque/produtos', views.api_produtos),
    path('api/estoque/produtos/<int:pk>', views.api_produto_detail),
    path('api/estoque/produtos/<int:pk>/quantidade', views.api_produto_quantidade),
    
    path('api/beneficiarios', views.api_beneficiarios),
    path('api/beneficiarios/busca', views.api_beneficiarios_busca),
    path('api/beneficiarios/<int:pk>', views.api_beneficiario_detail),
    
    path('api/entregas/confirmar', views.api_entregas_confirmar),
    path('api/configuracoes', views.api_configuracoes),
    path('api/historico', views.api_historico),
    path('api/intencao-doacao', views.api_intencao_doacao),
    path('api/intencao-doacao/<int:pk>/status', views.api_intencao_doacao_status),
    
    path('api/usuarios', views.api_usuarios),
    path('api/usuarios/<int:pk>', views.api_usuario_detail),
]
