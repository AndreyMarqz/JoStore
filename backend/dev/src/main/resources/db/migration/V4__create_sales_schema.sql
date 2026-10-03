CREATE TABLE produtos (
    pro_id UUID PRIMARY KEY,
    pro_codigo VARCHAR(20) NOT NULL UNIQUE,
    pro_nome VARCHAR(160) NOT NULL,
    pro_descricao VARCHAR(1000) NOT NULL,
    pro_preco NUMERIC(12, 2) NOT NULL,
    pro_imagem_url VARCHAR(600),
    pro_ativo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT ck_produtos_preco_positivo CHECK (pro_preco > 0)
);

CREATE TABLE estoques (
    est_id UUID PRIMARY KEY,
    est_pro_id UUID NOT NULL UNIQUE REFERENCES produtos (pro_id),
    est_quantidade_disponivel INTEGER NOT NULL,
    CONSTRAINT ck_estoques_quantidade_nao_negativa CHECK (est_quantidade_disponivel >= 0)
);

CREATE TABLE carrinhos (
    car_id UUID PRIMARY KEY,
    car_cli_id UUID NOT NULL UNIQUE REFERENCES clientes (cli_id),
    car_created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    car_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE itens_carrinho (
    ica_id UUID PRIMARY KEY,
    ica_car_id UUID NOT NULL REFERENCES carrinhos (car_id) ON DELETE CASCADE,
    ica_pro_id UUID NOT NULL REFERENCES produtos (pro_id),
    ica_tamanho VARCHAR(10) NOT NULL,
    ica_quantidade INTEGER NOT NULL,
    CONSTRAINT uq_itens_carrinho_produto_tamanho UNIQUE (ica_car_id, ica_pro_id, ica_tamanho),
    CONSTRAINT ck_itens_carrinho_quantidade_positiva CHECK (ica_quantidade > 0)
);

CREATE TABLE cupons (
    cup_id UUID PRIMARY KEY,
    cup_codigo VARCHAR(40) NOT NULL UNIQUE,
    cup_tipo VARCHAR(20) NOT NULL,
    cup_valor NUMERIC(12, 2) NOT NULL,
    cup_ativo BOOLEAN NOT NULL DEFAULT TRUE,
    cup_descricao VARCHAR(300) NOT NULL,
    cup_criado_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cup_usado_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT ck_cupons_tipo CHECK (cup_tipo IN ('PROMOCIONAL', 'TROCA')),
    CONSTRAINT ck_cupons_valor_positivo CHECK (cup_valor > 0)
);

CREATE TABLE pedidos (
    ped_id UUID PRIMARY KEY,
    ped_codigo VARCHAR(20) NOT NULL UNIQUE,
    ped_cli_id UUID NOT NULL REFERENCES clientes (cli_id),
    ped_end_id UUID NOT NULL REFERENCES enderecos (end_id),
    ped_status VARCHAR(30) NOT NULL,
    ped_subtotal NUMERIC(12, 2) NOT NULL,
    ped_frete NUMERIC(12, 2) NOT NULL,
    ped_desconto_cupons NUMERIC(12, 2) NOT NULL,
    ped_total NUMERIC(12, 2) NOT NULL,
    ped_created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_pedidos_status CHECK (ped_status IN ('EM_PROCESSAMENTO')),
    CONSTRAINT ck_pedidos_valores_nao_negativos CHECK (
        ped_subtotal >= 0 AND ped_frete >= 0 AND ped_desconto_cupons >= 0 AND ped_total >= 0
    )
);

CREATE TABLE itens_pedido (
    ipe_id UUID PRIMARY KEY,
    ipe_ped_id UUID NOT NULL REFERENCES pedidos (ped_id) ON DELETE CASCADE,
    ipe_pro_id UUID NOT NULL REFERENCES produtos (pro_id),
    ipe_codigo_produto VARCHAR(20) NOT NULL,
    ipe_nome_produto VARCHAR(160) NOT NULL,
    ipe_tamanho VARCHAR(10) NOT NULL,
    ipe_preco_unitario NUMERIC(12, 2) NOT NULL,
    ipe_quantidade INTEGER NOT NULL,
    ipe_total NUMERIC(12, 2) NOT NULL,
    CONSTRAINT ck_itens_pedido_quantidade_positiva CHECK (ipe_quantidade > 0)
);

CREATE TABLE pagamentos_pedido (
    ppa_id UUID PRIMARY KEY,
    ppa_ped_id UUID NOT NULL REFERENCES pedidos (ped_id) ON DELETE CASCADE,
    ppa_cart_id UUID NOT NULL REFERENCES cartoes_credito (cart_id),
    ppa_valor NUMERIC(12, 2) NOT NULL,
    CONSTRAINT ck_pagamentos_pedido_valor_positivo CHECK (ppa_valor > 0)
);

CREATE TABLE pedidos_cupons (
    pcu_ped_id UUID NOT NULL REFERENCES pedidos (ped_id) ON DELETE CASCADE,
    pcu_cup_id UUID NOT NULL REFERENCES cupons (cup_id),
    pcu_valor_utilizado NUMERIC(12, 2) NOT NULL,
    PRIMARY KEY (pcu_ped_id, pcu_cup_id),
    CONSTRAINT ck_pedidos_cupons_valor_positivo CHECK (pcu_valor_utilizado > 0)
);

CREATE TABLE logs_operacoes (
    log_id UUID PRIMARY KEY,
    log_responsavel_id UUID,
    log_operacao VARCHAR(40) NOT NULL,
    log_entidade VARCHAR(60) NOT NULL,
    log_dados VARCHAR(1000) NOT NULL,
    log_ocorrido_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO produtos (pro_id, pro_codigo, pro_nome, pro_descricao, pro_preco, pro_imagem_url) VALUES
    ('10000000-0000-0000-0000-000000000001', 'ROP-000001', 'Camisa Xadrez Urban', 'Camisa xadrez de manga longa, indicada para composições casuais e urbanas.', 189.90, 'https://cdn.dummyjson.com/product-images/mens-shirts/man-plaid-shirt/thumbnail.webp'),
    ('10000000-0000-0000-0000-000000000002', 'ROP-000002', 'Camisa Check Azul e Preta', 'Camisa masculina confortável com padronagem xadrez em azul e preto.', 159.90, 'https://cdn.dummyjson.com/product-images/mens-shirts/blue-%26-black-check-shirt/thumbnail.webp'),
    ('10000000-0000-0000-0000-000000000003', 'ROP-000003', 'Camiseta Essential', 'Camiseta leve de modelagem casual para uso diário.', 99.90, 'https://cdn.dummyjson.com/product-images/mens-shirts/gigabyte-aorus-men-tshirt/thumbnail.webp'),
    ('10000000-0000-0000-0000-000000000004', 'ROP-000004', 'Camisa de Manga Curta', 'Camisa de manga curta para dias quentes, com caimento confortável.', 129.90, 'https://cdn.dummyjson.com/product-images/mens-shirts/man-short-sleeve-shirt/thumbnail.webp'),
    ('10000000-0000-0000-0000-000000000005', 'ROP-000005', 'Camisa Check Classic', 'Camisa xadrez versátil para ocasiões casuais ou sociais.', 149.90, 'https://cdn.dummyjson.com/product-images/mens-shirts/men-check-shirt/thumbnail.webp'),
    ('10000000-0000-0000-0000-000000000006', 'ROP-000006', 'Vestido Aura', 'Vestido de modelagem fluida para combinações modernas e minimalistas.', 219.90, 'https://cdn.dummyjson.com/product-images/womens-dresses/black-women%27s-gown/thumbnail.webp');

INSERT INTO estoques (est_id, est_pro_id, est_quantidade_disponivel) VALUES
    ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 20),
    ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 18),
    ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 25),
    ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 14),
    ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 16),
    ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006', 10);

INSERT INTO cupons (cup_id, cup_codigo, cup_tipo, cup_valor, cup_descricao) VALUES
    ('30000000-0000-0000-0000-000000000001', 'JO10', 'PROMOCIONAL', 10.00, 'Cupom promocional de R$ 10,00.'),
    ('30000000-0000-0000-0000-000000000002', 'TROCA20', 'TROCA', 20.00, 'Cupom de troca de R$ 20,00.'),
    ('30000000-0000-0000-0000-000000000003', 'TROCA30', 'TROCA', 30.00, 'Cupom de troca de R$ 30,00.'),
    ('30000000-0000-0000-0000-000000000004', 'TROCA40', 'TROCA', 40.00, 'Cupom de troca de R$ 40,00.');
