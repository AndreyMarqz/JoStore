import { prepareMockStore, registerClient } from "../support/client";

describe("Alteração de cliente", () => {
  beforeEach(prepareMockStore);

  it("altera os dados pessoais de um cliente cadastrado", () => {
    registerClient();
    cy.contains("button", "Alterar informações").click();

    cy.contains("h2", "Dados pessoais")
      .closest("section")
      .within(() => {
        cy.contains("label", "Nome completo")
          .find("input")
          .clear()
          .type("Ana Cliente Atualizada");
        cy.contains("button", "Salvar dados pessoais").click();
      });

    cy.contains("Dados atualizados").should("be.visible");
    cy.contains("h2", "Dados pessoais")
      .closest("section")
      .find('label:contains("Nome completo") input')
      .should("have.value", "Ana Cliente Atualizada");
  });
});
