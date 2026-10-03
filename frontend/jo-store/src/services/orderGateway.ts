import { CustomerGatewayError } from "./customerGateway";

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
  status: "EM_PROCESSAMENTO";
  createdAt: string;
  subtotal: number;
  shipping: number;
  couponDiscount: number;
  total: number;
  generatedExchangeCoupon?: ApiCoupon | null;
};

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
  return response.json() as Promise<T>;
}

export const orderGateway = {
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
