# JoStore — ciclo de vendas

## Executar o sistema

No diretório `backend/dev`, iniciar PostgreSQL (`docker compose up -d postgres`) e executar `./mvnw.cmd spring-boot:run`. Flyway aplica as migrations V9 e V10 incrementais; não é necessário apagar o banco.

No diretório `frontend/jo-store`, executar `npm.cmd run dev`. O front usa a API configurada em `VITE_API_URL` (padrão `http://localhost:8080/api/v1`).

O contrato adicional está em `backend/dev/src/main/resources/openapi/sales-api.yaml`; os schemas de cliente são referenciados pelo arquivo `customer-api.yaml` da mesma pasta.

## Demonstração automatizada

1. Em `backend/dev`: `docker compose --profile e2e up -d postgres-e2e`.
2. Na mesma pasta, com a API parada: `./mvnw.cmd clean verify`. Depois iniciar o artefato: `java -jar target/dev-0.0.1-SNAPSHOT.jar --spring.profiles.active=e2e --server.port=8081`.
3. Em `frontend/jo-store`: `npm.cmd run cy:apresentacao`.
4. Selecionar os arquivos de `cypress/e2e/pedidos` e `cypress/e2e/vendas`. O frontend E2E é iniciado automaticamente na porta 5174.

Para executar todos automaticamente: `npm.cmd run cy:vendas`. Para escolher o ritmo: `npm.cmd run cy:vendas -- --expose uiActionDelayMs=1800`. O modo apresentação usa 1,8 segundo de pausa antes/depois das ações com helpers. As esperas por resposta continuam condicionadas à API/estado, e não dependem dessas pausas.

Executar a apresentação a partir do JAR evita que a API dependa dos `.class` de `target/classes` durante os testes. Não executar limpeza/recompilação do artefato em uso; parar a API, gerar novamente e reiniciar quando houver alteração no backend.

Os testes usam somente `jostore_e2e`, porta 5433. As tarefas de fixtures recusam outro nome de banco. Antes de liberar carrinhos e restaurar estoque entre cenários, aguardam o término do processamento dos pedidos anteriores (até 20 segundos), evitando interferência da rotina automática. Não devem ser apontadas ao banco de desenvolvimento. Dados de cenários anteriores podem permanecer para inspeção. Testes Java criam PostgreSQL descartável via Testcontainers: `./mvnw.cmd test`.

## Comportamento

- Frete: R$ 15,00 + R$ 2,00 por peça + R$ 10,00 para entrega fora de SP.
- Reserva: 600 segundos por padrão, renovados pela inclusão de item. Propriedade `jostore.cart.reservation-seconds`; aviso nos últimos 300 segundos. Alteração de quantidade não renova o prazo.
- A listagem mantém os itens expirados visíveis separadamente e exige adicioná-los novamente. Sem itens ativos, comprar fica desabilitado.
- Criação retorna EM PROCESSAMENTO. Uma rotina periódica valida o pagamento após a gravação. O estado é persistido; a rotina retoma pedidos pendentes após reiniciar a aplicação.
- Simulação: cartão sintético válido `4111111111170000` é recusado por terminar em 0000; `4111111111111111` aprova. Não há integração financeira real.
- Aprovação consome cupons e baixa estoque; reprovação libera reservas sem baixa e sem consumir cupons. Crédito excedente só é emitido depois da aprovação.
- Despacho e confirmação de entrega são ações administrativas. As transições também são verificadas pela API.
- Troca parcial acompanha status próprio e preserva o pedido ENTREGUE para os demais itens. Troca integral acompanha também o status do pedido.
- Recebimento exige autorização; uma repetição é rejeitada e não duplica cupom/reentrada. O cupom usa o preço registrado dos itens, sem frete. O administrador pode marcar reentrada por item; por padrão, está marcada.
- Autorização cria notificação persistida. Cupons e notificações aparecem junto aos pedidos do cliente, incluindo a ação de marcar a notificação como lida.
- Endereços e cartões criados no checkout têm opção de serem incorporados ao perfil. Se desmarcada, continuam vinculados à compra, mas não aparecem na manutenção do perfil.
- Escritas do ciclo de vendas usam transações com bloqueio consultivo PostgreSQL para impedir concorrência entre reserva, expiração e processamento. A simulação local mantém a sessão já existente; autenticação/autorização real segue fora desta entrega.

