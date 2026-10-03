import { prepareMockStore, registerClient } from "../support/client";

describe("Consulta de cliente", () => {
  beforeEach(prepareMockStore);

  it("consulta um cliente cadastrado pelo CPF", () => {
    registerClient();
    cy.get('[data-cy="header-admin"]').click();

    cy.contains("label", "CPF").find("input").type("12345678901");
    cy.contains("button", "Consultar").click();

    cy.contains("Ana Cliente da Silva").should("be.visible");
    cy.contains("ATIVO").should("be.visible");
  });
});
