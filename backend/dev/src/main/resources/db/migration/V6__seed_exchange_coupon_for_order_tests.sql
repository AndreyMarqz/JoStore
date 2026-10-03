INSERT INTO cupons (cup_id, cup_codigo, cup_tipo, cup_valor, cup_descricao)
VALUES (
    '30000000-0000-0000-0000-000000000005',
    'TROCA150',
    'TROCA',
    150.00,
    'Cupom de troca de R$ 150,00 para cenários de pagamento e testes automatizados.'
)
ON CONFLICT (cup_codigo) DO NOTHING;
