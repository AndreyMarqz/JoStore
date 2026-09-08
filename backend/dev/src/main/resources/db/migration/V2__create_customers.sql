ALTER TABLE customers
    ADD CONSTRAINT ck_customers_gender
        CHECK (gender IN ('FEMININO', 'MASCULINO', 'NAO_BINARIO', 'PREFIRO_NAO_INFORMAR'));

ALTER TABLE customers
    ADD CONSTRAINT ck_customers_phone_type
        CHECK (phone_type IN ('CELULAR', 'RESIDENCIAL', 'COMERCIAL'));
