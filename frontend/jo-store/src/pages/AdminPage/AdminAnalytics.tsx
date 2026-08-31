import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  createHorizontalChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Order } from '../../types/store'
import { normalizeOrderStatus } from '../../utils/store'

type AdminAnalyticsProps = {
  orders: Order[]
  cartAdditions: number
}

const statusColors = ['#5b5bd6', '#75a9e8', '#69b998', '#e5a55e', '#c77dc4']

const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

type RevenueChartPoint = {
  label: string
  revenue: number
  items: number
}

const RevenueLineChart = createHorizontalChart<RevenueChartPoint, string, number>()({
  XAxis,
  YAxis,
  Tooltip,
  Line,
})

function statusLabel(status: string) {
  return status
    .toLocaleLowerCase('pt-BR')
    .replace(/\b\w/g, (letter) => letter.toLocaleUpperCase('pt-BR'))
}

export function AdminAnalytics({ orders, cartAdditions }: AdminAnalyticsProps) {
  const totalRevenue = orders.reduce((total, order) => total + order.total, 0)
  const totalItems = orders.reduce(
    (total, order) => total + order.items.reduce((items, item) => items + item.quantity, 0),
    0,
  )
  const statusData = Object.entries(
    orders.reduce<Record<string, number>>((accumulator, order) => {
      const status = normalizeOrderStatus(order.status)
      accumulator[status] = (accumulator[status] ?? 0) + 1
      return accumulator
    }, {}),
  ).map(([status, value], index) => ({
    name: statusLabel(status),
    value,
    color: statusColors[index % statusColors.length],
  }))

  const funnelData = [
    { name: 'Adicionados', value: cartAdditions },
    { name: 'Pedidos', value: orders.length },
    { name: 'Itens vendidos', value: totalItems },
  ]

  const orderHistory: RevenueChartPoint[] = orders
    .slice()
    .reverse()
    .map((order, index) => ({
      label: `Pedido ${index + 1}`,
      revenue: order.total,
      items: order.items.reduce((total, item) => total + item.quantity, 0),
    }))

  return (
    <>
      <div className="admin-analytics-grid">
        <article className="admin-analytics-card">
          <span className="admin-analytics-label">Adições ao carrinho</span>
          <strong className="admin-analytics-value">{cartAdditions}</strong>
          <p className="admin-analytics-copy">Atualizado ao incluir um produto pelo modal.</p>
        </article>
        <article className="admin-analytics-card">
          <span className="admin-analytics-label">Pedidos confirmados</span>
          <strong className="admin-analytics-value">{orders.length}</strong>
          <p className="admin-analytics-copy">Atualizado ao concluir o pagamento.</p>
        </article>
        <article className="admin-analytics-card">
          <span className="admin-analytics-label">Receita acumulada</span>
          <strong className="admin-analytics-value">{money.format(totalRevenue)}</strong>
          <p className="admin-analytics-copy">{totalItems} item(ns) vendido(s) nesta sessão.</p>
        </article>
      </div>

      <div className="admin-chart-grid">
        <article className="admin-chart-card">
          <div className="admin-chart-heading">
            <div><h3>Fluxo de compra</h3><p>Eventos reais da sessão atual.</p></div>
          </div>
          <div className="admin-recharts-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [value, 'Eventos']} cursor={{ fill: '#f1f1fb' }} />
                <Bar dataKey="value" fill="#5b5bd6" radius={[6, 6, 0, 0]} maxBarSize={58} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="admin-chart-card">
          <div className="admin-chart-heading">
            <div><h3>Status dos pedidos</h3><p>Atualizado após cada mudança de status.</p></div>
          </div>
          <div className="admin-recharts-container admin-pie-container">
            {statusData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="82%" paddingAngle={3}>
                    {statusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Pedidos']} />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="admin-chart-empty">Os status aparecerão quando o primeiro pedido for confirmado.</p>}
          </div>
        </article>

        <article className="admin-chart-card admin-chart-card-wide">
          <div className="admin-chart-heading">
            <div><h3>Receita por pedido</h3><p>Valores confirmados durante a sessão.</p></div>
          </div>
          <div className="admin-recharts-container">
            {orderHistory.length ? (
              <RevenueLineChart.LineChart
                responsive
                data={orderHistory}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                style={{ width: '100%', height: '100%' }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e8ef" />
                <RevenueLineChart.XAxis dataKey="label" axisLine={false} tickLine={false} />
                <RevenueLineChart.YAxis width="auto" axisLine={false} tickLine={false} />
                <Tooltip formatter={(value, name) => [name === 'revenue' ? money.format(Number(value)) : value, name === 'revenue' ? 'Receita' : 'Itens']} />
                <Legend />
                <RevenueLineChart.Line type="monotone" dataKey="revenue" name="Receita" stroke="#5b5bd6" strokeWidth={3} />
                <RevenueLineChart.Line type="monotone" dataKey="items" name="Itens" stroke="#69b998" strokeWidth={3} />
              </RevenueLineChart.LineChart>
            ) : <p className="admin-chart-empty">A receita será exibida após a confirmação de uma compra.</p>}
          </div>
        </article>
      </div>
    </>
  )
}
