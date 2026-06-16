# Gemini Context & Architect Details

This document provides context and design blueprints of the **Mercado Solidário (HOPE)** project for future AI coding assistants (Gemini) working on this repository.

---

## 🏗️ Architectural Overview

The application is structured as a **Django Monolith**. 

### 1. Root Static Asset Serving Strategy
* **Context**: Legacy frontend pages imported static assets using relative links like `<script src="js/api.js">` or `<link rel="stylesheet" href="css/base.css">`.
* **Decision**: Rather than refactoring hundreds of asset paths inside the HTML pages, we configured a regex-based serving mechanism at the project root `urls.py`:
  ```python
  re_path(r'^css/(?P<path>.*)$', serve, {'document_root': settings.BASE_DIR / 'core/static/css'}),
  re_path(r'^js/(?P<path>.*)$', serve, {'document_root': settings.BASE_DIR / 'core/static/js'}),
  re_path(r'^img/(?P<path>.*)$', serve, {'document_root': settings.BASE_DIR / 'core/static/img'}),
  ```
  This serves assets correctly from `/css/`, `/js/`, and `/img/` matching the root-level relative imports.

### 2. Lightweight Cryptographic Authentication
* **Context**: The client uses `Authorization: Bearer <token>` header, but we wanted to avoid full heavyweight JWT library overhead for the simple SQLite setup.
* **Decision**: Built a token signing layer inside `core/views.py` using Django's cryptographically secure signature helper:
  ```python
  from django.core.signing import Signer
  signer = Signer()
  
  # Token Generation
  token = signer.sign(str(user.id))
  
  # Token Validation
  user_id = signer.unsign(token)
  ```
  API endpoints use a custom decorator `@api_auth_required` that extracts the Bearer token, validates the signature, retrieves the user, and binds it to `request.user`.

### 3. Frontend ES Modules Integration
* **Context**: Client-side JavaScript used to CRUD state directly against `localStorage`.
* **Decision**: Modified `core/static/js/api.js` to point to Django's relative host endpoints (`API_BASE = ''`) and disabled simulation mode. 
* Refactored all client scripts as modules. Corresponding HTML templates under `core/templates/` load them with `<script type="module">` to allow ES imports (`import Api from './api.js';`).

---

## 🗄️ Database Models (`core/models.py`)

* **`Usuario` (AbstractUser)**: Custom authentication user with fields `nome_completo`, `cpf_cnpj`, `telefone`, `cargo` (`admin`, `operador`, `doador`), and `status` (`ativo`, `inativo`).
* **`BeneficiaryFamily`**: Records beneficiary data, status, last delivery date, and `lgpd_accept` flag.
* **`Product`**: Tracks inventory levels (`estoque_atual`, `estoque_minimo`, `estoque_maximo`) with `DecimalField` to preserve fractional weights precision.
* **`DonationIntake` / `DonationItem`**: Records pending and confirmed donations. Confirmed donations automatically increment corresponding catalog product stock counts.
* **`OutboundDelivery` / `DeliveryItem`**: Tracks beneficiary distributions. Checkout updates are atomic (`transaction.atomic()`), decrementing stock and updating the family's last delivery date.
* **`ActivityLog`**: Logging system for auditing security/administrative actions.
* **`GlobalConfiguration`**: Config parameters like PIX key, address, logo, and social links.

---

## 📋 Common CLI Operations

```bash
# Generate migrations
python manage.py makemigrations core

# Apply migrations
python manage.py migrate

# Seed database (Idempotent seed command utilizing get_or_create)
python manage.py seed

# Run Django unit tests (classic)
python manage.py test core

# Run the complete test suite (pytest, ruff, pip-audit) in a clean Docker container (recommended)
# This script automatically removes the test container and image on completion.
./run_tests_docker.sh
```
