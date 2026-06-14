# Mercado Solidário (HOPE)

Mercado Solidário (HOPE) is a unified Django monolithic web application designed to manage the stock, intake, and beneficiary distribution checkout for social institutions. This project integrates a premium HTML/CSS/JS frontend served via Django and backed by a custom-signed REST API layer.

---

## 🚀 Features

* **Authentication & RBAC**: Custom Bearer token-signed authentication layer utilizing secure cryptographic signatures (`django.core.signing.Signer`).
* **Cashier Terminal (Frente de Caixa)**: High-speed checkout terminal for beneficiary basket distribution checking stock limits.
* **Database Catalog & CRUD**: Full database integrations for beneficiary families, products catalog, donations, and activity auditing history.
* **Institutional Configurations**: Custom settings for PIX key, address parameters, and institutional information.
* **Auditing Logs**: Audits administrative transactions and stock adjustments.

---

## 🛠️ Tech Stack

* **Backend**: Django 6.0.6 (Python 3.12+)
* **Database**: SQLite3
* **Frontend**: Plain Vanilla CSS, JS, and HTML5 (served via Django Static files)
* **Orchestration**: Docker & Docker Compose

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
   *Default Administrative User*: `maria@exemplo.com` / `password`
   *Default Operator User*: `operador@mercadosolidario.com.br` / `password`

5. **Run the Development Server**:
   ```bash
   python manage.py runserver
   ```
   Access the system at `http://127.0.0.1:8000/`.

---

### Method 2: Running with Docker

Build and run the entire application containerized:
```bash
docker-compose up --build
```
*(The Docker entrypoint automatically triggers migrations, seeds the database with initial states, and exposes the server on port `8000`)*.

---

## 🧪 Running Tests

Execute Django unit tests to verify business validations:
```bash
python manage.py test core
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
