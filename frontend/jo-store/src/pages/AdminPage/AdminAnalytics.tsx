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
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { CustomerGatewayError } from "../../services/customerGateway";
import {
  orderGateway,
  type ApiProductCategory,
  type ApiSalesHistory,
} from "../../services/orderGateway";

const lineColors = ["#1d1d1b", "#9c3b3b", "#376c9d", "#47805a", "#956530", "#704987"];
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

type ChartPoint = { month: string } & Record<string, number | string>;

function currentMonthBounds() {
  const now = new Date();
  const toDate = (date: Date) => date.toISOString().slice(0, 10);
  return {
    startDate: toDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    endDate: toDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

export function AdminAnalytics() {
  const initialDates = currentMonthBounds();
  const [categories, setCategories] = useState<ApiProductCategory[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(initialDates.startDate);
  const [endDate, setEndDate] = useState(initialDates.endDate);
  const [result, setResult] = useState<ApiSalesHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void orderGateway.listProductCategories()
      .then((response) => {
        setCategories(response);
        setLoadingCategories(false);
      })
      .catch((reason: unknown) => {
        setError(reason instanceof CustomerGatewayError ? reason.message : "Não foi possível carregar as categorias.");
        setLoadingCategories(false);
      });
  }, []);

  const chartData = useMemo<ChartPoint[]>(() => result?.points.map((point) => ({
    month: point.month,
    ...point.values,
  })) ?? [], [result]);

  function toggleCategory(id: string) {
    setSelectedCategoryIds((selected) => selected.includes(id)
      ? selected.filter((item) => item !== id)
      : [...selected, id]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (endDate < startDate) {
      setError("A data final não pode ser anterior à data inicial.");
      setResult(null);
      return;
    }
    if (!selectedCategoryIds.length) {
      setError("Selecione ao menos uma categoria para a análise.");
      setResult(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setResult(await orderGateway.salesHistory(startDate, endDate, selectedCategoryIds));
    } catch (reason) {
      setResult(null);
      setError(reason instanceof CustomerGatewayError ? reason.message : "Não foi possível consultar o histórico de vendas.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-revenue-analysis" data-cy="sales-analysis">
      <form className="admin-revenue-filters" onSubmit={(event) => void submit(event)}>
        <label className="admin-filter-field">
          <span>Data inicial</span>
          <input data-cy="sales-analysis-start-date" type="date" value={startDate} max={endDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>
        <label className="admin-filter-field">
          <span>Data final</span>
          <input data-cy="sales-analysis-end-date" type="date" value={endDate} min={startDate} onChange={(event) => setEndDate(event.target.value)} />
        </label>
        <details className={`admin-category-filter${loadingCategories || loading ? " is-disabled" : ""}`}>
          <summary data-cy="sales-analysis-category-trigger">
            <span>Categorias</span>
            {selectedCategoryIds.length ? <strong>{selectedCategoryIds.length}</strong> : null}
            <svg className="admin-category-chevron" viewBox="0 0 20 20" aria-hidden="true">
              <path d="m5 7 5 5 5-5" />
            </svg>
          </summary>
          <div className="admin-category-options">
            {categories.map((category) => (
              <label key={category.id} className="admin-category-option">
                <input data-cy={`sales-analysis-category-${category.id}`} type="checkbox" disabled={loadingCategories || loading} checked={selectedCategoryIds.includes(category.id)} onChange={() => toggleCategory(category.id)} />
                <span>{category.name}</span>
              </label>
            ))}
          </div>
        </details>
        <button data-cy="sales-analysis-submit" type="submit" className="order-card-action order-card-action-primary" disabled={loading || loadingCategories}>
          {loading ? "Consultando..." : "Consultar histórico"}
        </button>
      </form>

      {error ? <p className="admin-client-error" role="alert">{error}</p> : null}
      {result ? (
        <>
          <div className="admin-revenue-summary">
            <span>Vendas entregues no período</span>
            <strong data-cy="sales-analysis-total">{money.format(result.total)}</strong>
            <p>{result.categories.map((category) => category.name).join(" · ")}</p>
          </div>
          <div className="admin-recharts-container admin-revenue-chart-container" data-cy="sales-analysis-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 12, right: 18, left: 18, bottom: 22 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e8ef" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(value) => money.format(Number(value))} width={92} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => money.format(Number(value))} labelFormatter={(label) => `Mês: ${label}`} />
                <Legend verticalAlign="bottom" height={28} />
                {result.categories.map((category, index) => (
                  <Line key={category.id} type="monotone" dataKey={category.id} name={category.name}
                    stroke={lineColors[index % lineColors.length]} strokeWidth={3}
                    dot={{ r: 4, fill: lineColors[index % lineColors.length] }} activeDot={{ r: 6 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : !loading && !error ? <p className="admin-chart-empty">Informe o período e as categorias para gerar o gráfico.</p> : null}
    </div>
  );
}
