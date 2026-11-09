import { addCartItem, addCard, createCustomer, productByCode } from "../../support/pedidos/fixtures";
import { openStoreAs } from "../../support/pedidos/session";

describe("Pedido / 04 Cartões — RF0036, RN0024, RN0025 e RN0034", () => {
  it("cadastra cartão no checkout e o associa ao perfil", () => {
    createCustomer().then((customer) => productByCode("ROP-000003").then((product) => addCartItem(customer.id, product.id).then(() => {
      openStoreAs(customer);
      cy.slowClick('[data-cy="header-cart"]');
      cy.slowClick('[data-cy="cart-proceed-checkout"]');
      cy.slowClick('[data-cy="checkout-add-card"]');
      cy.get('[data-cy="checkout-card-brand"] option').then(($options) => {
        expect([...$options].map((option) => option.textContent?.trim())).to.include.members([
          "Visa", "Mastercard", "Elo", "American Express",
        ]);
      });
      cy.slowType('[data-cy="checkout-card-number"]', "5555555555554444");
      cy.slowType('[data-cy="checkout-card-holder"]', "Cliente E2E Pedido");
      cy.slowSelect('[data-cy="checkout-card-brand"]', "Mastercard");
      cy.slowType('[data-cy="checkout-card-security-code"]', "123");
      cy.contains("button", "Salvar cartão").wait(800).click();
      cy.contains(/cartão foi associado ao seu perfil/i).should("be.visible");
      cy.contains("Mastercard final 4444").should("be.visible");
    })));
  });

  it("exige pelo menos R$ 10,00 em cada cartão quando há dois cartões", () => {
    createCustomer().then((customer) => addCard(customer.id).then((first) => addCard(first.id, "5555555555554444").then((withCards) =>
      productByCode("ROP-000001").then((product) => addCartItem(withCards.id, product.id).then(() => {
        openStoreAs(withCards);
        cy.slowClick('[data-cy="header-cart"]');
        cy.slowClick('[data-cy="cart-proceed-checkout"]');
        cy.get('[data-cy^="checkout-card-"]').filter('[type="checkbox"]').each(($card) => cy.wrap($card).check());
        cy.get('[data-cy^="checkout-card-amount-"]').first().wait(800).clear().type("9.00");
        cy.get('[data-cy^="checkout-card-amount-"]').last().wait(800).clear().type("197.90");
        cy.slowClick('[data-cy="checkout-confirm-payment"]');
        cy.contains(/cada cartão deve pagar ao menos R\$ 10,00/i).should("be.visible");
        cy.get('[data-cy^="checkout-card-amount-"]').first().wait(800).clear().type("100.00");
        cy.get('[data-cy^="checkout-card-amount-"]').last().wait(800).clear().type("106.90");
        cy.intercept("POST", `http://localhost:8081/api/v1/customers/${withCards.id}/orders`).as("createOrderWithTwoCards");
        cy.slowClick('[data-cy="checkout-confirm-payment"]');
        cy.wait("@createOrderWithTwoCards").then(({ response }) => {
          expect(response?.statusCode).to.eq(201);
          expect(response?.body.status).to.eq("EM_PROCESSAMENTO");
        });
        cy.contains(/registrado com status EM PROCESSAMENTO/i).should("be.visible");
      })),
    )));
  });
});
