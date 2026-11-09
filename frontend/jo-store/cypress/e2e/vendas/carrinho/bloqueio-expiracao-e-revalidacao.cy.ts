import { api, prepare } from "../../../support/vendas/flow";
import { openStoreAs } from "../../../support/pedidos/session";
describe("Vendas · RN0044/RN0045/RNF0042/RN0032 · Reserva", () => {
  it("avisa cinco minutos antes, expira todos os tamanhos e desabilita a compra", () => {
    prepare().then(({ customer, productId }) => {
      cy.request("POST", `${api}/customers/${customer.id}/cart/items`, {
        productId,
        size: "G",
        quantity: 2,
      });
      openStoreAs(customer, "/carrinho");
      cy.get(".cart-item-card").should("have.length", 2);
      cy.request("POST", `${api}/e2e/clock/advance?seconds=301`);
      cy.get('[data-cy="reservation-warning"]').should("be.visible");
      cy.wait(Number(Cypress.expose("uiActionDelayMs") ?? 1200));
      cy.request("POST", `${api}/e2e/clock/advance?seconds=300`);
      cy.get('[data-cy="expired-cart-item"]').should("have.length", 2);
      cy.get('[data-cy="cart-proceed-checkout"]').should("be.disabled");
      cy.wait(Number(Cypress.expose("uiActionDelayMs") ?? 1200));
      cy.task("salesSnapshot", { customerId: customer.id, productId }).should(
        "include",
        { stock: 30, reserved: 0 },
      );
    });
  });
  it("revalida alteração de estoque e mantém a correção após o erro do checkout", () => {
    prepare("4111111111111111", 3).then(({ customer }) => {
      openStoreAs(customer, "/carrinho");
      cy.task("setProductStock", { code: "ROP-000003", quantity: 1 });
      cy.slowClick('[data-cy="cart-proceed-checkout"]');
      cy.contains(/estoque foi alterado/i).should("be.visible");
      cy.visit("/carrinho");
      cy.get(".cart-item-stepper-value").should("have.text", "1");
      cy.get('[data-cy="expired-cart-item"]').should(
        "contain.text",
        "Disponibilidade de estoque alterada",
      );
    });
  });
});
