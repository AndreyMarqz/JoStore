import { addCartItem, addCard, createCustomer, productByCode } from "../../support/pedidos/fixtures";
import { openStoreAs } from "../../support/pedidos/session";

describe("Pedido / 03 Endereço — RF0035 e RN0023", () => {
  it("cadastra endereço de entrega no checkout e o incorpora ao perfil", () => {
    createCustomer().then((customer) => addCard(customer.id).then((withCard) =>
      productByCode("ROP-000003").then((product) => addCartItem(withCard.id, product.id).then(() => {
        openStoreAs(withCard);
        cy.slowClick('[data-cy="header-cart"]');
        cy.slowClick('[data-cy="cart-proceed-checkout"]');
        cy.slowClick('[data-cy="checkout-add-address"]');
        cy.slowType('[data-cy="checkout-address-label"]', "Trabalho E2E");
        cy.slowSelect('[data-cy="checkout-address-residence-type"]', "Comercial");
        cy.slowSelect('[data-cy="checkout-address-street-type"]', "Avenida");
        cy.slowType('[data-cy="checkout-address-street"]', "Paulista");
        cy.slowType('[data-cy="checkout-address-number"]', "1000");
        cy.slowType('[data-cy="checkout-address-neighborhood"]', "Bela Vista");
        cy.slowType('[data-cy="checkout-address-city"]', "São Paulo");
        cy.slowSelect('[data-cy="checkout-address-state"]', "SP");
        cy.slowSelect('[data-cy="checkout-address-country"]', "Brasil");
        cy.slowType('[data-cy="checkout-address-zip-code"]', "01310900");
        cy.intercept("POST", "http://localhost:8081/api/v1/customers/*/addresses").as("saveCheckoutAddress");
        cy.contains("button", "Salvar endereço").wait(800).click();
        cy.wait("@saveCheckoutAddress").its("response.statusCode").should("eq", 201);
        cy.contains("Trabalho E2E").should("be.visible");
      })),
    ));
  });
});
