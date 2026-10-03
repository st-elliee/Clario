-- ============================================================
--  Clario - "Clarity in every client."
--  Database schema (MySQL 8.0+)
--
--  Run inside an existing database, e.g.:
--    CREATE DATABASE clario CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--    USE clario;
--    SOURCE backend/db/schema.sql;
--
--  Sensitive client fields (ΑΦΜ, ΑΜΚΑ, ID number, Taxis credentials)
--  are stored encrypted with Fernet (see backend/encryption.py).
--  afm_hash is a SHA-256 of the ΑΦΜ, used for exact-match search
--  without decrypting every row.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP VIEW IF EXISTS v_pending_services;
DROP VIEW IF EXISTS v_client_summary;
DROP VIEW IF EXISTS v_employee_activity;
DROP VIEW IF EXISTS v_annual_services;
DROP VIEW IF EXISTS v_client_search;
DROP TABLE IF EXISTS misc_income;
DROP TABLE IF EXISTS client_payment;
DROP TABLE IF EXISTS client_document;
DROP TABLE IF EXISTS action;
DROP TABLE IF EXISTS client_service;
DROP TABLE IF EXISTS service;
DROP TABLE IF EXISTS client;
DROP TABLE IF EXISTS employee;
SET FOREIGN_KEY_CHECKS = 1;


-- ------------------------------------------------------------
-- employee: office staff who log in to Clario
-- ------------------------------------------------------------
CREATE TABLE employee (
    employee_id   INT           NOT NULL AUTO_INCREMENT,
    username      VARCHAR(50)   NOT NULL,
    password_hash VARCHAR(255)  NOT NULL,
    full_name     VARCHAR(100)  NOT NULL,
    email         VARCHAR(150),
    phone         VARCHAR(20),
    role          ENUM('admin', 'employee') NOT NULL DEFAULT 'employee',
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    last_login    DATETIME,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (employee_id),
    UNIQUE KEY uq_employee_username (username)
);


