# Software Specification: Mercado Solidário (HOPE)
## Systems Management for Donation Inventories & Distribution

This specification document serves as the architectural and functional blueprint for building the **Mercado Solidário** application. It details the scope, exact functional requirements, non-functional constraints, and business logic required to implement the solution as a Django web application.

---

## 1. Project Overview & Objectives

### 1.1 Introduction
The **Sistema de Gerenciamento de Estoque de Doações - Mercado Solidário HOPE** is designed to modernize and optimize the donation lifecycle for charitable organizations. It addresses logistical challenges, eliminates waste caused by expired or unaccounted food items, minimizes long waiting queues during distribution events, and bridges the communication gap between the institution and prospective community donors.

### 1.2 System Pillars
The platform is structured across three core areas:
1. **Donor Engagement:** A transparent, public-facing portal showcasing real-time organizational needs.
2. **Internal Inventory Control:** Precise tracking of stock levels, expiration factors, and item categorizations.
3. **Agile Distribution:** A rapid point-of-sale style check-out ("Frente de Caixa") interface ensuring a streamlined, dignified distribution process for registered beneficiary families.

### 1.3 Target Audience
* **Donors:** Citizens looking to contribute who need clear guidance on what items are critically required.
* **Volunteers & Institution Managers:** Internal users responsible for inventory intake, general systems management, and food distribution.
* **Beneficiary Families:** Pre-registered individuals or households choosing and picking up food supplies during "solidarity market" days.

---

## 2. System Scope

### 2.1 In-Scope (Core Features)
The Django application must implement the following core workflows:
* Public dashboard displaying donation goals and live item deficits.
* Public submission forms for donor intentions (no authentication required).
* Product catalog configuration and categorization.
* Internal dashboard providing real-time stock visualization.
* Quick-intake mechanisms for confirming inventory additions.
* Unified point-of-distribution ("Frente de Caixa") engine tracking outbound items.
* Automatic mathematical reconciliation of stock increments and decrements.
* Static financial information interfaces (PIX Key and QR Code).
* Support for discrete units, multi-item packages, and continuous weight metrics (Kilograms with decimal precision).

### 2.2 Out-of-Scope (Explicitly Excluded)
The following elements are **not** part of this implementation cycle:
* Generation or printing of fiscal/tax invoices (Notas Fiscais).
* Direct integration with hardware peripheral barcode scanners.
* Direct integration with commercial transactional merchant gateways (Credit/Debit card processors).
* Fully automated, touchless donation routing engines.
* Live ledger integrations with external banking APIs.

### 2.3 Future Roadmap (Scope Creep/Enhancements)
Design the codebase flexibly to allow subsequent integrations for:
* Detailed analytics reporting engines exporting to PDF or Excel format.
* Automated WhatsApp notification triggers notifying beneficiary families of scheduled market distribution events.

---

## 3. Technical Requirements & Architecture

### 3.1 Architecture Blueprint
The application will be developed using **Django (Python)** as a unified monolithic system, leveraging Django’s native Model-View-Template (MVT) structure, built-in Authentication mechanisms, and Object-Relational Mapper (ORM).

### 3.2 Visual Identity & Interface Requirements
The system interface must adhere to a strict visual design system:
* **Primary Color Palette:** Blue, Purple, Black, and White.
* **User Experience Goal:** Layouts must feel professional, clean, encouraging, and highly serious, with strong visual contrast to guarantee accessibility.
* **Responsiveness:** All dashboard, public forms, and distribution screens must layout fluidly across mobile smartphones and modern desktop viewports.

---

## 4. Functional Requirements (FR)

### 4.1 Inventory & Product Management
* **RF001:** The system must allow the registration of products to establish tracking and item accounting within the inventory.
* **RF002:** The system must provide a secure administrative dashboard enabling managers to search, view, edit, and audit items present within the inventory.
* **RF003:** The system must display a real-time view of inventory levels, highlighting exact updated quantities for each product.
* **RF004:** The system must permit explicit modifications (editing and soft/hard deletions) of cataloged items in stock.
* **RF005:** The system must classify all food items across defined categories, explicitly distinguishing between **Perecíveis (Perishable)** and **Não Perecíveis (Non-Perishable)**.
* **RF006:** The system must dynamically flags products experiencing low stock thresholds.
* **RF007:** The system must dynamically flag products experiencing overstock scenarios.
* **RF008:** The system must support item entries using Kilograms (KG) as a unit of measurement, explicitly allowing fractional float values (e.g., `1.5 kg`), alongside standard integer-based discrete units.

