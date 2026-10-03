import { prepareMockStore, registerClient } from "../support/client";

describe("Cadastro de cliente", () => {
  beforeEach(prepareMockStore);

  it("cadastra um cliente com os dados obrigatórios", () => {
    registerClient();

    cy.contains("Ana Cliente da Silva").should("be.visible");
    cy.contains("Código do cliente: CLI-000001").should("be.visible");
  });
});
