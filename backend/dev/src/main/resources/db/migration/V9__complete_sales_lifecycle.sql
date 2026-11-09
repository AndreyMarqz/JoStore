ALTER TABLE pedidos DROP CONSTRAINT ck_pedidos_status;
ALTER TABLE pedidos ADD CONSTRAINT ck_pedidos_status CHECK (ped_status IN
 ('EM_PROCESSAMENTO','APROVADA','REPROVADA','EM_TRANSPORTE','ENTREGUE','EM_TROCA','TROCA_AUTORIZADA','TROCADO'));
ALTER TABLE pedidos ADD COLUMN ped_cup_gerado_id UUID REFERENCES cupons(cup_id);
CREATE SEQUENCE pedido_codigo_seq;
SELECT setval('pedido_codigo_seq', COALESCE((SELECT max(substring(ped_codigo from 5)::bigint) FROM pedidos),0)+1, false);
CREATE TABLE reservas_estoque (
 id UUID PRIMARY KEY, cart_id UUID REFERENCES carrinhos(car_id), order_id UUID REFERENCES pedidos(ped_id),
 product_id UUID NOT NULL REFERENCES produtos(pro_id), quantity INTEGER NOT NULL CHECK(quantity > 0),
 expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK ((cart_id IS NULL) <> (order_id IS NULL))
);
CREATE UNIQUE INDEX uq_reserva_carrinho_produto ON reservas_estoque(cart_id,product_id) WHERE cart_id IS NOT NULL;
CREATE INDEX ix_reserva_expira ON reservas_estoque(expires_at);
CREATE INDEX ix_reserva_produto ON reservas_estoque(product_id);
CREATE TABLE itens_carrinho_removidos (
 id UUID PRIMARY KEY, cart_id UUID NOT NULL REFERENCES carrinhos(car_id), product_id UUID NOT NULL REFERENCES produtos(pro_id),
 name VARCHAR(160) NOT NULL, size VARCHAR(10) NOT NULL, quantity INTEGER NOT NULL, reason VARCHAR(300) NOT NULL,
 removed_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE historico_pedidos (
 id UUID PRIMARY KEY, order_id UUID NOT NULL REFERENCES pedidos(ped_id), previous_status VARCHAR(30),
 status VARCHAR(30) NOT NULL, actor VARCHAR(80) NOT NULL, occurred_at TIMESTAMPTZ NOT NULL, description VARCHAR(500) NOT NULL
);
CREATE INDEX ix_historico_pedido ON historico_pedidos(order_id,occurred_at);
CREATE TABLE trocas (
 id UUID PRIMARY KEY, order_id UUID NOT NULL REFERENCES pedidos(ped_id), customer_id UUID NOT NULL REFERENCES clientes(cli_id),
 status VARCHAR(30) NOT NULL CHECK(status IN ('EM_TROCA','TROCA_AUTORIZADA','TROCADO')),
 full_order BOOLEAN NOT NULL, created_at TIMESTAMPTZ NOT NULL, authorized_at TIMESTAMPTZ, received_at TIMESTAMPTZ,
 coupon_id UUID REFERENCES cupons(cup_id)
);
CREATE TABLE itens_troca (
 id UUID PRIMARY KEY, exchange_id UUID NOT NULL REFERENCES trocas(id), order_item_id UUID NOT NULL REFERENCES itens_pedido(ipe_id),
 quantity INTEGER NOT NULL CHECK(quantity > 0), restock BOOLEAN,
 UNIQUE(exchange_id,order_item_id)
);
CREATE INDEX ix_troca_status ON trocas(status,created_at);
CREATE TABLE notificacoes (
 id UUID PRIMARY KEY, customer_id UUID NOT NULL REFERENCES clientes(cli_id), exchange_id UUID NOT NULL REFERENCES trocas(id),
 message VARCHAR(500) NOT NULL, created_at TIMESTAMPTZ NOT NULL, read_at TIMESTAMPTZ,
 UNIQUE(exchange_id)
);
CREATE INDEX ix_notificacao_cliente ON notificacoes(customer_id,created_at);
CREATE INDEX ix_pedido_cliente_status ON pedidos(ped_cli_id,ped_status,ped_created_at);
CREATE INDEX ix_pedido_status ON pedidos(ped_status,ped_created_at);
-- Carrinhos anteriores à implantação recebem um prazo inicial de migração.
INSERT INTO reservas_estoque(id,cart_id,product_id,quantity,expires_at)
 SELECT gen_random_uuid(),ica_car_id,ica_pro_id,sum(ica_quantidade),CURRENT_TIMESTAMP+interval '10 minutes'
 FROM itens_carrinho GROUP BY ica_car_id,ica_pro_id;