### 4.2 Donation Intake & Ledger Tracking
* **RF009:** The system must provide data entry interfaces for incoming donations recording: item type, unit of measurement (KG or Discrete Unit), quantity, and incoming timestamp.
* **RF010:** The system must automatically recalculate inventory counts globally upon the validation of incoming donations or outbound distribution transactions.

### 4.3 Outbound Distribution ("Frente de Caixa")
* **RF011:** The system must capture and log the removal of specific items during active distribution events.
* **RF012:** The system must immediately decrement inventory balances across matched item definitions when an outbound transaction is saved.
* **RF013:** The system must provide an administrative CRUD interface for managing registered **Beneficiary Families**.
* **RF014:** The system must identify and select a specific beneficiary family during the checkout phase of item distribution.
* **RF015:** The system must feature a dedicated, high-speed "Frente de Caixa" (Point of Distribution) operational module optimized for live distribution days.
* **RF016:** The distribution checkout interface must allow operators to rapidly scan/input and record chosen items allocated to a family.

### 4.4 Public-Facing Portal & Donor Interface
* **RF017:** The application must serve an unauthenticated public webpage showing required items for the current calendar month.
* **RF018:** For every item displayed publicly, the system must clearly render the targeted threshold (total items needed) alongside the live deficit (remaining quantity needed, calculated against active inventory levels).
* **RF019:** The public portal must feature a dedicated info section showcasing donation methods: physical drop-off locations and direct financial paths.
* **RF020:** The financial donations page section must display a static PIX key string alongside its corresponding scannable QR Code image linked to the institution's account.
* **RF021:** Administrators must have access to settings to seamlessly alter, add, or override items showcased on the public vitrine.
* **RF022:** Prospective donors must be able to fill out a structured "Donation Intention Form" publicly without requiring any user registration or authentication.

### 4.5 Administrative Auditing & Reporting Configuration
* **RF023:** The system must route submitted donation intentions directly into an internal administrative workspace where managers can view and confirm physical item reception.
* **RF024:** Internal administrators must be able to search through submitted donation intentions filtering by donor name, phone contact, or the unique tracking code generated upon submission.
* **RF025:** The application must maintain a structural historical log recording critical system actions for auditing and internal compliance tracking.
* **RF026:** The application must provide a centralized Global Settings module where administrators can modify key operational text: institution address, phone lines, Instagram links, contact email addresses, map embeddings, PIX strings, QR code images, and corporate tax registration details (CNPJ).
* **RF027:** The system must compile an operational dashboard displaying registered donations, item-by-item stock levels, overall global inventory mass, highly donated products, and critical real-time graphs.

---

## 5. Non-Functional Requirements (NFR)

* **RNF001 - Deployment Strategy:** The system must be configured for standard compatibility with free/student tier cloud hosting environments (e.g., Render, Railway, Fly.io, or Vercel/Supabase combinations) across frontend layers, backend processes, and relational databases.
* **RNF002 - Authentication & Security:** Secure authentication forms must guard administrative and checkout routes. All secret user passwords must be securely hashed and stored inside the database via standard cryptographic hashing implementations (Django standard PBKDF2 default behavior).
* **RNF003 - Checkout Velocity:** The "Frente de Caixa" component must utilize lightning-fast querying paths, low payload sizes, and optimized indexing to execute item queries and inventory reductions within minimal response latencies to mitigate long on-site crowds.
* **RNF004 - Data Protection Compliance (LGPD):** A transparent, plain-text policy banner detailing data usage purposes combined with an obligatory checkbox stating *"Aceito os termos"* must be explicitly validated during user registration/data entry interfaces.
* **RNF005 - Usability:** Interface components must be designed for low cognitive friction, accommodating volunteers who may possess limited technical proficiency.
* **RNF006 - Responsiveness:** The UI must feature unified responsive styling layouts fitting everything from narrow 6-inch mobile screens up to standard enterprise widescreen monitors.

---

## 6. Strict Business Rules (BR)