## Rastreabilidade do roteiro

| Cenário | Requisitos do DRS | Automação |
|---|---|---|
| Inclusão, quantidade, exclusão, indisponibilidade | RF0031, RF0032, RN0031 | pedidos/gerenciar-itens-no-carrinho |
| Frete e checkout | RF0033, RF0034 | pedidos/iniciar-checkout-e-calcular-frete |
| Endereço e cartão existentes/novos, salvar no perfil opcional | RF0035, RF0036, RN0023, RN0024, RN0025 | pedidos e vendas/checkout |
| Dois cartões e mínimo de R$ 10,00 | RN0034 | pedidos/cartoes-e-rateio |
| Promocional único, cartão abaixo de R$ 10,00 com cupom, diferença e excesso desnecessário | RF0037, RN0033, RN0035, RN0036 | pedidos/cupons-e-pagamentos |
| Criação EM PROCESSAMENTO e log | RF0038, RNF0012 | pedidos/finalizar-pedido |
| Aprovação/reprovação, reserva e baixa | RN0037, RN0038, RN0028, RF0053 | vendas/pagamentos |
| Aviso, expiração e revalidação | RN0032, RN0044, RN0045, RNF0042 | vendas/carrinho |
| Despacho e entrega | RF0039, RF0040, RN0039, RN0040 | vendas/administracao |
| Troca parcial/integral, autorização e consulta | RF0041, RF0042, RF0043, RN0041, RN0043 | vendas/trocas |
| Recebimento, cupom, reentrada e notificação | RF0044, RF0045, RF0054, RN0042, RN0046 | vendas/trocas |
| Reutilização do cupom | RF0037, RF0045 | vendas/trocas |
| Concorrência, idempotência, persistência de correção e consulta <1s | RN0031, RN0032, RNF0011 | SalesLifecycleIntegrationTest |

## Divergências documentais e decisões

O DRS anexado prevalece. Nele, RF0037 é uso de cupom, RF0038 é finalizar, RF0039 despachar, RF0040 confirmar entrega e RF0041–RF0045 cobrem troca. A tarefa desloca vários desses números. RN0045 é retirada do produto; RN0046 é notificação. No DRS, RNF0045/RNF0046 são legenda/interatividade de gráficos, portanto não foram apresentados como requisitos de reserva/notificação.

RF0044/RN0042 mencionam recebimento em EM TROCA, enquanto RF0042 estabelece TROCA AUTORIZADA. A sequência implementada exige autorização antes de receber, conforme ciclo explícito da atividade. A soma de itens sem frete e o prazo padrão de 10 minutos são decisões aprovadas para o projeto, não novos requisitos atribuídos ao DRS.

RNF0011: o teste de integração mede uma consulta após aquecimento no ambiente local. Esse resultado não representa um ensaio de carga ou garantia de latência em qualquer ambiente.

Não fazem parte do ciclo: estorno no cartão, recusa administrativa de troca e estados de cancelamento inventados pelo protótipo.

## Verificação técnica — 23/10/2026

- `./mvnw.cmd test -q`: 12 testes Java, sem falhas ou erros. Inclui concorrência pela última unidade, expiração, correção persistida do carrinho, aprovação/reprovação e proteção contra recebimento duplicado de troca.
- `npm.cmd run build`: concluído. O Vite mantém um aviso de tamanho do bundle, sem impedir a compilação.
- Cypress E2E: 24 de 24 testes passaram em 11 arquivos, cobrindo as suítes de pedidos e vendas. A execução completa levou 7 min 19 s com pausa de 150 ms por ação; a configuração para apresentação usa 1,8 s.
- Verificação TypeScript dos novos testes de vendas: concluída sem erros.
- ESLint dos módulos alterados, componentes de vendas/notificação e suporte E2E: concluído sem erros.
- O lint global ainda aponta 3 erros e 8 avisos de hooks em `App.tsx` e `CheckoutPage.tsx`, relacionados a efeitos e dependências já presentes nessas telas. Esse passivo não foi ocultado por desabilitação global de regras.

Na finalização, o frontend suspende as cotações enquanto envia o pedido e impede cliques duplicados. Uma resposta de cotação antiga não pode substituir a confirmação da compra. Os testes validam o status inicial pela resposta HTTP e os estados posteriores pela interface de pedidos.
