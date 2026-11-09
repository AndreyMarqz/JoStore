ALTER TABLE enderecos ADD COLUMN end_perfil BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE cartoes_credito ADD COLUMN cart_perfil BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE pagamentos_pedido ADD COLUMN ppa_last4 VARCHAR(4);
ALTER TABLE pagamentos_pedido ADD COLUMN ppa_descricao VARCHAR(100);
UPDATE pagamentos_pedido p SET ppa_last4=c.cart_last4,ppa_descricao=c.cart_band || ' final ' || c.cart_last4
 FROM cartoes_credito c WHERE c.cart_id=p.ppa_cart_id;
ALTER TABLE pagamentos_pedido ALTER COLUMN ppa_last4 SET NOT NULL;
ALTER TABLE pagamentos_pedido ALTER COLUMN ppa_descricao SET NOT NULL;
