import { api, profile } from "../../../support/vendas/flow";
import {
  createCustomer,
  addCartItem,
  productByCode,
} from "../../../support/pedidos/fixtures";
import {
  openStoreAs,
  type ApiCustomer,
} from "../../../support/pedidos/session";

describe("Vendas · RF0035/RF0036/RN0023/RN0024/RN0025 · Dados durante a compra", () => {
  for (const saveToProfile of [true, false]) {
    it(`compra com novo endereço e cartão ${saveToProfile ? "incorporados ao perfil" : "exclusivos desta compra"}`, () => {
      createCustomer().then((customer) =>
        productByCode("ROP-000003").then((product) => {
          addCartItem(customer.id, product.id);
          openStoreAs(customer, "/carrinho");
          cy.slowClick('[data-cy="cart-proceed-checkout"]');
          cy.slowClick('[data-cy="checkout-add-address"]');
          cy.slowType(
            '[data-cy="checkout-address-label"]',
            "Entrega da compra",
          );
          cy.slowSelect(
            '[data-cy="checkout-address-residence-type"]',
            "Comercial",
          );
          cy.slowSelect('[data-cy="checkout-address-street-type"]', "Avenida");
          cy.slowType('[data-cy="checkout-address-street"]', "Paulista");
          cy.slowType('[data-cy="checkout-address-number"]', "1000");
          cy.slowType(
            '[data-cy="checkout-address-neighborhood"]',
            "Bela Vista",
          );
          cy.slowType('[data-cy="checkout-address-city"]', "São Paulo");
          cy.slowSelect('[data-cy="checkout-address-state"]', "SP");
          cy.slowSelect('[data-cy="checkout-address-country"]', "Brasil");
          cy.slowType('[data-cy="checkout-address-zip-code"]', "01310900");
          if (!saveToProfile)
            cy.get('[data-cy="save-address-profile"]').uncheck();
          cy.contains("button", "Salvar endereço").click();
          cy.contains("Entrega da compra").should("be.visible");
          cy.slowClick('[data-cy="checkout-add-card"]');
          cy.slowType('[data-cy="checkout-card-number"]', "4111111111111111");
          cy.slowType('[data-cy="checkout-card-holder"]', "Cliente E2E Pedido");
          cy.slowSelect('[data-cy="checkout-card-brand"]', "Visa");
          cy.slowType('[data-cy="checkout-card-security-code"]', "123");
          if (!saveToProfile) cy.get('[data-cy="save-card-profile"]').uncheck();
          cy.contains("button", "Salvar cartão").click();
          cy.contains("Visa final 1111").should("be.visible");
          cy.intercept("POST", `${api}/customers/${customer.id}/orders`).as(
            "newDetailsOrder",
          );
          cy.slowClick('[data-cy="checkout-confirm-payment"]');
          cy.wait("@newDetailsOrder").then((r) => {
            expect(r.response?.statusCode).to.eq(201);
            expect(r.response?.body.deliveryAddress.street).to.eq("Paulista");
            cy.request<ApiCustomer>(`${api}/customers/${customer.id}`)
              .its("body")
              .then((updated) => {
                expect(updated.cards).to.have.length(saveToProfile ? 1 : 0);
                expect(updated.addresses).to.have.length(saveToProfile ? 2 : 1);
                profile(updated);
                cy.get(
                  `[data-cy="order-${r.response?.body.id}"] [data-cy="order-status"]`,
                ).should("have.text", "APROVADA");
              });
          });
        }),
      );
    });
  }
});
