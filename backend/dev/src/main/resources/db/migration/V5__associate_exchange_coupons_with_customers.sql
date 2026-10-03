ALTER TABLE cupons
    ADD COLUMN cup_cli_id UUID REFERENCES clientes (cli_id);

CREATE INDEX idx_cupons_cliente_ativos
    ON cupons (cup_cli_id, cup_ativo);