-- ------------------------------------------------------------
-- client: individuals, freelancers and companies
-- ------------------------------------------------------------
CREATE TABLE client (
    client_id      INT           NOT NULL AUTO_INCREMENT,
    afm            VARCHAR(255),                  -- encrypted
    afm_hash       VARCHAR(64),                   -- SHA-256, for search
    last_name      VARCHAR(100)  NOT NULL,
    first_name     VARCHAR(100),
    company_name   VARCHAR(150),
    client_type    ENUM('individual', 'freelancer', 'company')
                   NOT NULL DEFAULT 'individual',
    phone          VARCHAR(20),
    email          VARCHAR(150),
    address        VARCHAR(200),
    amka           VARCHAR(255),                  -- encrypted
    id_number      VARCHAR(255),                  -- encrypted
    taxis_username VARCHAR(255),                  -- encrypted
    taxis_password VARCHAR(255),                  -- encrypted
    doy            VARCHAR(100),
    profession     VARCHAR(150),
    kad            VARCHAR(10),
    notes          TEXT,
    is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
    created_by     INT           NOT NULL,
    created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME      ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (client_id),
    UNIQUE KEY uq_client_afm_hash (afm_hash),
    CONSTRAINT fk_client_employee FOREIGN KEY (created_by)
        REFERENCES employee(employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);


-- ------------------------------------------------------------
-- service: catalogue of services the office offers
-- ------------------------------------------------------------
CREATE TABLE service (
    service_id   INT          NOT NULL AUTO_INCREMENT,
    name         VARCHAR(150) NOT NULL,
    category     ENUM('Φορολογία', 'Λογιστικά', 'Άλλες') NOT NULL,
    description  TEXT,
    is_recurring BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,

    PRIMARY KEY (service_id),
    UNIQUE KEY uq_service_name (name)
);


-- ------------------------------------------------------------
-- client_service: a service delivered to a client for a period
-- (the M:N "Receives" relationship of the ER diagram)
-- ------------------------------------------------------------
CREATE TABLE client_service (
    client_id        INT           NOT NULL,
    service_id       INT           NOT NULL,
    year             SMALLINT      NOT NULL,
    period           VARCHAR(30)   NOT NULL,
    status           ENUM('pending', 'in_progress', 'completed',
                          'overdue', 'paid', 'unpaid')
                     NOT NULL DEFAULT 'pending',
    payment_status   ENUM('unpaid', 'paid') NOT NULL DEFAULT 'unpaid',
    amount_billed    DECIMAL(10,2),
    amount_paid      DECIMAL(10,2) DEFAULT 0.00,
    amount_remaining DECIMAL(10,2)
                     GENERATED ALWAYS AS (amount_billed - amount_paid) STORED,
    due_date         DATE,
    completed_date   DATE,
    notes            TEXT,
    created_by       INT           NOT NULL,
    updated_by       INT,
    created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME      ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (client_id, service_id, year, period),
    CONSTRAINT fk_cs_client FOREIGN KEY (client_id)
        REFERENCES client(client_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_cs_service FOREIGN KEY (service_id)
        REFERENCES service(service_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_cs_created_by FOREIGN KEY (created_by)
        REFERENCES employee(employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_cs_updated_by FOREIGN KEY (updated_by)
        REFERENCES employee(employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);


-- ------------------------------------------------------------
-- action: audit trail of employee actions (GDPR)
-- ------------------------------------------------------------
CREATE TABLE action (
    employee_id  INT         NOT NULL,
    timestamp    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    action_type  ENUM(
                     'login', 'view_client', 'add_client', 'edit_client',
                     'delete_client', 'add_service', 'edit_service',
                     'update_service', 'delete_service', 'export_data'
                 ) NOT NULL,
    client_id    INT,
    details      JSON,
    ip_address   VARCHAR(45),

    PRIMARY KEY (employee_id, timestamp),
    CONSTRAINT fk_action_employee FOREIGN KEY (employee_id)
        REFERENCES employee(employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_action_client FOREIGN KEY (client_id)
        REFERENCES client(client_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);


-- ------------------------------------------------------------
-- client_document: uploaded files (PDF / images) per client
-- ------------------------------------------------------------
CREATE TABLE client_document (
    document_id   INT           NOT NULL AUTO_INCREMENT,
    client_id     INT           NOT NULL,
    service_id    INT,
    year          SMALLINT,
    period        VARCHAR(30),
    filename      VARCHAR(255)  NOT NULL,      -- UUID name on disk
    original_name VARCHAR(255)  NOT NULL,
    file_type     VARCHAR(100),
    file_size     INT,
    uploaded_by   INT           NOT NULL,
    uploaded_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (document_id),
    CONSTRAINT fk_doc_client FOREIGN KEY (client_id)
        REFERENCES client(client_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_doc_service FOREIGN KEY (service_id)
        REFERENCES service(service_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_doc_employee FOREIGN KEY (uploaded_by)
        REFERENCES employee(employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);


-- ------------------------------------------------------------
-- client_payment: instalments paid towards an annual fee
-- ------------------------------------------------------------
CREATE TABLE client_payment (
    payment_id    INT           NOT NULL AUTO_INCREMENT,
    client_id     INT           NOT NULL,
    service_id    INT           NOT NULL,
    year          SMALLINT      NOT NULL,
    amount        DECIMAL(10,2) NOT NULL,
    payment_date  DATE          NOT NULL,
    notes         VARCHAR(255),
    created_by    INT           NOT NULL,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (payment_id),
    KEY idx_payment_client_year (client_id, service_id, year),
    CONSTRAINT fk_payment_client FOREIGN KEY (client_id)
        REFERENCES client(client_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_payment_service FOREIGN KEY (service_id)
        REFERENCES service(service_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_payment_employee FOREIGN KEY (created_by)
        REFERENCES employee(employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);


-- ------------------------------------------------------------
-- misc_income: other office income, recorded per employee
-- ------------------------------------------------------------
CREATE TABLE misc_income (
    income_id     INT           NOT NULL AUTO_INCREMENT,
    amount        DECIMAL(10,2) NOT NULL,
    employee_name VARCHAR(100)  NOT NULL,
    description   VARCHAR(255),
    income_date   DATE          NOT NULL,
    created_by    INT           NOT NULL,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (income_id),
    CONSTRAINT fk_misc_employee FOREIGN KEY (created_by)
        REFERENCES employee(employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);


-- ============================================================
-- VIEWS
-- SQL SECURITY INVOKER so the views work for any DB user
-- (no DEFINER tied to root@localhost).
-- ============================================================

-- Pending / overdue services of active clients
CREATE SQL SECURITY INVOKER VIEW v_pending_services AS
    SELECT c.client_id, c.last_name, c.first_name, c.company_name, c.phone,
           s.name AS service_name, s.category,
           cs.status, cs.year, cs.period, cs.due_date,
           cs.amount_billed, cs.amount_paid, cs.amount_remaining
    FROM client_service cs
    JOIN client  c ON cs.client_id  = c.client_id
    JOIN service s ON cs.service_id = s.service_id
    WHERE cs.status IN ('pending', 'in_progress', 'overdue', 'unpaid')
      AND c.is_active = TRUE;

-- One-line summary per client
CREATE SQL SECURITY INVOKER VIEW v_client_summary AS
    SELECT c.client_id, c.last_name, c.first_name, c.company_name,
           c.client_type, c.phone, c.email,
           COUNT(cs.service_id)                         AS total_services,
           SUM(cs.status = 'completed')                 AS completed,
           SUM(cs.status IN ('pending', 'in_progress')) AS in_progress,
           SUM(cs.status = 'overdue')                   AS overdue,
           SUM(IFNULL(cs.amount_billed, 0))             AS total_billed,
           SUM(IFNULL(cs.amount_paid, 0))               AS total_paid
    FROM client c
    LEFT JOIN client_service cs ON c.client_id = cs.client_id
    WHERE c.is_active = TRUE
    GROUP BY c.client_id, c.last_name, c.first_name, c.company_name,
             c.client_type, c.phone, c.email;

-- Employee activity log (admin only)
CREATE SQL SECURITY INVOKER VIEW v_employee_activity AS
    SELECT e.full_name AS employee_name, a.action_type, a.timestamp,
           c.last_name AS client_lastname, a.ip_address, a.details
    FROM action a
    JOIN employee e ON a.employee_id = e.employee_id
    LEFT JOIN client c ON a.client_id = c.client_id;

-- Services of the current year
CREATE SQL SECURITY INVOKER VIEW v_annual_services AS
    SELECT c.client_id, c.last_name, c.first_name, c.company_name, c.client_type,
           s.name AS service_name, s.category,
           cs.status, cs.year, cs.period, cs.amount_billed, cs.amount_paid,
           cs.amount_remaining, cs.due_date, cs.completed_date
    FROM client_service cs
    JOIN client  c ON cs.client_id  = c.client_id
    JOIN service s ON cs.service_id = s.service_id
    WHERE cs.year = YEAR(CURDATE())
      AND c.is_active = TRUE;

-- Client search
CREATE SQL SECURITY INVOKER VIEW v_client_search AS
    SELECT c.client_id, c.last_name, c.first_name, c.company_name,
           c.client_type, c.phone, c.email, c.doy, c.profession, c.is_active
    FROM client c
    WHERE c.is_active = TRUE;
