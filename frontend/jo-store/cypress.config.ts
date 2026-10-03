import { defineConfig } from "cypress";
import { Client } from "pg";
import { createServer, type ViteDevServer } from "vite";

const frontendUrl = "http://localhost:5173";
let viteServer: ViteDevServer | undefined;

async function isFrontendAvailable() {
  try {
    return (await fetch(frontendUrl)).ok;
  } catch {
    return false;
  }
}

const viteStartup = (async () => {
  if (await isFrontendAvailable()) return;

  viteServer = await createServer({
    server: { host: "localhost", port: 5173, strictPort: true },
  });
  await viteServer.listen();
})();

async function withDatabase<T>(action: (client: Client) => Promise<T>) {
  const client = new Client({
    host: process.env.JOSTORE_E2E_DB_HOST ?? "localhost",
    port: Number(process.env.JOSTORE_E2E_DB_PORT ?? "5432"),
    user: process.env.JOSTORE_E2E_DB_USER ?? "jostore",
    password: process.env.JOSTORE_E2E_DB_PASSWORD ?? "jostore_dev",
    database: process.env.JOSTORE_E2E_DB_NAME ?? "jostore",
  });
  await client.connect();
  try {
    return await action(client);
  } finally {
    await client.end();
  }
}

const resetExchangeCoupon = () =>
  withDatabase(async (client) => {
    await client.query(
      "UPDATE cupons SET cup_ativo = TRUE, cup_usado_at = NULL, cup_cli_id = NULL WHERE cup_codigo = 'TROCA150'",
    );
    return null;
  });

const resetRn0036CouponSet = () =>
  withDatabase(async (client) => {
    await client.query(
      "INSERT INTO cupons (cup_id, cup_codigo, cup_tipo, cup_valor, cup_descricao, cup_ativo, cup_cli_id, cup_usado_at) VALUES ('40000000-0000-0000-0000-000000000080', 'E2E-RN0036-80', 'TROCA', 80.00, 'Fixture RN0036 de R$ 80,00.', TRUE, NULL, NULL), ('40000000-0000-0000-0000-000000000050', 'E2E-RN0036-50', 'TROCA', 50.00, 'Fixture RN0036 de R$ 50,00.', TRUE, NULL, NULL), ('40000000-0000-0000-0000-000000000040', 'E2E-RN0036-40', 'TROCA', 40.00, 'Fixture RN0036 de R$ 40,00.', TRUE, NULL, NULL) ON CONFLICT (cup_codigo) DO UPDATE SET cup_ativo = TRUE, cup_cli_id = NULL, cup_usado_at = NULL",
    );
    return null;
  });

const resetPaymentCouponSet = () =>
  withDatabase(async (client) => {
    await client.query(
      "INSERT INTO cupons (cup_id, cup_codigo, cup_tipo, cup_valor, cup_descricao, cup_ativo, cup_cli_id, cup_usado_at) VALUES ('40000000-0000-0000-0000-000000000110', 'E2E-PROMO-110', 'PROMOCIONAL', 110.00, 'Fixture de pagamento com cupom.', TRUE, NULL, NULL), ('40000000-0000-0000-0000-000000000010', 'E2E-PROMO-10', 'PROMOCIONAL', 10.00, 'Fixture para limite promocional.', TRUE, NULL, NULL) ON CONFLICT (cup_codigo) DO UPDATE SET cup_ativo = TRUE, cup_cli_id = NULL, cup_usado_at = NULL",
    );
    return null;
  });

const countOrderLogs = () =>
  withDatabase(async (client) => {
    const result = await client.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM logs_operacoes WHERE log_entidade = 'PEDIDO'",
    );
    return Number(result.rows[0].count);
  });

export default defineConfig({
  e2e: {
    baseUrl: frontendUrl,
    setupNodeEvents(on) {
      on("task", {
        resetExchangeCoupon,
        resetRn0036CouponSet,
        resetPaymentCouponSet,
        countOrderLogs,
      });

      on("before:run", async () => {
        await viteStartup;
      });

      on("after:run", async () => {
        await viteServer?.close();
        viteServer = undefined;
      });
    },
  },
});
