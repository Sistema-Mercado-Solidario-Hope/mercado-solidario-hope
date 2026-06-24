# Mercado Solidário (HOPE)

> **Idiomas / Languages**:
> - [Português (Brasil)](#português-brasil)
> - [English](#english)

---

# Português (Brasil)

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

---
---

# English

Mercado Solidário (HOPE) is a unified Django monolithic web application designed to manage the stock, intake, and beneficiary distribution checkout for social institutions. This project integrates a premium HTML/CSS/JS frontend served via Django and backed by a custom-signed REST API layer.

---

## 🚀 Features

* **Authentication & RBAC**: Custom Bearer token-signed authentication layer utilizing secure cryptographic signatures (`django.core.signing.Signer`). External signup is deprecated; user accounts are managed internally by administrators.
* **Cashier Terminal (Frente de Caixa)**: High-speed checkout terminal for beneficiary basket distribution checking stock limits.
* **Database Catalog & CRUD**: Full database integrations for beneficiary families, products catalog, donations, and activity auditing history.
* **Stock Dashboard Overview**: Live stock management metrics, including total products, low-stock warnings, collected item metrics, daily movements, and top necessities.
* **Product Goals (Metas de Arrecadação)**: Administrative tools to configure and modify collection targets (`meta`), which dynamically update the public donation showcase.
* **Dynamic Notifications**: Navigation bar warning alerts for low-stock products and recent audit history.
* **Institutional Configurations**: Custom settings for PIX key, address parameters, and institutional information.
* **Auditing Logs**: Audits administrative transactions and stock adjustments.

---

## 🛠️ Tech Stack

* **Backend**: Django 6.0.6 (Python 3.12+)
* **Database**: SQLite3
* **Frontend**: Plain Vanilla CSS, JS, and HTML5 (served via Django Static files)
* **Orchestration**: Docker & Docker Compose

---

## ⚙️ Environment Variables

The application reads configurations from environment variables. You can define these in a `.env` file at the root of the project:

* `SECRET_KEY`: Django cryptographic secret key.
* `DEBUG`: Toggle development debug logs (`True` or `False`). Defaults to `False` if not specified.

Create a `.env` file with the following content:
```env
DEBUG=True
SECRET_KEY=your-custom-secret-key-here
```

---

## 📦 Running the Application

### Method 1: Local Development
Ensure you have Python 3.12+ and a virtual environment configured.

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Generate Database Migrations**:
   ```bash
   python manage.py makemigrations core
   ```

3. **Apply Migrations**:
   ```bash
   python manage.py migrate
   ```

4. **Seed the Database**:
   Loads mock configurations, administrative users, beneficiaries, and products:
   ```bash
   python manage.py seed
   ```
   *Default Administrative User*: `admin@mercadosolidario.com` / `admin`
   *Default Operator User*: `operador@mercadosolidario.com` / `password`

5. **Run the Development Server**:
   ```bash
   python manage.py runserver
   ```
   Access the system at `http://127.0.0.1:8000/`.

---

### Method 2: Running with Docker

Build and run the entire application containerized:
```bash
docker compose up --build
```
*(The Docker entrypoint automatically triggers migrations, seeds the database with initial states, and exposes the server on port `8000`)*.

---

## 🧪 Running Tests

Execute the test suite locally using Django's test manager or pytest:
```bash
# Using Django test manager
python manage.py test core

# Using pytest
pytest
```

Or run the tests containerized:
```bash
./run_tests_docker.sh
```

---

## 📂 Project Structure

```
mercado-solidario-hope/
├── core/                   # Main Django app
│   ├── management/         # Seeding commands
│   ├── static/             # Extracted HTML assets (CSS/JS/Img)
│   ├── templates/          # Reconstructed HTML views
│   ├── models.py           # Django DB schemas
│   ├── views.py            # API REST Controllers & page renderers
│   └── urls.py             # App-level routing
├── mercado_solidario_hope/ # Main settings module
│   ├── settings.py         # Settings & Auth configuration
│   └── urls.py             # Root-level router (middleware static serve)
├── Dockerfile              # Docker recipe
├── docker-compose.yml      # Docker compose configuration
└── requirements.txt        # Dependencies manifest
```
