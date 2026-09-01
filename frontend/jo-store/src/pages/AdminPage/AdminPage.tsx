import { adminOrderStatusTransitions } from '../../data/storeData'
import { AdminAnalytics } from './AdminAnalytics'
import type { AdminSection, Order, UserProfile } from '../../types/store'
import { formatProfilePhone, normalizeOrderStatus } from '../../utils/store'
import './AdminPage.css'

type AdminPageProps = {
  clients: UserProfile[]
  orders: Order[]
  activeSection: AdminSection
  onSelectSection: (section: AdminSection) => void
  onUpdateOrderStatus: (orderId: string, nextStatus: string) => void
}

export function AdminPage({
  clients,
  orders,
  activeSection,
  onSelectSection,
  onUpdateOrderStatus,
}: AdminPageProps) {
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
          <button type="button" className={`profile-nav-button${activeSection === 'clients' ? ' is-active' : ''}`} onClick={() => onSelectSection('clients')}>
            Clientes
          </button>
          <button type="button" className={`profile-nav-button${activeSection === 'orders' ? ' is-active' : ''}`} onClick={() => onSelectSection('orders')}>
            Pedidos
          </button>
          <button type="button" className={`profile-nav-button${activeSection === 'analytics' ? ' is-active' : ''}`} onClick={() => onSelectSection('analytics')}>
            Gráfico de análise
          </button>
        </aside>

        <div className="profile-content">
          {activeSection === 'clients' ? (
            <section className="profile-panel" aria-labelledby="admin-clients-title">
              <div className="profile-panel-header">
                <h2 id="admin-clients-title" className="profile-panel-title">
                  Clientes cadastrados
                </h2>
                <span className="profile-panel-meta">{clients.length} cliente(s)</span>
              </div>

              {clients.length > 0 ? (
                <div className="admin-client-list">
                  {clients.map((client) => (
                    <article key={client.email} className="admin-client-card">
                      <div className="profile-panel-header">
                        <div>
                          <h3 className="profile-panel-title">{client.fullName}</h3>
                          <p className="admin-client-subtitle">{client.email}</p>
                        </div>
                        <span className={`profile-status-badge${client.status === 'Inativo' ? ' is-inactive' : ''}`}>{client.status}</span>
                      </div>

                      <div className="profile-info-grid profile-info-grid-readonly">
                        <div className="profile-field">
                          <span>Gênero</span>
                          <strong className="profile-field-value">{client.gender}</strong>
                        </div>
                        <div className="profile-field">
                          <span>CPF</span>
                          <strong className="profile-field-value">{client.cpf}</strong>
                        </div>
                        <div className="profile-field">
                          <span>Data de nascimento</span>
                          <strong className="profile-field-value">{new Date(`${client.birthDate}T12:00:00`).toLocaleDateString('pt-BR')}</strong>
                        </div>
                        <div className="profile-field">
                          <span>Telefone</span>
                          <strong className="profile-field-value">{formatProfilePhone(client)}</strong>
                        </div>
                        <div className="profile-field">
                          <span>Endereço</span>
                          <strong className="profile-field-value">{`${client.streetType} ${client.street}, ${client.number}`}</strong>
                        </div>
                        <div className="profile-field">
                          <span>Bairro</span>
                          <strong className="profile-field-value">{client.neighborhood}</strong>
                        </div>
                        <div className="profile-field">
                          <span>Cidade / Estado</span>
                          <strong className="profile-field-value">{`${client.city} - ${client.state}`}</strong>
                        </div>
                        <div className="profile-field">
                          <span>País / CEP</span>
                          <strong className="profile-field-value">{`${client.country} • ${client.zipCode}`}</strong>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="profile-empty-state">
                  <h3>Nenhum cliente cadastrado</h3>
                  <p>Assim que um cliente concluir o cadastro, ele aparecerá aqui.</p>
                </div>
              )}
            </section>
          ) : null}

          {activeSection === 'orders' ? (
            <section className="profile-panel" aria-labelledby="admin-orders-title">
              <div className="profile-panel-header">
                <h2 id="admin-orders-title" className="profile-panel-title">
                  Pedidos
                </h2>
                <span className="profile-panel-meta">{orders.length} pedido(s)</span>
              </div>

              {orders.length > 0 ? (
                <div className="orders-list">
                  {orders.map((order) => {
                    const nextStatuses = adminOrderStatusTransitions[normalizeOrderStatus(order.status)] ?? []

                    return (
                      <article key={order.id} className="order-card">
                        <div className="order-card-header">
                          <div>
                            <strong className="order-card-number">Pedido {order.number}</strong>
                            <p className="order-card-date">{order.createdAt}</p>
                          </div>
                          <span className="order-card-status">{order.status}</span>
                        </div>

                        <div className="order-card-summary">
                          <div className="order-card-summary-row">
                            <span>Itens</span>
                            <strong>{order.items.reduce((total, item) => total + item.quantity, 0)}</strong>
                          </div>
                          <div className="order-card-summary-row">
                            <span>Total</span>
                            <strong>{order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                          </div>
                        </div>

                        <div className="admin-status-actions">
                          {nextStatuses.length > 0 ? (
                            nextStatuses.map((status) => (
                              <button
                                key={`${order.id}-${status}`}
                                type="button"
                                className="order-card-action order-card-action-primary"
                                onClick={() => onUpdateOrderStatus(order.id, status)}
                              >
                                {status}
                              </button>
                            ))
                          ) : (
                            <span className="admin-status-note">Nenhuma alteração disponível para este status.</span>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="profile-empty-state">
                  <h3>Nenhum pedido registrado</h3>
                  <p>Os pedidos realizados pelos clientes aparecerão aqui.</p>
                </div>
              )}
            </section>
          ) : null}

          {activeSection === 'analytics' ? (
            <section className="profile-panel" aria-labelledby="admin-analytics-title">
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
  )
}
