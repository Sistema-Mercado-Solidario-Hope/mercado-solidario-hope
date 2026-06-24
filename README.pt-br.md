# Mercado Solidário (HOPE)

Mercado Solidário (HOPE) é uma aplicação web unificada em Django monolítico desenvolvida para gerenciar o estoque, entrada e checkout de distribuição de cestas básicas para beneficiários de instituições sociais. O projeto integra um frontend HTML/CSS/JS premium servido pelo Django e suportado por uma camada de API REST com assinaturas criptográficas personalizadas.

---

## 🚀 Funcionalidades

* **Autenticação & RBAC**: Camada de autenticação personalizada com assinaturas utilizando tokens Bearer seguros (`django.core.signing.Signer`). O cadastro externo está desativado; as contas de usuários são gerenciadas internamente por administradores.
* **Frente de Caixa (Terminal do Caixa)**: Terminal de checkout de alta velocidade para distribuição de cestas alimentícias aos beneficiários, validando os limites de estoque.
* **Catálogo & CRUD no Banco de Dados**: Integrações completas de banco de dados para famílias beneficiárias, catálogo de produtos, doações e histórico de auditoria de atividades.
* **Painel Geral de Estoque**: Métricas de estoque em tempo real, incluindo total de produtos, alertas de estoque baixo, métricas de itens coletados, movimentações diárias e principais necessidades.
* **Metas de Produtos (Metas de Arrecadação)**: Ferramentas administrativas para configurar e modificar as metas de arrecadação (`meta`), que atualizam dinamicamente a vitrine de doações pública.
* **Notificações Dinâmicas**: Alertas de aviso na barra de navegação para produtos com estoque baixo e histórico de auditoria recente.
* **Configurações Institucionais**: Ajuste dos dados de contato, chave Pix institucional e parâmetros de endereço físico.
* **Histórico de Auditoria (Logs)**: Auditoria e rastreamento de transações administrativas e ajustes de estoque.

---

## 🛠️ Tecnologias Utilizadas

* **Backend**: Django 6.0.6 (Python 3.12+)
* **Banco de Dados**: SQLite3
* **Frontend**: Plain Vanilla CSS, JS e HTML5 (servidos via arquivos estáticos do Django)
* **Orquestração**: Docker & Docker Compose

---

## ⚙️ Variáveis de Ambiente

A aplicação lê configurações a partir de variáveis de ambiente. Você pode definir essas configurações em um arquivo `.env` localizado na raiz do projeto:

* `SECRET_KEY`: Chave secreta criptográfica do Django.
* `DEBUG`: Ativa/desativa os logs de depuração em desenvolvimento (`True` ou `False`). O padrão é `False` caso não seja especificado.

Crie um arquivo `.env` com o seguinte formato:
```env
DEBUG=True
SECRET_KEY=sua-chave-secreta-customizada-aqui
```

---

## 📦 Executando a Aplicação

### Método 1: Desenvolvimento Local
Certifique-se de possuir o Python 3.12+ instalado e um ambiente virtual configurado.

1. **Instalar dependências**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Gerar as Migrações do Banco de Dados**:
   ```bash
   python manage.py makemigrations core
   ```

3. **Aplicar as Migrações**:
   ```bash
   python manage.py migrate
   ```

4. **Popular o Banco de Dados (Seed)**:
   Carrega configurações fictícias, usuários administrativos, beneficiários e produtos iniciais:
   ```bash
   python manage.py seed
   ```
   *Usuário Administrador Padrão*: `admin@mercadosolidario.com` / `admin`
   *Usuário Operador Padrão*: `operador@mercadosolidario.com` / `password`

5. **Iniciar o Servidor de Desenvolvimento**:
   ```bash
   python manage.py runserver
   ```
   Acesse o sistema no endereço `http://127.0.0.1:8000/`.

---

### Método 2: Executando via Docker

Construa e execute toda a aplicação em contêineres:
```bash
docker compose up --build
```
*(O entrypoint do Docker executa automaticamente as migrações, popula o banco de dados com os dados iniciais e expõe o servidor na porta `8000`)*.

---

## 🧪 Executando os Testes

Execute a suíte de testes localmente utilizando o gerenciador de testes do Django ou o pytest:
```bash
# Utilizando o gerenciador do Django
python manage.py test core

# Utilizando o pytest
pytest
```

Ou execute os testes em um contêiner Docker:
```bash
./run_tests_docker.sh
```

---

## 📂 Estrutura do Projeto

```
mercado-solidario-hope/
├── core/                   # Aplicativo principal do Django
│   ├── management/         # Comandos de seeding (população inicial)
│   ├── static/             # Assets estáticos (CSS/JS/Img)
│   ├── templates/          # Visualizações e templates HTML
│   ├── models.py           # Esquemas do banco de dados (Django Models)
│   ├── views.py            # Controllers REST API & renderizadores de páginas
│   └── urls.py             # Rotas do aplicativo core
├── mercado_solidario_hope/ # Módulo de configurações principal do Django
│   ├── settings.py         # Configurações de settings e autenticação
│   └── urls.py             # Roteador de nível raiz (serviço de arquivos estáticos)
├── Dockerfile              # Receita de build da imagem Docker
├── docker-compose.yml      # Configuração de orquestração Docker Compose
└── requirements.txt        # Manifesto de dependências do Python
```
