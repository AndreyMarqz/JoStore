/// <reference types="cypress" />

declare global {
  // Cypress publica sua extensão de comandos por declaração de namespace global.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      slowClick(selector: string): Chainable<null>;
      slowType(selector: string, value: string): Chainable<null>;
      slowSelect(selector: string, value: string): Chainable<null>;
      slowCheck(selector: string): Chainable<null>;
    }
  }
}

const delay = () => Number(Cypress.expose("uiActionDelayMs") ?? 1200);

// Consultar novamente depois da pausa: a API pode atualizar ou remover o elemento.
// Não devolver o elemento clicado, pois uma navegação/transição pode desmontá-lo.
Cypress.Commands.add("slowClick", (selector) => {
  cy.wait(delay());
  cy.get(selector).should("be.visible").click();
  cy.wait(delay());
  return cy.wrap(null, { log: false });
});
Cypress.Commands.add("slowType", (selector, value) => {
  cy.wait(delay());
  cy.get(selector).should("be.visible").clear();
  cy.get(selector).type(value, { delay: 45 });
  cy.wait(delay());
  return cy.wrap(null, { log: false });
});
Cypress.Commands.add("slowSelect", (selector, value) => {
  cy.wait(delay());
  cy.get(selector).should("be.visible").select(value);
  cy.wait(delay());
  return cy.wrap(null, { log: false });
});
Cypress.Commands.add("slowCheck", (selector) => {
  cy.wait(delay());
  cy.get(selector).should("be.visible").check();
  cy.wait(delay());
  return cy.wrap(null, { log: false });
});
