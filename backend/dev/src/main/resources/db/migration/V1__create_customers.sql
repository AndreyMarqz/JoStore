CREATE TABLE customers (
    id UUID PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    cpf VARCHAR(11) NOT NULL UNIQUE,
    gender VARCHAR(30) NOT NULL,
    birth_date DATE NOT NULL,

    phone_type VARCHAR(30) NOT NULL,
    phone_area_code VARCHAR(2) NOT NULL,
    phone_number VARCHAR(9) NOT NULL,

    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(60) NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'ATIVO',
    ranking INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_customers_cpf_format
        CHECK (cpf ~ '^[0-9]{11}$'),

    CONSTRAINT ck_customers_phone_area_code_format
        CHECK (phone_area_code ~ '^[0-9]{2}$'),

    CONSTRAINT ck_customers_phone_number_format
        CHECK (phone_number ~ '^[0-9]{8,9}$'),

    CONSTRAINT ck_customers_status
        CHECK (status IN ('ATIVO', 'INATIVO')),

    CONSTRAINT ck_customers_ranking
        CHECK (ranking >= 0)
);

CREATE UNIQUE INDEX uq_customers_email_lower
    ON customers (LOWER(email));

