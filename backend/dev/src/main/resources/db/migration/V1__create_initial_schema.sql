CREATE TABLE tipos_residencia (
    tip_resid_id UUID PRIMARY KEY,
    tip_resid_desc VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE tipos_logradouro (
    tip_lograd_id UUID PRIMARY KEY,
    tip_lograd_desc VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE usuarios (
    usu_id UUID PRIMARY KEY,
    usu_email VARCHAR(254) NOT NULL,
    usu_senha VARCHAR(60) NOT NULL
);

CREATE UNIQUE INDEX uq_usuarios_email_lower ON usuarios (LOWER(usu_email));

CREATE TABLE clientes (
    cli_id UUID PRIMARY KEY,
    cli_code VARCHAR(10) NOT NULL UNIQUE,
    cli_nome VARCHAR(150) NOT NULL,
    cli_dta_nasc DATE NOT NULL,
    cli_cpf VARCHAR(11) NOT NULL UNIQUE,
    cli_gen VARCHAR(30) NOT NULL,
    cli_login UUID NOT NULL UNIQUE REFERENCES usuarios (usu_id),
    cli_status VARCHAR(10) NOT NULL DEFAULT 'ATIVO',
    cli_created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cli_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_clientes_cpf_format CHECK (cli_cpf ~ '^[0-9]{11}$'),
    CONSTRAINT ck_clientes_genero CHECK (cli_gen IN ('FEMININO', 'MASCULINO', 'NAO_BINARIO', 'PREFIRO_NAO_INFORMAR')),
    CONSTRAINT ck_clientes_status CHECK (cli_status IN ('ATIVO', 'INATIVO'))
);

CREATE TABLE telefones (
    tel_id UUID PRIMARY KEY,
    tel_cli_id UUID NOT NULL REFERENCES clientes (cli_id),
    tel_tipo VARCHAR(30) NOT NULL,
    tel_ddd VARCHAR(2) NOT NULL,
    tel_num VARCHAR(9) NOT NULL,

    CONSTRAINT ck_telefones_tipo CHECK (tel_tipo IN ('CELULAR', 'RESIDENCIAL', 'COMERCIAL')),
    CONSTRAINT ck_telefones_ddd_format CHECK (tel_ddd ~ '^[0-9]{2}$'),
    CONSTRAINT ck_telefones_num_format CHECK (tel_num ~ '^[0-9]{8,9}$')
);

CREATE TABLE enderecos (
    end_id UUID PRIMARY KEY,
    end_cli_id UUID NOT NULL REFERENCES clientes (cli_id),
    end_nome_ident VARCHAR(60) NOT NULL,
    end_tipo_resid UUID NOT NULL REFERENCES tipos_residencia (tip_resid_id),
    end_tipo_lograd UUID NOT NULL REFERENCES tipos_logradouro (tip_lograd_id),
    end_lograd VARCHAR(150) NOT NULL,
    end_num VARCHAR(20) NOT NULL,
    end_bairro VARCHAR(100) NOT NULL,
    end_cep VARCHAR(8) NOT NULL,
    end_cidade VARCHAR(100) NOT NULL,
    end_estado VARCHAR(2) NOT NULL,
    end_pais VARCHAR(60) NOT NULL,
    end_obs VARCHAR(500),

    CONSTRAINT ck_enderecos_cep_format CHECK (end_cep ~ '^[0-9]{8}$')
);

CREATE TABLE enderecos_finalidades (
    end_id UUID NOT NULL REFERENCES enderecos (end_id) ON DELETE CASCADE,
    end_finalidade VARCHAR(20) NOT NULL,
    PRIMARY KEY (end_id, end_finalidade),
    CONSTRAINT ck_enderecos_finalidades CHECK (end_finalidade IN ('RESIDENCIA', 'COBRANCA', 'ENTREGA'))
);

CREATE TABLE cartoes_credito (
    cart_id UUID PRIMARY KEY,
    cart_cli_id UUID NOT NULL REFERENCES clientes (cli_id),
    cart_last4 VARCHAR(4) NOT NULL,
    cart_nome_impr VARCHAR(150) NOT NULL,
    cart_band VARCHAR(30) NOT NULL,
    cart_pref BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT ck_cartoes_last4_format CHECK (cart_last4 ~ '^[0-9]{4}$'),
    CONSTRAINT ck_cartoes_bandeira CHECK (cart_band IN ('VISA', 'MASTERCARD', 'ELO', 'AMERICAN_EXPRESS'))
);

INSERT INTO tipos_residencia (tip_resid_id, tip_resid_desc) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Casa'),
    ('00000000-0000-0000-0000-000000000002', 'Apartamento'),
    ('00000000-0000-0000-0000-000000000003', 'Condomínio'),
    ('00000000-0000-0000-0000-000000000004', 'Kitnet'),
    ('00000000-0000-0000-0000-000000000005', 'Sobrado'),
    ('00000000-0000-0000-0000-000000000006', 'Comercial'),
    ('00000000-0000-0000-0000-000000000007', 'Outro');

INSERT INTO tipos_logradouro (tip_lograd_id, tip_lograd_desc) VALUES
    ('00000000-0000-0000-0000-000000000101', 'Rua'),
    ('00000000-0000-0000-0000-000000000102', 'Avenida'),
    ('00000000-0000-0000-0000-000000000103', 'Alameda'),
    ('00000000-0000-0000-0000-000000000104', 'Travessa'),
    ('00000000-0000-0000-0000-000000000105', 'Estrada'),
    ('00000000-0000-0000-0000-000000000106', 'Rodovia'),
    ('00000000-0000-0000-0000-000000000107', 'Praça');
