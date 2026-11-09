import { addCartItem, addCard, createCustomer, productByCode } from "../../support/pedidos/fixtures";
import { openStoreAs } from "../../support/pedidos/session";

describe("Pedido / 06 Finalização — RF0038 e RNF0012", () => {
  it("registra pedido EM PROCESSAMENTO, limpa o carrinho e grava log", () => {
    let logsBefore = 0;
    cy.task<number>("countOrderLogs").then((count) => { logsBefore = count; });
    createCustomer().then((customer) => addCard(customer.id).then((withCard) => productByCode("ROP-000003").then((product) => addCartItem(withCard.id, product.id).then(() => {
      openStoreAs(withCard);
      cy.slowClick('[data-cy="header-cart"]');
      cy.slowClick('[data-cy="cart-proceed-checkout"]');
      cy.slowClick('[data-cy="checkout-confirm-payment"]');
      cy.contains(/pedido realizado/i).should("be.visible");
      cy.contains(/EM PROCESSAMENTO/i).should("be.visible");
      cy.task<number>("countOrderLogs").should("be.greaterThan", logsBefore);
    }))));
  });
});
