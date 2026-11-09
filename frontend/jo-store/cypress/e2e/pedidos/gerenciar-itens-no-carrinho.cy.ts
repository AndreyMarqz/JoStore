import { createCustomer, productByCode } from "../../support/pedidos/fixtures";
import { openStoreAs } from "../../support/pedidos/session";

describe("Pedido / 01 Carrinho — RF0031, RF0032 e RN0031", () => {
  afterEach(() => {
    cy.task("setProductStock", { code: "ROP-000006", quantity: 10 });
  });
  it("adiciona dois produtos pela interface, edita a quantidade e remove um item", () => {
    createCustomer().then((customer) => {
      openStoreAs(customer);
      cy.get('[aria-label="Abrir detalhes de Camisa Xadrez Urban"]').should("be.visible").wait(800).click();
      cy.contains("button", "Visualizar item").wait(800).click();
      cy.contains("button", "M").wait(800).click();
      cy.get('[aria-label="Aumentar quantidade"]').wait(800).click().wait(800);
      cy.intercept("POST", "http://localhost:8081/api/v1/customers/*/cart/items").as("addFirstCartItem");
      cy.contains("button", "Adicionar ao carrinho").wait(800).click();
      cy.wait("@addFirstCartItem").its("response.statusCode").should("eq", 201);
      cy.contains("button", "← Voltar para produtos").wait(800).click();
      cy.get('[aria-label="Abrir detalhes de Camiseta Essential"]').should("be.visible").wait(800).click();
      cy.contains("button", "Visualizar item").wait(800).click();
      cy.contains("button", "M").wait(800).click();
      cy.intercept("POST", "http://localhost:8081/api/v1/customers/*/cart/items").as("addSecondCartItem");
      cy.contains("button", "Adicionar ao carrinho").wait(800).click();
      cy.wait("@addSecondCartItem").its("response.statusCode").should("eq", 201);
      cy.slowClick('[data-cy="header-cart"]');
      cy.get(".cart-item-card").should("have.length", 2);
      cy.get('[data-cy^="cart-increase-"]').first().wait(800).click();
      cy.get(".cart-item-stepper-value").first().should("contain.text", "3");
      cy.get('[data-cy^="cart-remove-"]').last().wait(800).click();
      cy.get(".cart-item-card").should("have.length", 1);
    });
  });

  it("impede adicionar quantidade superior ao estoque disponível", () => {
    createCustomer().then((customer) => productByCode("ROP-000006").then((product) => {
      openStoreAs(customer);
      cy.get('[aria-label="Abrir detalhes de Vestido Aura"]').should("be.visible").wait(800).click();
      cy.contains("button", "Visualizar item").wait(800).click();
      cy.contains("button", "M").wait(800).click();
      Cypress._.times(product.availableQuantity, () => {
        cy.get('[aria-label="Aumentar quantidade"]').wait(800).click();
      });
      cy.intercept("POST", "http://localhost:8081/api/v1/customers/*/cart/items").as("rejectUnavailableQuantity");
      cy.contains("button", "Adicionar ao carrinho").wait(800).click();
      cy.wait("@rejectUnavailableQuantity").its("response.statusCode").should("eq", 422);
      cy.contains(/carrinho não atualizado/i).should("be.visible");
    }));
  });

  it("impede adicionar ao carrinho um produto sem estoque", () => {
    cy.task("setProductStock", { code: "ROP-000006", quantity: 0 });
    createCustomer().then((customer) => {
      openStoreAs(customer);
      cy.get('[aria-label="Abrir detalhes de Vestido Aura"]').should("be.visible").wait(800).click();
      cy.contains("button", "Visualizar item").wait(800).click();
      cy.contains("button", "M").wait(800).click();
      cy.intercept("POST", "http://localhost:8081/api/v1/customers/*/cart/items").as("rejectUnavailableProduct");
      cy.contains("button", "Adicionar ao carrinho").wait(800).click();
      cy.wait("@rejectUnavailableProduct").its("response.statusCode").should("eq", 422);
      cy.contains(/carrinho não atualizado/i).should("be.visible");
    });
  });
});
