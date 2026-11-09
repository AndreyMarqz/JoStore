import type { ApiCustomer } from "./session";

const api = () => String(Cypress.expose("apiUrl") ?? "http://localhost:8081/api/v1");
export type Product = { id: string; code: string; name: string; price: number; availableQuantity: number };

export function productByCode(code: string): Cypress.Chainable<Product> {
  return cy.request<Product[]>(`${api()}/products`).its("body").then((products) => {
    const product = products.find((item) => item.code === code);
    expect(product, `produto E2E ${code}`).not.to.equal(undefined);
    return product as Product;
  });
}
export function createCustomer(options: { outsideSp?: boolean } = {}): Cypress.Chainable<ApiCustomer> {
  const suffix = `${Date.now()}${Cypress._.random(100, 999)}`.slice(-10);
  const outsideSp = Boolean(options.outsideSp);
  return cy.request<ApiCustomer>({ method: "POST", url: `${api()}/customers`, body: {
    fullName: "Cliente E2E Pedido", cpf: `9${suffix}`, gender: "FEMININO", birthDate: "1995-05-10",
    phone: { type: "CELULAR", areaCode: "11", number: "999999999" }, email: `e2e.pedido.${suffix}@jostore.test`,
    password: "Senha@123", confirmPassword: "Senha@123", addresses: [{
      label: "Casa E2E", roles: ["RESIDENCIA", "COBRANCA", "ENTREGA"], residenceType: "Casa", streetType: "Rua",
      street: "Teste", number: "100", neighborhood: "Centro", zipCode: outsideSp ? "20040002" : "01001000",
      city: outsideSp ? "Rio de Janeiro" : "São Paulo", state: outsideSp ? "RJ" : "SP", country: "Brasil",
    }],
  }}).its("body");
}
export function addCard(customerId: string, number = "4111111111111111") {
  return cy.request<ApiCustomer>({ method: "POST", url: `${api()}/customers/${customerId}/cards`, body: {
    holder: "Cliente E2E Pedido", number, brand: number.startsWith("5") ? "MASTERCARD" : "VISA", securityCode: "123",
  }}).its("body");
}
export function addCartItem(customerId: string, productId: string, quantity = 1) {
  return cy.request({ method: "POST", url: `${api()}/customers/${customerId}/cart/items`, body: { productId, size: "M", quantity } });
}
export function resetCouponFixtures() { return cy.task("resetOrderCouponFixtures"); }
export function listCoupons(customerId: string) { return cy.request<Array<{ id: string; code: string; value: number; type: string }>>(`${api()}/customers/${customerId}/coupons`).its("body"); }
