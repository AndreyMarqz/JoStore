-- O gerador de códigos de clientes usa o sufixo numérico de CLI-XXXXXX.
-- Normaliza exclusivamente a conta criada pela massa de demonstração analítica.
UPDATE clientes
SET cli_code = 'CLI-900001'
WHERE cli_code = 'CLI-ANL01';

UPDATE clientes
SET cli_code = 'CLI-900002'
WHERE cli_code = 'CLI-E2E01';
