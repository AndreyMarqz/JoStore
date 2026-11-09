import {
  addCartItem,
  addCard,
  createCustomer,
  productByCode,
} from "../pedidos/fixtures";
import { openStoreAs, type ApiCustomer } from "../pedidos/session";
import type { ApiOrder } from "../../../src/services/orderGateway";
export const api = String(Cypress.expose("apiUrl") ?? "http://localhost:8081/api/v1");
export type Sale = {
  customer: ApiCustomer;
  productId: string;
  order: ApiOrder;
};

export function prepare(number = "4111111111111111", quantity = 1) {
  return createCustomer()
    .then((c) => addCard(c.id, number))
    .then((customer) =>
      productByCode("ROP-000003").then((p) =>
        addCartItem(customer.id, p.id, quantity).then(() => ({
          customer,
          productId: p.id,
        })),
      ),
    );
}
export function checkout(customer: ApiCustomer) {
  openStoreAs(customer, "/carrinho");
  cy.slowClick('[data-cy="cart-proceed-checkout"]');
  cy.intercept("POST", `${api}/customers/${customer.id}/orders`).as(
    "createSale",
  );
  cy.slowClick('[data-cy="checkout-confirm-payment"]');
  return cy.wait("@createSale").then((r) => {
    expect(r.response?.statusCode).to.eq(201);
    expect(r.response?.body.status).to.eq("EM_PROCESSAMENTO");
    return r.response!.body as ApiOrder;
  });
}
export function profile(customer: ApiCustomer) {
  openStoreAs(customer, "/perfil");
  cy.contains("button", "Meus pedidos").click();
  cy.get('[data-cy="customer-sales"]').should("be.visible");
}
export function admin(customer: ApiCustomer) {
  openStoreAs(customer, "/admin");
  cy.contains("button", /^Pedidos$/).click();
  cy.get('[data-cy="admin-sales"]').should("be.visible");
}
export function approvedSale(quantity = 1): Cypress.Chainable<Sale> {
  return prepare("4111111111111111", quantity).then(({ customer, productId }) =>
    checkout(customer).then((order) => {
      profile(customer);
      cy.get(`[data-cy="order-${order.id}"] [data-cy="order-status"]`, {
        timeout: 30000,
      }).should("have.text", "APROVADA");
      return cy.wrap({ customer, productId, order });
    }),
  );
}
export function deliver(sale: Sale) {
  admin(sale.customer);
  cy.slowType('[data-cy="order-filter-code"]', sale.order.code);
  cy.intercept("POST", `${api}/orders/${sale.order.id}/dispatch`).as(
    "dispatchSale",
  );
  cy.slowClick(`[data-cy="order-${sale.order.id}"] [data-cy="dispatch-order"]`);
  cy.wait("@dispatchSale").then(({ response }) => {
    expect(response?.statusCode).to.eq(200);
    expect(response?.body.status).to.eq("EM_TRANSPORTE");
  });
  cy.get(`[data-cy="order-${sale.order.id}"] [data-cy="order-status"]`).should(
    "have.text",
    "EM TRANSPORTE",
  );
  cy.intercept("POST", `${api}/orders/${sale.order.id}/delivery-confirmation`).as(
    "confirmDelivery",
  );
  cy.slowClick(`[data-cy="order-${sale.order.id}"] [data-cy="deliver-order"]`);
  cy.wait("@confirmDelivery").then(({ response }) => {
    expect(response?.statusCode).to.eq(200);
    expect(response?.body.status).to.eq("ENTREGUE");
  });
  cy.get(`[data-cy="order-${sale.order.id}"] [data-cy="order-status"]`).should(
    "have.text",
    "ENTREGUE",
  );
}
export function authorizeAndReceive(sale: Sale) {
  admin(sale.customer);
  cy.get('[data-cy="sales-view-exchanges"]').click();
  cy.contains('[data-cy^="exchange-"] h4', sale.order.code)
    .closest("article")
    .as("exchangeCard");
  cy.get("@exchangeCard")
    .find('[data-cy="authorize-exchange"]')
    .wait(Number(Cypress.expose("uiActionDelayMs")))
    .click();
  cy.get("@exchangeCard")
    .find('[data-cy="exchange-status"]')
    .should("have.text", "TROCA AUTORIZADA");
  profile(sale.customer);
  cy.contains('[data-cy="exchange-notification"]', sale.order.code).should(
    "be.visible",
  );
  cy.wait(Number(Cypress.expose("uiActionDelayMs") ?? 1200));
  cy.contains('[data-cy="exchange-notification"]', sale.order.code)
    .find("button").click();
  cy.contains('[data-cy="exchange-notification"]', sale.order.code)
    .find("button").should("not.exist");
  admin(sale.customer);
  cy.get('[data-cy="sales-view-exchanges"]').click();
  cy.contains('[data-cy^="exchange-"] h4', sale.order.code)
    .closest("article")
    .as("exchangeCard");
  cy.get("@exchangeCard")
    .find('[data-cy="receive-exchange"]')
    .wait(Number(Cypress.expose("uiActionDelayMs")))
    .click();
  cy.get("@exchangeCard")
    .find('[data-cy="exchange-status"]')
    .should("have.text", "TROCADO");
}