* **RN001 - Inventory Integrity:** No inventory transaction may result in unstable floating states. Quantities are bounded to positive domains; manual database manipulation must be avoided in favor of auditable balance logs.
* **RN002 - Monitored Distribution Flow:** Outbound item sets can only be distributed to verified, pre-registered beneficiary families. Anonymous distributions are blocked through validation rules.
* **RN003 - Automated Alert Thresholding:** The dashboard must automatically generate system-level alerts if any specific tracking item dips below its predetermined safe operational stock level.
* **RN005 - Role-Based Access Control (RBAC):** Only authenticated users assigned to the **Administrator** role have permission to execute record deletions or manually alter previous historic stock movements. Operational staff (e.g., checkout clerks) are strictly restricted from these workflows.
* **RN006 - Cross-Device Optimization:** To ensure practical usability for on-site volunteers carrying mobile phones, layout break-points must support data mutation operations on mobile browsers.
* **RN007 - Dynamic Public Vitrine Deficit Calculations:** The volume deficit visible on the public donor page must be evaluated dynamically by subtracting current in-house stock counts from the monthly baseline target. If the deficit hits $\le 0$, the item status must automatically switch to a stylized **"Meta Atingida" (Goal Achieved)** badge.
* **RN008 - Precision Fractional Math Support:** Products cataloged with a unit designation of **"KG"** must enforce floating-point numerical verification at both intake forms and checkout terminals, preventing rounding deviations from corrupting physical weight measures.

---

## 7. Recommended Django Implementation Matrix

To assist the Gemini AI Agent in scaffolding this project flawlessly, use the following structural guidelines:

### 7.1 Data Models Architecture Blueprint
1. `UserProfile(AbstractUser)`: Tracks administrative staff vs. checkout volunteers.
2. `BeneficiaryFamily`: Stores head of household name, phone, compliance fields, and LGPD checkbox confirmation state.
3. `Product`: Stores product name, slug, category (`PERISHABLE`, `NON_PERISHABLE`), measurement unit (`KG`, `UNIT`, `PACKAGE`), and minimum safety threshold.
4. `InventoryLedger`: Tracks active `Product` entities, batch records, expiration timestamps, and current calculated quantities.
5. `StockTransaction`: Atomic ledger recording `transaction_type` (`INBOUND_DONATION`, `OUTBOUND_DISTRIBUTION`, `MANUAL_ADJUSTMENT`), quantity (Decimal field with 2 decimal places), associated `Product`, and responsible `UserProfile`.
6. `DonationIntention`: Stores unauthenticated donor name, phone, planned donation items, generated confirmation token, and a `status` tracking field (`PENDING`, `RECEIVED`, `EXPIRED`).
7. `GlobalConfiguration`: Single-row configuration model for dynamic phone numbers, addresses, PIX keys, and QR images.

### 7.2 Views & Forms Breakdown
* Utilize **Django Class-Based Views (CBVs)** for standard administrative dashboards (`ListView`, `UpdateView`, `CreateView`).
* Use a single-page view powered by vanilla JavaScript fetch calls or htmx for the **Frente de Caixa (RF015/RF016)** interface to execute fast lookups and item increments/decrements without requiring a full page refresh.
* Enforce `LoginRequiredMixin` and `PermissionRequiredMixin` across all internal inventory management operations to support **RN005**.

