import { defineConfig } from "cypress";
import { Client } from "pg";
import { createServer, type ViteDevServer } from "vite";

const frontendUrl = "http://localhost:5174";
const apiUrl = process.env.JOSTORE_E2E_API_URL ?? "http://localhost:8081/api/v1";
let viteServer: ViteDevServer | undefined;

async function isFrontendAvailable() {
  try { return (await fetch(frontendUrl)).ok; } catch { return false; }
}
const viteStartup = (async () => {
  if (await isFrontendAvailable()) return;
  viteServer = await createServer({ mode: "e2e", server: { host: "localhost", port: 5174, strictPort: true } });
  await viteServer.listen();
})();

async function withDatabase<T>(action: (client: Client) => Promise<T>) {
  const client = new Client({
    host: process.env.JOSTORE_E2E_DB_HOST ?? "localhost",
    port: Number(process.env.JOSTORE_E2E_DB_PORT ?? "5433"),
    user: process.env.JOSTORE_E2E_DB_USER ?? "jostore",
    password: process.env.JOSTORE_E2E_DB_PASSWORD ?? "jostore_dev",
    database: process.env.JOSTORE_E2E_DB_NAME ?? "jostore_e2e",
  });
  await client.connect();
  try {
    const database = await client.query("SELECT current_database() AS name");
    if (database.rows[0].name !== "jostore_e2e") throw new Error("Fixtures permitidas somente no banco isolado jostore_e2e.");
    return await action(client);
  } finally { await client.end(); }
}

/**
 * As fixtures Cypress manipulam exclusivamente o banco jostore_e2e. Sem esta
 * verificação, uma API iniciada no perfil padrão parece "funcionar", mas os
 * testes recebem dados de outro banco e falham com resultados enganosos.
 */
async function assertApiUsesE2eDatabase() {
  const expectedStock = await withDatabase(async (client) => {
    const result = await client.query<{ quantity: number }>(`
      SELECT e.est_quantidade_disponivel AS quantity
      FROM estoques e
      JOIN produtos p ON p.pro_id = e.est_pro_id
      WHERE p.pro_codigo = 'ROP-000003'
    `);
    return result.rows[0]?.quantity;
  });

  const response = await fetch(`${apiUrl}/products`);
  if (!response.ok) {
    throw new Error(`A API E2E não respondeu em ${apiUrl} (HTTP ${response.status}).`);
  }

  const products = await response.json() as Array<{ code: string; availableQuantity: number }>;
  const product = products.find((item) => item.code === "ROP-000003");
  if (!product || product.availableQuantity !== expectedStock) {
    throw new Error(
      "A API em 8081 não está conectada ao banco jostore_e2e. "
      + "Inicie o back-end com SPRING_PROFILES_ACTIVE=e2e antes de executar o Cypress.",
    );
  }
}

const resetOrderCouponFixtures = () => withDatabase(async (client) => {
  await client.query(`
    INSERT INTO cupons (cup_id, cup_codigo, cup_tipo, cup_valor, cup_descricao, cup_ativo, cup_cli_id, cup_usado_at)
    VALUES
      ('40000000-0000-0000-0000-000000000080', 'E2E-TROCA-80', 'TROCA', 80.00, 'Fixture E2E de R$ 80,00.', TRUE, NULL, NULL),
      ('40000000-0000-0000-0000-000000000050', 'E2E-TROCA-50', 'TROCA', 50.00, 'Fixture E2E de R$ 50,00.', TRUE, NULL, NULL),
      ('40000000-0000-0000-0000-000000000040', 'E2E-TROCA-40', 'TROCA', 40.00, 'Fixture E2E de R$ 40,00.', TRUE, NULL, NULL),
      ('40000000-0000-0000-0000-000000013990', 'E2E-TROCA-13990', 'TROCA', 139.90, 'Fixture E2E de R$ 139,90.', TRUE, NULL, NULL),
      ('40000000-0000-0000-0000-000000000110', 'E2E-PROMO-110', 'PROMOCIONAL', 110.00, 'Fixture E2E promocional de R$ 110,00.', TRUE, NULL, NULL),
      ('40000000-0000-0000-0000-000000000010', 'E2E-PROMO-10', 'PROMOCIONAL', 10.00, 'Fixture E2E promocional de R$ 10,00.', TRUE, NULL, NULL)
    ON CONFLICT (cup_codigo) DO UPDATE SET cup_ativo = TRUE, cup_cli_id = NULL, cup_usado_at = NULL`);
  return null;
});

const countOrderLogs = () => withDatabase(async (client) => {
  const result = await client.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM logs_operacoes WHERE log_entidade = 'PEDIDO'");
  return Number(result.rows[0].count);
});

