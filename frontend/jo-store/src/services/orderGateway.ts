import { CustomerGatewayError } from "./customerGateway";
import { mapAddressFromApi, mapAddressToApi, mapCardFromApi } from "./httpCustomerGateway";
import type { CardCreateInput, ClientAddressInput } from "../types/store";

const apiBaseUrl =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8080/api/v1";

export type ApiProduct = {
  id: string;
  code: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  availableQuantity: number;
};
export type ApiCartItem = {
  id: string;
  product: ApiProduct;
  size: string;
  quantity: number;
  unitPrice: number;
  total: number;
};
export type ApiCart = {
  id: string | null;
  items: ApiCartItem[];
  subtotal: number;
  expiresAt: string | null;
  serverTime: string;
  expirationWarning: boolean;
  removedItems: Array<{ id: string; productId: string; name: string; size: string; quantity: number; reason: string }>;
};
export type ApiCoupon = {
  id: string;
  code: string;
  type: "PROMOCIONAL" | "TROCA";
  value: number;
  description: string;
};
export type ApiQuote = {
  subtotal: number;
  shipping: number;
  couponDiscount: number;
  total: number;
  appliedCoupons: ApiCoupon[];
};
export type CardPayment = { cardId: string; amount: number };
export type ApiOrder = {
  id: string;
  code: string;
  status: "EM_PROCESSAMENTO" | "APROVADA" | "REPROVADA" | "EM_TRANSPORTE" | "ENTREGUE" | "EM_TROCA" | "TROCA_AUTORIZADA" | "TROCADO";
  items: ApiCartItem[];
  deliveryAddress: { id: string; street: string; number: string; city: string; state: string };
  payments: Array<{ cardId: string; description: string; amount: number }>;
  history: Array<{ status: string; actor: string; description: string; occurredAt: string }>;
  createdAt: string;
  subtotal: number;
  shipping: number;
  couponDiscount: number;
  total: number;
  generatedExchangeCoupon?: ApiCoupon | null;
};
export type ApiExchange = {
  id: string; orderId: string; orderCode: string; customerId: string;
  status: "EM_TROCA" | "TROCA_AUTORIZADA" | "TROCADO"; fullOrder: boolean; couponId: string | null;
  items: Array<{ orderItemId: string; quantity: number; name: string; size: string; unitPrice: number; restock: boolean | null }>;
};
export type ApiNotification = { id: string; message: string; createdAt: string; readAt: string | null };

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new CustomerGatewayError(
      "Não foi possível conectar à API da JoStore.",
      503,
    );
  }
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
      fieldErrors?: { message: string }[];
    } | null;
    throw new CustomerGatewayError(
      payload?.fieldErrors?.[0]?.message ??
        payload?.message ??
        "Não foi possível concluir a operação.",
      response.status,
    );
  }
  if (response.status === 204) return undefined as T;
  const body = await response.text();
  return body ? JSON.parse(body) as T : undefined as T;
}

export const orderGateway = {
  checkoutAddress: async (customerId: string, input: ClientAddressInput, saveToProfile: boolean) => mapAddressFromApi(await request<Parameters<typeof mapAddressFromApi>[0]>(`/customers/${customerId}/checkout/addresses?saveToProfile=${saveToProfile}`, { method: "POST", body: JSON.stringify(mapAddressToApi(input)) })),
  checkoutCard: async (customerId: string, input: CardCreateInput, saveToProfile: boolean) => mapCardFromApi(await request<Parameters<typeof mapCardFromApi>[0]>(`/customers/${customerId}/checkout/cards?saveToProfile=${saveToProfile}`, { method: "POST", body: JSON.stringify({ ...input, brand: ({ Visa: "VISA", Mastercard: "MASTERCARD", Elo: "ELO", "American Express": "AMERICAN_EXPRESS" } as Record<string,string>)[input.brand] }) })),
  listOrders: (customerId?: string, status = "", code = "", page = 0) => request<{ content: ApiOrder[]; totalPages: number }>(customerId
    ? `/customers/${customerId}/orders?size=20&page=${page}`
    : `/orders?size=20&page=${page}&status=${encodeURIComponent(status)}&code=${encodeURIComponent(code)}`),
  getOrder: (customerId: string, id: string) => request<ApiOrder>(`/customers/${customerId}/orders/${id}`),
  dispatch: (id: string) => request<ApiOrder>(`/orders/${id}/dispatch`, { method: "POST" }),
  deliver: (id: string) => request<ApiOrder>(`/orders/${id}/delivery-confirmation`, { method: "POST" }),
  exchanges: (customerId?: string) => request<ApiExchange[]>(customerId ? `/customers/${customerId}/exchanges` : "/exchanges"),
  requestExchange: (customerId: string, orderId: string, items: Array<{ orderItemId: string; quantity: number }>) => request<ApiExchange>(`/customers/${customerId}/orders/${orderId}/exchanges`, { method: "POST", body: JSON.stringify({ items }) }),
  authorize: (id: string) => request<ApiExchange>(`/exchanges/${id}/authorize`, { method: "POST" }),
  receive: (id: string, items: Array<{ orderItemId: string; restock: boolean }>) => request<ApiExchange>(`/exchanges/${id}/receipt-confirmation`, { method: "POST", body: JSON.stringify({ items }) }),
  notifications: (id: string) => request<ApiNotification[]>(`/customers/${id}/notifications`),
  readNotification: (customerId: string, id: string) => request<void>(`/customers/${customerId}/notifications/${id}/read`, { method: "PATCH" }),
  listProducts: () => request<ApiProduct[]>("/products"),
  getCart: (customerId: string) =>
    request<ApiCart>(`/customers/${customerId}/cart`),
  addCartItem: (
    customerId: string,
    productId: string,
    size: string,
    quantity: number,
  ) =>
    request<ApiCart>(`/customers/${customerId}/cart/items`, {
      method: "POST",
      body: JSON.stringify({ productId, size, quantity }),
    }),
  updateCartItem: (
    customerId: string,
    itemId: string,
    productId: string,
    size: string,
    quantity: number,
  ) =>
    request<ApiCart>(`/customers/${customerId}/cart/items/${itemId}`, {
      method: "PUT",
      body: JSON.stringify({ productId, size, quantity }),
    }),
  removeCartItem: (customerId: string, itemId: string) =>
    request<void>(`/customers/${customerId}/cart/items/${itemId}`, {
      method: "DELETE",
    }),
  listCoupons: (customerId: string) =>
    request<ApiCoupon[]>(`/customers/${customerId}/coupons`),
  quote: (customerId: string, deliveryAddressId: string, couponIds: string[]) =>
    request<ApiQuote>(`/customers/${customerId}/orders/quote`, {
      method: "POST",
      body: JSON.stringify({ deliveryAddressId, couponIds }),
    }),
  createOrder: (
    customerId: string,
    deliveryAddressId: string,
    couponIds: string[],
    cardPayments: CardPayment[],
  ) =>
    request<ApiOrder>(`/customers/${customerId}/orders`, {
      method: "POST",
      body: JSON.stringify({
        quote: { deliveryAddressId, couponIds },
        cardPayments,
      }),
    }),
};