## 8. SQL Schema Blueprint
-- ========================================================
-- 1. TABELA DE USUÁRIOS (Administradores, Funcionários e Doadores)
-- Origem: admin.html, login.html, cadastro.html, perfil.html
-- ========================================================
CREATE TABLE usuarios (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nome_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    cpf_cnpj VARCHAR(20) UNIQUE,
    telefone VARCHAR(20),
    senha_hash VARCHAR(255) NOT NULL,
    cargo VARCHAR(50) DEFAULT 'doador', -- Ex: 'admin', 'colaborador', 'doador'
    status VARCHAR(20) DEFAULT 'ativo', -- 'ativo', 'inativo'
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- 2. TABELA DE FAMÍLIAS BENEFICIÁRIAS
-- Origem: cadastro-familia.html, familia-listagem.html
-- ========================================================
CREATE TABLE familias (
    id_familia INT PRIMARY KEY AUTO_INCREMENT,
    nome_familia VARCHAR(100) NOT NULL,
    responsavel_nome VARCHAR(255) NOT NULL,
    cpf_nis VARCHAR(20) UNIQUE, -- Inferido pela busca no frente de caixa
    telefone VARCHAR(20) NOT NULL,
    endereco VARCHAR(255),
    numero_membros INT NOT NULL DEFAULT 1,
    status VARCHAR(20) DEFAULT 'ativo', -- 'ativo', 'inativo'
    data_ultima_entrega DATETIME,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- 3. TABELA DE PRODUTOS (Catálogo e Estoque)
-- Origem: cadastrodeproduto.html, visao-geral-estoque.html
-- ========================================================
CREATE TABLE produtos (
    id_produto INT PRIMARY KEY AUTO_INCREMENT,
    nome_produto VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL, -- Ex: Cereais, Leguminosas, Higiene, Limpeza, Proteínas
    unidade_medida VARCHAR(10) NOT NULL, -- Ex: kg, un, L
    estoque_atual DECIMAL(10,2) DEFAULT 0.00,
    estoque_minimo DECIMAL(10,2) DEFAULT 0.00,
    estoque_maximo DECIMAL(10,2) DEFAULT 1000.00,
    imagem_url VARCHAR(255),
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- 4. TABELA DE INTENÇÕES E ENTRADAS DE DOAÇÃO
-- Origem: intencao-doacao.html, inserirEstoque.html, validar-intencoes.html
-- ========================================================
CREATE TABLE doacoes_entradas (
    id_doacao INT PRIMARY KEY AUTO_INCREMENT,
    nome_doador VARCHAR(255) NOT NULL,
    telefone_doador VARCHAR(20) NOT NULL,
    id_usuario INT, -- Pode ser nulo se o doador não estiver logado
    status_doacao VARCHAR(50) DEFAULT 'pendente', -- 'pendente', 'concluida', 'cancelada'
    data_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_recebimento DATETIME,
    codigo_rastreamento VARCHAR(20) UNIQUE NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

-- Tabela auxiliar para listar os itens de uma entrada de doação
CREATE TABLE doacoes_itens (
    id_doacao_item INT PRIMARY KEY AUTO_INCREMENT,
    id_doacao INT NOT NULL,
    id_produto INT, -- Pode ser nulo se for um "item personalizado" ainda não catalogado
    nome_item_personalizado VARCHAR(255), 
    quantidade DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_doacao) REFERENCES doacoes_entradas(id_doacao) ON DELETE CASCADE,
    FOREIGN KEY (id_produto) REFERENCES produtos(id_produto) ON DELETE SET NULL
);

-- ========================================================
-- 5. TABELA DE ENTREGAS (Saídas de Estoque / Frente de Caixa)
-- Origem: frente-caixa.html, sucesso.html
-- ========================================================
CREATE TABLE entregas_saidas (
    id_entrega INT PRIMARY KEY AUTO_INCREMENT,
    id_familia INT NOT NULL,
    id_usuario_operador INT NOT NULL, -- Funcionário que realizou a entrega
    data_entrega DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_familia) REFERENCES familias(id_familia) ON DELETE RESTRICT,
    FOREIGN KEY (id_usuario_operador) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT
);

-- Tabela auxiliar para listar os itens que a família retirou
CREATE TABLE entregas_itens (
    id_entrega_item INT PRIMARY KEY AUTO_INCREMENT,
    id_entrega INT NOT NULL,
    id_produto INT NOT NULL,
    quantidade DECIMAL(10,2) NOT NULL,
    percentual_cota_utilizada DECIMAL(5,2),
    FOREIGN KEY (id_entrega) REFERENCES entregas_saidas(id_entrega) ON DELETE CASCADE,
    FOREIGN KEY (id_produto) REFERENCES produtos(id_produto) ON DELETE RESTRICT
);

-- ========================================================
-- 6. TABELA DE HISTÓRICO DE ATIVIDADES
-- Origem: admin.html (Aba Histórico)
-- ========================================================
CREATE TABLE historico_atividades (
    id_historico INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    acao VARCHAR(100) NOT NULL, -- Ex: 'LOGIN', 'AJUSTE_ESTOQUE', 'CADASTRO_FAMILIA'
    descricao TEXT NOT NULL,
    data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);