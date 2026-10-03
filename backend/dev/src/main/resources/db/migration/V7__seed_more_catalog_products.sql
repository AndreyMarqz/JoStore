INSERT INTO produtos (pro_id, pro_codigo, pro_nome, pro_descricao, pro_preco, pro_imagem_url) VALUES
    ('10000000-0000-0000-0000-000000000007', 'ROP-000007', 'Jaqueta Street Denim', 'Jaqueta jeans de corte contemporâneo para sobreposições urbanas.', 249.90, 'https://cdn.dummyjson.com/product-images/mens-shirts/man-plaid-shirt/thumbnail.webp'),
    ('10000000-0000-0000-0000-000000000008', 'ROP-000008', 'Calça Alfaiataria Soho', 'Calça de alfaiataria com caimento reto e acabamento minimalista.', 199.90, 'https://cdn.dummyjson.com/product-images/mens-shirts/blue-%26-black-check-shirt/thumbnail.webp'),
    ('10000000-0000-0000-0000-000000000009', 'ROP-000009', 'Moletom Essential', 'Moletom confortável de tecido macio para os dias mais frios.', 179.90, 'https://cdn.dummyjson.com/product-images/mens-shirts/gigabyte-aorus-men-tshirt/thumbnail.webp'),
    ('10000000-0000-0000-0000-000000000010', 'ROP-000010', 'Blazer Linear', 'Blazer feminino versátil com linhas limpas e modelagem moderna.', 289.90, 'https://cdn.dummyjson.com/product-images/womens-dresses/black-women%27s-gown/thumbnail.webp'),
    ('10000000-0000-0000-0000-000000000011', 'ROP-000011', 'Saia Midi Sienna', 'Saia midi fluida para combinações casuais e elegantes.', 139.90, 'https://cdn.dummyjson.com/product-images/womens-dresses/black-women%27s-gown/thumbnail.webp'),
    ('10000000-0000-0000-0000-000000000012', 'ROP-000012', 'Regata Rib Black', 'Regata canelada essencial para compor diferentes estilos.', 79.90, 'https://cdn.dummyjson.com/product-images/mens-shirts/man-short-sleeve-shirt/thumbnail.webp'),
    ('10000000-0000-0000-0000-000000000013', 'ROP-000013', 'Camisa Linho Areia', 'Camisa de linho leve para uma proposta sofisticada e descontraída.', 169.90, 'https://cdn.dummyjson.com/product-images/mens-shirts/men-check-shirt/thumbnail.webp'),
    ('10000000-0000-0000-0000-000000000014', 'ROP-000014', 'Tricô Horizonte', 'Tricô de textura suave com acabamento premium.', 189.90, 'https://cdn.dummyjson.com/product-images/mens-shirts/gigabyte-aorus-men-tshirt/thumbnail.webp'),
    ('10000000-0000-0000-0000-000000000015', 'ROP-000015', 'Vestido Noite Minimal', 'Vestido de linhas minimalistas para ocasiões especiais.', 269.90, 'https://cdn.dummyjson.com/product-images/womens-dresses/black-women%27s-gown/thumbnail.webp')
ON CONFLICT (pro_codigo) DO NOTHING;

INSERT INTO estoques (est_id, est_pro_id, est_quantidade_disponivel) VALUES
    ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000007', 15),
    ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000008', 18),
    ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000009', 22),
    ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000010', 12),
    ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000011', 20),
    ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000012', 25),
    ('20000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000013', 16),
    ('20000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000014', 14),
    ('20000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000015', 10)
ON CONFLICT (est_pro_id) DO NOTHING;
