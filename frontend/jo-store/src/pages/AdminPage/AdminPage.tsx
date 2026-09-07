import { type FormEvent, useState } from "react";
import { adminOrderStatusTransitions } from "../../data/storeData";
import { AdminAnalytics } from "./AdminAnalytics";
import { CustomerGatewayError } from "../../services/customerGateway";
import { useCustomerGateway } from "../../services/useCustomerGateway";
import type {
  AdminSection,
  ClientDetails,
  ClientFilter,
  ClientSummary,
  Order,
} from "../../types/store";
import { normalizeOrderStatus } from "../../utils/store";
import "./AdminPage.css";

type AdminPageProps = {
  orders: Order[];
  activeSection: AdminSection;
  onSelectSection: (section: AdminSection) => void;
  onUpdateOrderStatus: (orderId: string, nextStatus: string) => void;
  onClientChanged: (client: ClientDetails) => void;
};

export function AdminPage({
  orders,
  activeSection,
  onSelectSection,
  onUpdateOrderStatus,
  onClientChanged,
}: AdminPageProps) {
  const gateway = useCustomerGateway();
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [filter, setFilter] = useState<ClientFilter>({});
  const [clientsError, setClientsError] = useState("");

  async function loadClients(nextFilter = filter) {
    try {
      const result = await gateway.listClients({
        filter: nextFilter,
        size: 50,
      });
      setClients(result.content);
      setClientsError("");
    } catch (error) {
      setClientsError(
        error instanceof CustomerGatewayError
          ? error.message
          : "Não foi possível consultar os clientes.",
      );
    }
  }

  function submitFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadClients();
  }

  async function inactivateClient(id: string) {
    try {
      onClientChanged(await gateway.inactivateClient(id));
      await loadClients();
    } catch (error) {
      setClientsError(
        error instanceof CustomerGatewayError
          ? error.message
          : "Não foi possível inativar o cliente.",
      );
    }
  }

  async function reactivateClient(id: string) {
    try {
      onClientChanged(await gateway.reactivateClient(id));
      await loadClients();
    } catch (error) {
      setClientsError(
        error instanceof CustomerGatewayError
          ? error.message
          : "Não foi possível reativar o cliente.",
      );
    }
  }
  return (
    <section className="profile-page" aria-labelledby="admin-page-title">
      <div className="profile-page-header">
        <div>
          <h1 id="admin-page-title" className="profile-page-title">
            Painel administrativo
          </h1>
          <p className="profile-page-subtitle">
            Consulte clientes e acompanhe os pedidos da JoStore.
          </p>
        </div>
      </div>

      <div className="profile-layout">
        <aside className="profile-sidebar" aria-label="Opções do administrador">
          <button
            type="button"
            className={`profile-nav-button${activeSection === "clients" ? " is-active" : ""}`}
            onClick={() => onSelectSection("clients")}
          >
            Clientes
          </button>
          <button
            type="button"
            className={`profile-nav-button${activeSection === "orders" ? " is-active" : ""}`}
            onClick={() => onSelectSection("orders")}
          >
            Pedidos
          </button>
          <button
            type="button"
            className={`profile-nav-button${activeSection === "analytics" ? " is-active" : ""}`}
            onClick={() => onSelectSection("analytics")}
          >
            Gráfico de análise
          </button>
        </aside>

        <div className="profile-content">
          {activeSection === "clients" ? (
            <section
              className="profile-panel"
              aria-labelledby="admin-clients-title"
            >
              <div className="profile-panel-header">
                <h2 id="admin-clients-title" className="profile-panel-title">
                  Clientes cadastrados
                </h2>
                <span className="profile-panel-meta">
                  {clients.length} cliente(s)
                </span>
              </div>

              <form className="admin-client-filters" onSubmit={submitFilter}>
                <label className="admin-filter-field">
                  <span>Código</span>
                  <input
                    value={filter.code ?? ""}
                    onChange={(event) =>
                      setFilter({ ...filter, code: event.target.value })
                    }
                  />
                </label>
                <label className="admin-filter-field">
                  <span>Nome</span>
                  <input
                    value={filter.fullName ?? ""}
                    onChange={(event) =>
                      setFilter({ ...filter, fullName: event.target.value })
                    }
                  />
                </label>
                <label className="admin-filter-field">
                  <span>CPF</span>
                  <input
                    inputMode="numeric"
                    value={filter.cpf ?? ""}
                    onChange={(event) =>
                      setFilter({ ...filter, cpf: event.target.value })
                    }
                  />
                </label>
                <label className="admin-filter-field">
                  <span>E-mail</span>
                  <input
                    type="email"
                    value={filter.email ?? ""}
                    onChange={(event) =>
                      setFilter({ ...filter, email: event.target.value })
                    }
                  />
                </label>
                <label className="admin-filter-field">
                  <span>Cidade</span>
                  <input
                    value={filter.city ?? ""}
                    onChange={(event) =>
                      setFilter({ ...filter, city: event.target.value })
                    }
                  />
                </label>
                <label className="admin-filter-field">
                  <span>Status</span>
                  <select
                    value={filter.status ?? ""}
                    onChange={(event) =>
                      setFilter({
                        ...filter,
                        status: event.target.value as ClientFilter["status"],
                      })
                    }
                  >
                    <option value="">Todos</option>
                    <option value="ATIVO">ATIVO</option>
                    <option value="INATIVO">INATIVO</option>
                  </select>
                </label>
                <div className="admin-client-filter-actions">
                  <button
                    type="submit"
                    className="order-card-action order-card-action-primary"
                  >
                    Consultar
                  </button>
                  <button
                    type="button"
                    className="order-card-action order-card-action-secondary"
                    onClick={() => {
                      setFilter({});
                      void loadClients({});
                    }}
                  >
                    Limpar
                  </button>
                </div>
              </form>

              {clientsError ? (
                <p className="admin-client-error">{clientsError}</p>
              ) : null}

              {clients.length > 0 ? (
                <div className="admin-client-list">
                  {clients.map((client) => (
                    <article key={client.id} className="admin-client-card">
                      <div className="profile-panel-header">
                        <div>
                          <h3 className="profile-panel-title">
                            {client.fullName}
                          </h3>
                          <p className="admin-client-subtitle">
                            {client.code} - {client.email}
                          </p>
                        </div>
                        <span
                          className={`profile-status-badge${client.status === "INATIVO" ? " is-inactive" : ""}`}
                        >
                          {client.status}
                        </span>
                      </div>

                      <div className="profile-info-grid profile-info-grid-readonly">
                        <div className="profile-field">
                          <span>CPF</span>
                          <strong className="profile-field-value">
                            {client.cpf}
                          </strong>
                        </div>
                        <div className="profile-field">
                          <span>E-mail</span>
                          <strong className="profile-field-value">
                            {client.email}
                          </strong>
                        </div>
                        <div className="profile-field">
                          <span>Ranking</span>
                          <strong className="profile-field-value">
                            {client.ranking}
                          </strong>
                        </div>
                      </div>
                      <div className="admin-status-actions">
                        {client.status === "ATIVO" ? (
                          <button
                            type="button"
                            className="order-card-action order-card-action-secondary"
                            onClick={() => void inactivateClient(client.id)}
                          >
                            Inativar cliente
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="order-card-action order-card-action-primary"
                            onClick={() => void reactivateClient(client.id)}
                          >
                            Reativar cliente
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="profile-empty-state">
                  <h3>Nenhum cliente cadastrado</h3>
                  <p>
                    Assim que um cliente concluir o cadastro, ele aparecerá
                    aqui.
                  </p>
                </div>
              )}
            </section>
          ) : null}

          {activeSection === "orders" ? (
            <section
              className="profile-panel"
              aria-labelledby="admin-orders-title"
            >
              <div className="profile-panel-header">
                <h2 id="admin-orders-title" className="profile-panel-title">
                  Pedidos
                </h2>
                <span className="profile-panel-meta">
                  {orders.length} pedido(s)
                </span>
              </div>

              {orders.length > 0 ? (
                <div className="orders-list">
                  {orders.map((order) => {
                    const nextStatuses =
                      adminOrderStatusTransitions[
                        normalizeOrderStatus(order.status)
                      ] ?? [];

                    return (
                      <article key={order.id} className="order-card">
                        <div className="order-card-header">
                          <div>
                            <strong className="order-card-number">
                              Pedido {order.number}
                            </strong>
                            <p className="order-card-date">{order.createdAt}</p>
                          </div>
                          <span className="order-card-status">
                            {order.status}
                          </span>
                        </div>

                        <div className="order-card-summary">
                          <div className="order-card-summary-row">
                            <span>Itens</span>
                            <strong>
                              {order.items.reduce(
                                (total, item) => total + item.quantity,
                                0,
                              )}
                            </strong>
                          </div>
                          <div className="order-card-summary-row">
                            <span>Total</span>
                            <strong>
                              {order.total.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </strong>
                          </div>
                        </div>

                        <div className="admin-status-actions">
                          {nextStatuses.length > 0 ? (
                            nextStatuses.map((status) => (
                              <button
                                key={`${order.id}-${status}`}
                                type="button"
                                className="order-card-action order-card-action-primary"
                                onClick={() =>
                                  onUpdateOrderStatus(order.id, status)
                                }
                              >
                                {status}
                              </button>
                            ))
                          ) : (
                            <span className="admin-status-note">
                              Nenhuma alteração disponível para este status.
                            </span>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="profile-empty-state">
                  <h3>Nenhum pedido registrado</h3>
                  <p>Os pedidos realizados pelos clientes aparecerao aqui.</p>
                </div>
              )}
            </section>
          ) : null}

          {activeSection === "analytics" ? (
            <section
              className="profile-panel"
              aria-labelledby="admin-analytics-title"
            >
              <div className="profile-panel-header">
                <h2 id="admin-analytics-title" className="profile-panel-title">
                  Gráfico de análise
                </h2>
              </div>
              <AdminAnalytics orders={orders} />
            </section>
          ) : null}
        </div>
      </div>
    </section>
  );
}
