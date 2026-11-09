import { addCartItem, addCard, createCustomer, productByCode } from "../../support/pedidos/fixtures";
import { openStoreAs } from "../../support/pedidos/session";

function openCheckout(customer: Parameters<typeof openStoreAs>[0]) {
  openStoreAs(customer);
  cy.slowClick('[data-cy="header-cart"]');
  cy.slowClick('[data-cy="cart-proceed-checkout"]');
}

describe("Pedido / 02 Checkout e frete — RF0033, RF0034 e RNF0011", () => {
  it("responde à consulta do catálogo em até um segundo", () => {
    const startedAt = Date.now();
    cy.request("http://localhost:8081/api/v1/products").then(() => {
      expect(Date.now() - startedAt).to.be.lessThan(1000);
    });
  });

  it("inicia checkout e calcula R$ 15,00 + R$ 2,00 por peça para entrega em SP", () => {
    createCustomer().then((customer) => addCard(customer.id).then((withCard) =>
      productByCode("ROP-000003").then((product) => addCartItem(withCard.id, product.id, 2).then(() => {
        openCheckout(withCard);
        cy.get('[data-cy="checkout-shipping-total"]', { timeout: 1000 }).should("contain.text", "19,00");
      })),
    ));
  });

  it("aplica adicional de R$ 10,00 para endereço fora de SP", () => {
    createCustomer({ outsideSp: true }).then((customer) => addCard(customer.id).then((withCard) =>
      productByCode("ROP-000003").then((product) => addCartItem(withCard.id, product.id).then(() => {
        openCheckout(withCard);
        cy.get('[data-cy="checkout-shipping-total"]', { timeout: 1000 }).should("contain.text", "27,00");
      })),
    ));
  });
});
