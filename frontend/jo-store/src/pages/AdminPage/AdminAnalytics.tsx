import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useState } from "react";
import type { Order } from "../../types/store";

type AdminAnalyticsProps = { orders: Order[] };

type RevenueChartPoint = { date: string } & Record<string, number | string>;

const lineColors = [
  "#1d1d1b",
  "#9c3b3b",
  "#376c9d",
  "#47805a",
  "#956530",
  "#704987",
];

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

function parseOrderDate(value: string) {
  const [datePart] = value.split(",");
  const [day, month, year] = datePart.trim().split("/").map(Number);
  return new Date(year, month - 1, day);
}

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromInputDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: Date) {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function getDaysInRange(startDate: Date, endDate: Date) {
  const days: Date[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return days;
}

export function AdminAnalytics({ orders }: AdminAnalyticsProps) {
  const orderDates = orders
    .map((order) => parseOrderDate(order.createdAt))
    .filter((date) => !Number.isNaN(date.getTime()));
  const earliestOrderDate = orderDates.length
    ? new Date(Math.min(...orderDates.map(Number)))
    : new Date();
  const latestOrderDate = orderDates.length
    ? new Date(Math.max(...orderDates.map(Number)))
    : new Date();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("all");

  const effectiveStartDate = startDate
    ? fromInputDate(startDate)
    : earliestOrderDate;
  const effectiveEndDate = endDate ? fromInputDate(endDate) : latestOrderDate;
  const productOptions = Array.from(
    new Map(
      orders.flatMap((order) =>
        order.items.map((item) => [String(item.id), item.name]),
      ),
    ).entries(),
  );

  const chartProducts =
    selectedProductId === "all"
      ? productOptions
      : productOptions.filter(([id]) => id === selectedProductId);
  const revenueByDate = new Map<string, Record<string, number>>();
  orders.forEach((order) => {
    const orderDate = parseOrderDate(order.createdAt);
    if (
      Number.isNaN(orderDate.getTime()) ||
      orderDate < effectiveStartDate ||
      orderDate > effectiveEndDate
    )
      return;

    const selectedItems =
      selectedProductId === "all"
        ? order.items
        : order.items.filter((item) => String(item.id) === selectedProductId);
    if (selectedItems.length > 0) {
      const key = toInputDate(orderDate);
      const dailyRevenue = revenueByDate.get(key) ?? {};

      selectedItems.forEach((item) => {
        const productId = String(item.id);
        dailyRevenue[productId] =
          (dailyRevenue[productId] ?? 0) + item.unitPriceValue * item.quantity;
      });

      revenueByDate.set(key, dailyRevenue);
    }
  });

  const chartData: RevenueChartPoint[] = getDaysInRange(
    effectiveStartDate,
    effectiveEndDate,
  ).map((date) => {
    const dailyRevenue = revenueByDate.get(toInputDate(date)) ?? {};
    return Object.fromEntries([
      ["date", formatDate(date)],
      ...chartProducts.map(([id]) => [id, dailyRevenue[id] ?? 0]),
    ]) as RevenueChartPoint;
  });
  const totalRevenue = chartData.reduce(
    (total, point) =>
      total +
      chartProducts.reduce(
        (dailyTotal, [id]) => dailyTotal + Number(point[id]),
        0,
      ),
    0,
  );
  const selectedProductName =
    productOptions.find(([id]) => id === selectedProductId)?.[1] ??
    "Todos os produtos";

  return (
    <div className="admin-revenue-analysis">
      <div className="admin-revenue-filters">
        <label className="admin-filter-field">
          <span>Data inicial</span>
          <input
            type="date"
            value={startDate || toInputDate(earliestOrderDate)}
            max={endDate || toInputDate(latestOrderDate)}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </label>
        <label className="admin-filter-field">
          <span>Data final</span>
          <input
            type="date"
            value={endDate || toInputDate(latestOrderDate)}
            min={startDate || toInputDate(earliestOrderDate)}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </label>
        <label className="admin-filter-field admin-filter-field-product">
          <span>Produto</span>
          <select
            value={selectedProductId}
            onChange={(event) => setSelectedProductId(event.target.value)}
          >
            <option value="all">Todos os produtos</option>
            {productOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="admin-revenue-summary">
        <span>Receita no período</span>
        <strong>{money.format(totalRevenue)}</strong>
        <p>{selectedProductName}</p>
      </div>

      <div className="admin-recharts-container admin-revenue-chart-container">
        {orders.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 12, right: 18, left: 8, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e8ef" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(value) => `R$ ${value}`}
                width="auto"
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => [money.format(Number(value)), "Receita"]}
              />
              {chartProducts.length > 1 ? <Legend /> : null}
              {chartProducts.map(([id, name], index) => (
                <Line
                  key={id}
                  type="monotone"
                  dataKey={id}
                  name={name}
                  stroke={lineColors[index % lineColors.length]}
                  strokeWidth={3}
                  dot={{ r: 4, fill: lineColors[index % lineColors.length] }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="admin-chart-empty">
            A receita será exibida após o primeiro pedido.
          </p>
        )}
      </div>
    </div>
  );
}
