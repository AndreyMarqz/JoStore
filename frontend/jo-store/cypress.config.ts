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

export default defineConfig({
  expose: { apiUrl, uiActionDelayMs: Number(process.env.CYPRESS_UI_ACTION_DELAY_MS ?? "1200") },
  trashAssetsBeforeRuns: false,
  defaultCommandTimeout: 10000,
  requestTimeout: 10000,
  responseTimeout: 20000,
  viewportWidth: 1440,
  viewportHeight: 1000,
  e2e: {
    baseUrl: frontendUrl,
    setupNodeEvents(on) {
      on("task", { resetOrderCouponFixtures, countOrderLogs, setProductStock,
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
      on("before:run", async () => { await viteStartup; });
      on("after:run", async () => { await viteServer?.close(); viteServer = undefined; });
    },
  },
});
