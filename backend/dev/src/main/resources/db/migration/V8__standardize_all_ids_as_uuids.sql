CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Os tipos de residência e logradouro eram a única parte do modelo que ainda
-- usava BIGINT. Cria um mapa antes de trocar as chaves, preservando os
-- relacionamentos já existentes em enderecos.
CREATE TEMP TABLE migration_residence_type_ids ON COMMIT DROP AS
SELECT tip_resid_id AS old_id, tip_resid_desc AS description, gen_random_uuid() AS new_id
FROM tipos_residencia;

CREATE TEMP TABLE migration_public_place_type_ids ON COMMIT DROP AS
SELECT tip_lograd_id AS old_id, tip_lograd_desc AS description, gen_random_uuid() AS new_id
FROM tipos_logradouro;

ALTER TABLE enderecos DROP CONSTRAINT enderecos_end_tipo_resid_fkey;
ALTER TABLE enderecos DROP CONSTRAINT enderecos_end_tipo_lograd_fkey;
ALTER TABLE tipos_residencia DROP CONSTRAINT tipos_residencia_pkey;
ALTER TABLE tipos_logradouro DROP CONSTRAINT tipos_logradouro_pkey;

ALTER TABLE enderecos ADD COLUMN migration_end_tipo_resid UUID;
UPDATE enderecos e
SET migration_end_tipo_resid = m.new_id
FROM migration_residence_type_ids m
WHERE e.end_tipo_resid = m.old_id;
ALTER TABLE enderecos DROP COLUMN end_tipo_resid;
ALTER TABLE enderecos RENAME COLUMN migration_end_tipo_resid TO end_tipo_resid;
ALTER TABLE enderecos ALTER COLUMN end_tipo_resid SET NOT NULL;

ALTER TABLE enderecos ADD COLUMN migration_end_tipo_lograd UUID;
UPDATE enderecos e
SET migration_end_tipo_lograd = m.new_id
FROM migration_public_place_type_ids m
WHERE e.end_tipo_lograd = m.old_id;
ALTER TABLE enderecos DROP COLUMN end_tipo_lograd;
ALTER TABLE enderecos RENAME COLUMN migration_end_tipo_lograd TO end_tipo_lograd;
ALTER TABLE enderecos ALTER COLUMN end_tipo_lograd SET NOT NULL;

ALTER TABLE tipos_residencia DROP COLUMN tip_resid_id;
ALTER TABLE tipos_residencia ADD COLUMN tip_resid_id UUID;
UPDATE tipos_residencia t
SET tip_resid_id = m.new_id
FROM migration_residence_type_ids m
WHERE t.tip_resid_desc = m.description;

ALTER TABLE tipos_logradouro DROP COLUMN tip_lograd_id;
ALTER TABLE tipos_logradouro ADD COLUMN tip_lograd_id UUID;
UPDATE tipos_logradouro t
SET tip_lograd_id = m.new_id
FROM migration_public_place_type_ids m
WHERE t.tip_lograd_desc = m.description;

ALTER TABLE tipos_residencia ALTER COLUMN tip_resid_id SET NOT NULL;
ALTER TABLE tipos_logradouro ALTER COLUMN tip_lograd_id SET NOT NULL;
ALTER TABLE tipos_residencia ADD PRIMARY KEY (tip_resid_id);
ALTER TABLE tipos_logradouro ADD PRIMARY KEY (tip_lograd_id);
ALTER TABLE enderecos ADD CONSTRAINT enderecos_end_tipo_resid_fkey
    FOREIGN KEY (end_tipo_resid) REFERENCES tipos_residencia (tip_resid_id);
ALTER TABLE enderecos ADD CONSTRAINT enderecos_end_tipo_lograd_fkey
    FOREIGN KEY (end_tipo_lograd) REFERENCES tipos_logradouro (tip_lograd_id);

-- Substitui apenas os UUIDs previsíveis usados pelos seeds do catálogo.
CREATE TEMP TABLE migration_product_ids ON COMMIT DROP AS
SELECT pro_id AS old_id, gen_random_uuid() AS new_id
FROM produtos
WHERE pro_id::TEXT ~ '^10000000-0000-0000-0000-0000000000(0[0-9]|1[0-5])$';

ALTER TABLE estoques DROP CONSTRAINT estoques_est_pro_id_fkey;
ALTER TABLE itens_carrinho DROP CONSTRAINT itens_carrinho_ica_pro_id_fkey;
ALTER TABLE itens_pedido DROP CONSTRAINT itens_pedido_ipe_pro_id_fkey;
UPDATE estoques e SET est_pro_id = m.new_id FROM migration_product_ids m WHERE e.est_pro_id = m.old_id;
UPDATE itens_carrinho i SET ica_pro_id = m.new_id FROM migration_product_ids m WHERE i.ica_pro_id = m.old_id;
UPDATE itens_pedido i SET ipe_pro_id = m.new_id FROM migration_product_ids m WHERE i.ipe_pro_id = m.old_id;
UPDATE produtos p SET pro_id = m.new_id FROM migration_product_ids m WHERE p.pro_id = m.old_id;
ALTER TABLE estoques ADD CONSTRAINT estoques_est_pro_id_fkey
    FOREIGN KEY (est_pro_id) REFERENCES produtos (pro_id);
ALTER TABLE itens_carrinho ADD CONSTRAINT itens_carrinho_ica_pro_id_fkey
    FOREIGN KEY (ica_pro_id) REFERENCES produtos (pro_id);
ALTER TABLE itens_pedido ADD CONSTRAINT itens_pedido_ipe_pro_id_fkey
    FOREIGN KEY (ipe_pro_id) REFERENCES produtos (pro_id);

UPDATE estoques
SET est_id = gen_random_uuid()
WHERE est_id::TEXT ~ '^20000000-0000-0000-0000-0000000000(0[0-9]|1[0-5])$';

CREATE TEMP TABLE migration_coupon_ids ON COMMIT DROP AS
SELECT cup_id AS old_id, gen_random_uuid() AS new_id
FROM cupons
WHERE cup_id::TEXT ~ '^30000000-0000-0000-0000-00000000000[0-5]$';

ALTER TABLE pedidos_cupons DROP CONSTRAINT pedidos_cupons_pcu_cup_id_fkey;
UPDATE pedidos_cupons p SET pcu_cup_id = m.new_id FROM migration_coupon_ids m WHERE p.pcu_cup_id = m.old_id;
UPDATE cupons c SET cup_id = m.new_id FROM migration_coupon_ids m WHERE c.cup_id = m.old_id;
ALTER TABLE pedidos_cupons ADD CONSTRAINT pedidos_cupons_pcu_cup_id_fkey
    FOREIGN KEY (pcu_cup_id) REFERENCES cupons (cup_id);
