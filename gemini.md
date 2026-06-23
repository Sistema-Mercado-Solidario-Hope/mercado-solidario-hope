# Sistema Mercado Solidário (HOPE) - Developer Guide

This document describes the current architecture, conventions, and API endpoints of the Mercado Solidário (HOPE) project to assist developer agents.

---

## 🏛️ Architecture Overview

The project is built as a **Django Monolith** with a decoupled frontend:
- **Backend**: Django 6.0.6 serving HTML templates and exposing a custom-authenticated REST API.
- **Database**: SQLite3 containing schemas for Products, Beneficiaries, Donations, Deliveries, and Logs.
- **Authentication**: Token-based authentication using cryptographic signatures (`django.core.signing.Signer`). The token is sent in the `Authorization: Bearer <token>` header.
- **Frontend**: Standard HTML5 templates under `core/templates/` powered by plain vanilla CSS and modern ES Module scripts in `core/static/js/`.

---

## 🔌 API Endpoints & Core Routings

### 1. Authentication & Users
- **Login**: `POST /api/auth/login` - Authenticates user and returns custom cryptographic token.
- **Perfil**: `GET /api/auth/usuario` - Retrieves currently authenticated user info.
- **Cadastro**: Public user registration (`/api/auth/cadastro` and `cadastro.html`) has been **removed** and redirects to `/login.html`.
- **Gerenciamento Interno**: All user creation is handled internally by administrators via the `GET/POST /api/usuarios` and `PATCH/DELETE /api/usuarios/<id>` endpoints.

### 2. Estoque & Dashboard
- **Produtos**: `GET/POST /api/estoque/produtos` & `PATCH/DELETE /api/estoque/produtos/<id>`
  - Now fully supports the **`meta`** field (Arrecadação target).
- **Dashboard Stats**: `GET /api/estoque/dashboard`
  - *Auth required*. Returns dynamic stock statistics:
    - `total_produtos`: Count of all products.
    - `total_baixo_estoque`: Products with `estoque_atual <= estoque_minimo`.
    - `total_recebido_kg`: Sum of weights of all completed items where unit is `kg`.
    - `total_recebido_itens`: Total quantity of all received items.
    - `movimentacoes_hoje`: Daily activity log count.
    - `produtos_maior_necessidade`: Sorted list of top 5 items with lowest target achievement percentage (`estoque_atual / meta * 100`).
    - `resumo_categoria`: Average goal completion percentages grouped by category.
    - `atividades_recentes`: 5 most recent `ActivityLog` entries formatted with icons and relative times.
- **Notificações**: `GET /api/notificacoes`
  - *Auth required*. Dynamically generates alerts for all low-stock items (`estoque_atual <= estoque_minimo`) and 5 recent audit logs.

### 3. Beneficiários & Entregas
- **Beneficiários**: `GET/POST /api/beneficiarios`
- **Busca Beneficiários**: `GET /api/beneficiarios/busca?q=<term>`
- **Confirmar Entrega**: `POST /api/entregas_confirmar`

---

## 🎨 Frontend Conventions

### 1. JavaScript ES Modules
To facilitate structured calls, frontend scripts utilize ES Modules import pattern from `api.js` (such as `getToken`, `authenticatedFetch`, etc.).
- **Crucial Rule**: Any template referencing core scripts must declare the script tag with `type="module"` to avoid syntax errors:
  ```html
  <script type="module" src="{% static 'js/visao-geral-estoque.js' %}"></script>
  ```

### 2. Main Refactored Pages
- **`visao-geral-estoque.html`**: Completely dynamic stock dashboard fetching all counters and activities from `/api/estoque/dashboard`.
- **`vitrine-necessidade.html`**: Public donation showcase displaying active needs (items where `meta > 0`) using color-coded urgency indicators:
  - `< 30%` achieved: **Crítico** (Red banner)
  - `>= 100%` achieved: **Meta Atingida** (Overlay)
  - Else: **Urgente/Padrão** (Blue banner)
- **`metas-produtos.html`**: Admin portal to update/manage arrecadação targets (`meta`) inline.
- **`cadastro-familia.html`**: Structure modified to class `cadastro-familia-container` and `form-panel` to ensure clean container paddings from `cadastro-familias.css`.

---

## 🧪 Testing & Quality Assurance

Pytest is configured as the main runner. Run the test suite using either:
```bash
# Locally in venv
pytest

# Via Django manager
python manage.py test core

# Containerized execution (recommended for CI check)
./run_tests_docker.sh
```
