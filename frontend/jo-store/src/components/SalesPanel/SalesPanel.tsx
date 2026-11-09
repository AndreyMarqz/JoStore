import { useCallback, useEffect, useState } from "react";
import {
  orderGateway,
  type ApiOrder,
  type ApiExchange,
  type ApiCoupon,
  type ApiNotification,
} from "../../services/orderGateway";
import "./SalesPanel.css";
import { Toast } from "../Toast/Toast";

const money = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const label = (s: string) => s.replaceAll("_", " ");

export function SalesPanel({ customerId }: { customerId?: string }) {
  const admin = !customerId;
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [exchanges, setExchanges] = useState<ApiExchange[]>([]);
  const [coupons, setCoupons] = useState<ApiCoupon[]>([]);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [status, setStatus] = useState("");
  const [code, setCode] = useState("");
  const [activeView, setActiveView] = useState<"orders" | "exchanges">(
    "orders",
  );
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [selection, setSelection] = useState<Record<string, number | "">>({});
  const [restock, setRestock] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (!message && !error) return;
    const timer = window.setTimeout(() => {
      setMessage("");
      setError("");
    }, 2600);
    return () => window.clearTimeout(timer);
  }, [message, error]);
  const load = useCallback(async () => {
    const [result, swaps] = await Promise.all([
      orderGateway.listOrders(customerId, status, code, page),
      orderGateway.exchanges(customerId),
    ]);
    setOrders(result.content);
    setPages(result.totalPages);
    setExchanges(swaps);
    if (customerId) {
      const [credits, alerts] = await Promise.all([
        orderGateway.listCoupons(customerId),
        orderGateway.notifications(customerId),
      ]);
      setCoupons(credits);
      setNotifications(alerts);
    }
  }, [customerId, status, code, page]);
  useEffect(() => {
    let active = true;
    const poll = () => {
      if (active)
        void load().catch((e) => {
          if (active) setError(e.message);
        });
    };
    poll();
    const timer = window.setInterval(poll, 2000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [load]);
  async function action(work: () => Promise<unknown>, success: string) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await work();
      await load();
      setMessage(success);
      setSelection({});
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível concluir a operação.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="sales-panel"
      data-cy={admin ? "admin-sales" : "customer-sales"}
    >
      <div
        className="sales-view-tabs"
        role="tablist"
        aria-label="Visualização de vendas"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeView === "orders"}
          className={activeView === "orders" ? "is-active" : ""}
          data-cy="sales-view-orders"
          onClick={() => setActiveView("orders")}
        >
          Pedidos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === "exchanges"}
          className={activeView === "exchanges" ? "is-active" : ""}
          data-cy="sales-view-exchanges"
          onClick={() => setActiveView("exchanges")}
        >
          Trocas
        </button>
      </div>
      <h2>{activeView === "orders" ? "Pedidos" : "Trocas"}</h2>
      {(error || message) && (
        <Toast
          key={error || message}
          toast={{
            variant: error ? "error" : "success",
            title: error ? "Operação não concluída" : "Operação concluída",
            message: error || message,
          }}
        />
      )}
      {admin && activeView === "orders" && (
        <div className="sales-filters">
          <label>
            Código do pedido
            <input
              data-cy="order-filter-code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setPage(0);
              }}
            />
          </label>
          <label>
            Status
            <select
              data-cy="order-filter-status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
            >
              <option value="">Todos</option>
              {[
                "EM_PROCESSAMENTO",
                "APROVADA",
                "REPROVADA",
                "EM_TRANSPORTE",
                "ENTREGUE",
                "EM_TROCA",
                "TROCA_AUTORIZADA",
                "TROCADO",
              ].map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {notifications.length > 0 && (
        <section aria-label="Notificações">
          <h3>Notificações</h3>
          {notifications.map((n) => (
            <article key={n.id} data-cy="exchange-notification">
              <p>{n.message}</p>
              {!n.readAt && (
                <button
                  disabled={busy}
                  onClick={() =>
                    void action(
                      () => orderGateway.readNotification(customerId!, n.id),
                      "Notificação marcada como lida.",
                    )
                  }
                >
                  Marcar como lida
                </button>
              )}
            </article>
          ))}
        </section>
      )}
      {activeView === "orders" && orders.length === 0 && (
        <p>Nenhum pedido encontrado.</p>
      )}
      {activeView === "orders" && orders.map((order) => (
        <article
          className="sales-card"
          key={order.id}
          data-cy={`order-${order.id}`}
        >
          <header>
            <h3>Pedido {order.code}</h3>
            <strong data-cy="order-status">{label(order.status)}</strong>
          </header>
          <p>
            {new Date(order.createdAt).toLocaleString("pt-BR")} · Total{" "}
            {money(order.total)} · Frete {money(order.shipping)}
          </p>
          <p>
            {order.deliveryAddress.street}, {order.deliveryAddress.number} —{" "}
            {order.deliveryAddress.city}/{order.deliveryAddress.state}
          </p>
          {order.items.map((item) => {
            const used = exchanges
              .filter((e) => e.orderId === order.id)
              .flatMap((e) => e.items)
              .filter((i) => i.orderItemId === item.id)
              .reduce((n, i) => n + i.quantity, 0);
            const available = item.quantity - used;
            return (
              <div className="sales-item" key={item.id}>
                <span>
                  {item.product.name} · {item.size} · {item.quantity} peça(s) ·{" "}
                  {money(item.total)}
                </span>
                {!admin && order.status === "ENTREGUE" && available > 0 && (
                  <label>
                    Quantidade para troca
                    <input
                      data-cy={`exchange-quantity-${item.id}`}
                      type="number"
                      min="0"
                      max={available}
                      value={selection[item.id] ?? ""}
                      onChange={(e) =>
                        setSelection({
                          ...selection,
                          [item.id]:
                            e.target.value === ""
                              ? ""
                              : Math.max(
                                  0,
                                  Math.min(available, Number(e.target.value)),
                                ),
                        })
                      }
                    />
                  </label>
                )}
              </div>
            );
          })}
          {order.generatedExchangeCoupon && (
            <p data-cy="difference-coupon">
              Cupom de diferença: {order.generatedExchangeCoupon.code} —{" "}
              {money(order.generatedExchangeCoupon.value)}
            </p>
          )}
          <div className="sales-actions">
            {admin && order.status === "APROVADA" && (
              <button
                data-cy="dispatch-order"
                disabled={busy}
                onClick={() =>
                  void action(
                    () => orderGateway.dispatch(order.id),
                    "Pedido em transporte.",
                  )
                }
              >
                Despachar pedido
              </button>
            )}
            {admin && order.status === "EM_TRANSPORTE" && (
              <button
                data-cy="deliver-order"
                disabled={busy}
                onClick={() =>
                  void action(
                    () => orderGateway.deliver(order.id),
                    "Entrega confirmada.",
                  )
                }
              >
                Confirmar entrega
              </button>
            )}
            {!admin && (
              <button
                data-cy="request-exchange"
                disabled={
                  busy ||
                  order.status !== "ENTREGUE" ||
                  !order.items.some((i) => Number(selection[i.id] ?? 0) > 0)
                }
                onClick={() =>
                  void action(
                    () =>
                      orderGateway.requestExchange(
                        customerId!,
                        order.id,
                        order.items
                          .filter((i) => Number(selection[i.id] ?? 0) > 0)
                          .map((i) => ({
                            orderItemId: i.id,
                            quantity: Number(selection[i.id]),
                          })),
                      ),
                    "Troca solicitada.",
                  )
                }
              >
                Solicitar troca dos itens selecionados
              </button>
            )}
            {!admin &&
              order.status === "ENTREGUE" &&
              !exchanges.some((e) => e.orderId === order.id) && (
                <button
                  data-cy="exchange-full-order"
                  disabled={busy}
                  onClick={() =>
                    void action(
                      () =>
                        orderGateway.requestExchange(
                          customerId!,
                          order.id,
                          order.items.map((i) => ({
                            orderItemId: i.id,
                            quantity: i.quantity,
                          })),
                        ),
                      "Troca integral solicitada.",
                    )
                  }
                >
                  Trocar toda a compra
                </button>
              )}
          </div>
          <details>
            <summary>Histórico do pedido</summary>
            <ol>
              {order.history.map((h, i) => (
                <li key={i}>
                  {label(h.status)} — {h.description} ({h.actor})
                </li>
              ))}
            </ol>
          </details>
        </article>
      ))}
      {activeView === "orders" ? (
        <div className="sales-actions">
          <button disabled={page === 0} onClick={() => setPage(page - 1)}>
            Anterior
          </button>
          <span>
            Página {page + 1} de {Math.max(1, pages)}
          </span>
          <button disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>
            Próxima
          </button>
        </div>
      ) : null}
      {activeView === "exchanges" ? (
      <section aria-label="Trocas">
        <h3>{admin ? "Solicitações de troca" : "Minhas trocas"}</h3>
        {exchanges.length === 0 && <p>Nenhuma solicitação de troca.</p>}
        {exchanges.map((ex) => (
          <article
            className="sales-card"
            key={ex.id}
            data-cy={`exchange-${ex.id}`}
          >
            <header>
              <h4>
                {ex.orderCode} —{" "}
                {ex.fullOrder ? "Troca integral" : "Troca parcial"}
              </h4>
              <strong data-cy="exchange-status">{label(ex.status)}</strong>
            </header>
            {ex.items.map((item) => (
              <div className="sales-item" key={item.orderItemId}>
                <span>
                  {item.name} · {item.size} · {item.quantity} peça(s)
                </span>
                {admin && ex.status === "TROCA_AUTORIZADA" && (
                  <label>
                    <input
                      type="checkbox"
                      data-cy={`restock-${item.orderItemId}`}
                      checked={restock[item.orderItemId] ?? true}
                      onChange={(e) =>
                        setRestock({
                          ...restock,
                          [item.orderItemId]: e.target.checked,
                        })
                      }
                    />
                    Retornar ao estoque
                  </label>
                )}
              </div>
            ))}
            {admin && ex.status === "EM_TROCA" && (
              <button
                data-cy="authorize-exchange"
                disabled={busy}
                onClick={() =>
                  void action(
                    () => orderGateway.authorize(ex.id),
                    "Troca autorizada e cliente notificado.",
                  )
                }
              >
                Autorizar troca
              </button>
            )}
            {admin && ex.status === "TROCA_AUTORIZADA" && (
              <button
                data-cy="receive-exchange"
                disabled={busy}
                onClick={() =>
                  void action(
                    () =>
                      orderGateway.receive(
                        ex.id,
                        ex.items.map((i) => ({
                          orderItemId: i.orderItemId,
                          restock: restock[i.orderItemId] ?? true,
                        })),
                      ),
                    "Recebimento confirmado. Cupom emitido e estoque atualizado.",
                  )
                }
              >
                Confirmar recebimento dos itens
              </button>
            )}
            {ex.couponId && (
              <p>Cupom de troca emitido e disponível ao cliente.</p>
            )}
          </article>
        ))}
      </section>
      ) : null}
      {!admin && activeView === "exchanges" && (
        <section aria-label="Meus cupons">
          <h3>Meus cupons</h3>
          {coupons.length === 0 && <p>Nenhum cupom disponível.</p>}
          {coupons.map((c) => (
            <article key={c.id} data-cy={`available-coupon-${c.id}`}>
              <strong>
                {c.code} — {money(c.value)}
              </strong>
              <p>{c.description}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