const setProductStock = ({ code, quantity }: { code: string; quantity: number }) => withDatabase(async (client) => {
  const result = await client.query(
    "UPDATE estoques e SET est_quantidade_disponivel = $2 FROM produtos p WHERE e.est_pro_id = p.pro_id AND p.pro_codigo = $1",
    [code, quantity],
  );
  if (result.rowCount !== 1) throw new Error(`Produto ${code} não encontrado para fixture E2E.`);
  return null;
});

const resetAnalyticsFixtures = () => withDatabase(async (client) => {
  const customer = "90000000-0000-0000-0000-000000000001";
  const user = "90000000-0000-0000-0000-000000000002";
  const address = "90000000-0000-0000-0000-000000000003";
  const deliveredJanuary = "90000000-0000-0000-0000-000000000101";
  const deliveredFebruary = "90000000-0000-0000-0000-000000000102";
  const approved = "90000000-0000-0000-0000-000000000103";
  const toBeDelivered = "90000000-0000-0000-0000-000000000104";
  await client.query("BEGIN");
  try {
    // A massa visual das migrations V12/V13 nÃ£o participa dos cenÃ¡rios
    // determinÃ­sticos desta spec. Ela permanece exclusiva ao banco principal.
    await client.query("DELETE FROM historico_pedidos h USING pedidos p WHERE h.order_id = p.ped_id AND p.ped_codigo LIKE 'PED-ANL-%'");
    await client.query("DELETE FROM pedidos WHERE ped_codigo LIKE 'PED-ANL-%'");
    await client.query("DELETE FROM historico_pedidos WHERE order_id = ANY($1::uuid[])", [[deliveredJanuary, deliveredFebruary, approved, toBeDelivered]]);
    await client.query("DELETE FROM pedidos WHERE ped_id = ANY($1::uuid[])", [[deliveredJanuary, deliveredFebruary, approved, toBeDelivered]]);
    await client.query("DELETE FROM enderecos WHERE end_id=$1", [address]);
    await client.query("DELETE FROM clientes WHERE cli_id=$1", [customer]);
    await client.query("DELETE FROM usuarios WHERE usu_id=$1", [user]);
    await client.query("INSERT INTO usuarios(usu_id,usu_email,usu_senha) VALUES($1,'analise.e2e@jostore.test','Senha@123')", [user]);
    await client.query("INSERT INTO clientes(cli_id,cli_code,cli_nome,cli_dta_nasc,cli_cpf,cli_gen,cli_login,cli_status) VALUES($1,'CLI-900002','Cliente Análise E2E','1995-01-01','90000000001','FEMININO',$2,'ATIVO')", [customer, user]);
    await client.query("INSERT INTO enderecos(end_id,end_cli_id,end_nome_ident,end_tipo_resid,end_tipo_lograd,end_lograd,end_num,end_bairro,end_cep,end_cidade,end_estado,end_pais) VALUES($1,$2,'Casa E2E',(SELECT tip_resid_id FROM tipos_residencia WHERE tip_resid_desc='Casa'),(SELECT tip_lograd_id FROM tipos_logradouro WHERE tip_lograd_desc='Rua'),'Rua E2E','1','Centro','01001000','São Paulo','SP','Brasil')", [address, customer]);
    await client.query("INSERT INTO enderecos_finalidades(end_id,end_finalidade) VALUES($1,'RESIDENCIA'),($1,'COBRANCA'),($1,'ENTREGA')", [address]);
    await client.query(`INSERT INTO pedidos(ped_id,ped_codigo,ped_cli_id,ped_end_id,ped_status,ped_subtotal,ped_frete,ped_desconto_cupons,ped_total,ped_created_at) VALUES
      ($1,'PED-ANA-001',$5,$6,'ENTREGUE',379.80,0,0,379.80,'2026-01-15T12:00:00Z'),
      ($2,'PED-ANA-002',$5,$6,'ENTREGUE',379.80,0,0,379.80,'2026-02-12T12:00:00Z'),
      ($3,'PED-ANA-003',$5,$6,'APROVADA',99.90,0,0,99.90,'2026-02-18T12:00:00Z'),
      ($4,'PED-ANA-004',$5,$6,'APROVADA',189.90,0,0,189.90,'2026-03-10T12:00:00Z')`, [deliveredJanuary, deliveredFebruary, approved, toBeDelivered, customer, address]);
    await client.query(`INSERT INTO itens_pedido(ipe_id,ipe_ped_id,ipe_pro_id,ipe_codigo_produto,ipe_nome_produto,ipe_tamanho,ipe_preco_unitario,ipe_quantidade,ipe_total) VALUES
      ('90000000-0000-0000-0000-000000000201',$1,(SELECT pro_id FROM produtos WHERE pro_codigo='ROP-000001'),'ROP-000001','Camisa Xadrez Urban','M',189.90,2,379.80),
      ('90000000-0000-0000-0000-000000000202',$2,(SELECT pro_id FROM produtos WHERE pro_codigo='ROP-000002'),'ROP-000002','Camisa Check Azul e Preta','M',159.90,1,159.90),
      ('90000000-0000-0000-0000-000000000203',$2,(SELECT pro_id FROM produtos WHERE pro_codigo='ROP-000006'),'ROP-000006','Vestido Aura','M',219.90,1,219.90),
      ('90000000-0000-0000-0000-000000000204',$3,(SELECT pro_id FROM produtos WHERE pro_codigo='ROP-000003'),'ROP-000003','Camiseta Essential','M',99.90,1,99.90),
      ('90000000-0000-0000-0000-000000000205',$4,(SELECT pro_id FROM produtos WHERE pro_codigo='ROP-000001'),'ROP-000001','Camisa Xadrez Urban','M',189.90,1,189.90)`, [deliveredJanuary, deliveredFebruary, approved, toBeDelivered]);
    await client.query(`INSERT INTO historico_pedidos(id,order_id,previous_status,status,actor,occurred_at,description) VALUES
      ('90000000-0000-0000-0000-000000000301',$1,'EM_TRANSPORTE','ENTREGUE','ADMINISTRADOR','2026-01-15T12:00:00Z','Entrega confirmada.'),
      ('90000000-0000-0000-0000-000000000302',$2,'EM_TRANSPORTE','ENTREGUE','ADMINISTRADOR','2026-02-12T12:00:00Z','Entrega confirmada.')`, [deliveredJanuary, deliveredFebruary]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  return null;
});

const markAnalyticsOrderDelivered = () => withDatabase(async (client) => {
  await client.query("UPDATE pedidos SET ped_status='ENTREGUE' WHERE ped_id=$1", ["90000000-0000-0000-0000-000000000104"]);
  await client.query("INSERT INTO historico_pedidos(id,order_id,previous_status,status,actor,occurred_at,description) VALUES('90000000-0000-0000-0000-000000000303','90000000-0000-0000-0000-000000000104','EM_TRANSPORTE','ENTREGUE','ADMINISTRADOR','2026-03-18T12:00:00Z','Entrega confirmada.') ON CONFLICT (id) DO NOTHING");
  return null;
});

export default defineConfig({
  expose: { apiUrl, uiActionDelayMs: Number(process.env.CYPRESS_UI_ACTION_DELAY_MS ?? "1800") },
  trashAssetsBeforeRuns: false,
  defaultCommandTimeout: 10000,
  requestTimeout: 10000,
  responseTimeout: 20000,
  viewportWidth: 1440,
  viewportHeight: 1000,
  e2e: {
    baseUrl: frontendUrl,
    setupNodeEvents(on) {
      on("task", { resetOrderCouponFixtures, countOrderLogs, setProductStock, resetAnalyticsFixtures, markAnalyticsOrderDelivered,
        resetSalesFixtures: () => withDatabase(async client => {
          // Um pedido do teste anterior pode ainda estar na fila automática.
          // Não restaurar estoque/cupons enquanto esse pedido está sendo aprovado.
          for (let attempt = 0; ; attempt++) {
            const pending = await client.query("SELECT count(*)::int AS count FROM pedidos WHERE ped_status='EM_PROCESSAMENTO'");
            if (pending.rows[0].count === 0) break;
            if (attempt >= 100) throw new Error("Há pedidos E2E sem processamento após 20 segundos. Verifique a rotina automática da API.");
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          await client.query("BEGIN");
          try {
            await client.query("SELECT pg_advisory_xact_lock(74819325)");
            await client.query("DELETE FROM reservas_estoque WHERE cart_id IS NOT NULL");
            await client.query("DELETE FROM itens_carrinho");
            await client.query("DELETE FROM itens_carrinho_removidos");
            await client.query("UPDATE estoques e SET est_quantidade_disponivel=CASE WHEN p.pro_codigo='ROP-000006' THEN 10 ELSE 30 END FROM produtos p WHERE p.pro_id=e.est_pro_id");
            await client.query("COMMIT");
          } catch(e) { await client.query("ROLLBACK"); throw e; }
          return null;
        }),
        salesSnapshot: ({ customerId, productId }: { customerId: string; productId: string }) => withDatabase(async client => {
          const stock = await client.query("SELECT est_quantidade_disponivel AS quantity FROM estoques WHERE est_pro_id=$1",[productId]);
          const reservations = await client.query("SELECT COALESCE(sum(quantity),0)::int AS quantity FROM reservas_estoque WHERE product_id=$1",[productId]);
          const orders = await client.query("SELECT ped_id AS id,ped_status AS status FROM pedidos WHERE ped_cli_id=$1 ORDER BY ped_created_at DESC",[customerId]);
          return { stock: stock.rows[0].quantity, reserved: reservations.rows[0].quantity, orders: orders.rows };
        }),
      });
      on("before:run", async () => {
        await viteStartup;
        await assertApiUsesE2eDatabase();
      });
      on("after:run", async () => { await viteServer?.close(); viteServer = undefined; });
    },
  },
});
