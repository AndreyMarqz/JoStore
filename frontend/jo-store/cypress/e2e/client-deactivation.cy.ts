import { prepareMockStore, registerClient } from "../support/client";

describe("Inativação de cliente", () => {
  beforeEach(prepareMockStore);

  it("inativa um cliente cadastrado", () => {
    registerClient();
    cy.get('[data-cy="header-admin"]').click();
    cy.contains("label", "CPF").find("input").type("12345678901");
    cy.contains("button", "Consultar").click();

    cy.contains("button", "Inativar cliente").click();

    cy.contains("INATIVO").should("be.visible");
    cy.contains("button", "Inativar cliente").should("not.exist");
  });
});
