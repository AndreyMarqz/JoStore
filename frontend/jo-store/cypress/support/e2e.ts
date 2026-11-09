// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import "./commands";
import "./pedidos/session";
beforeEach(() => {
  if (/pedidos|vendas|analise-vendas/.test(Cypress.spec.relative)) {
    cy.task("resetSalesFixtures");
    cy.request("POST", "http://localhost:8081/api/v1/e2e/clock/reset");
  }
  if (/analise-vendas/.test(Cypress.spec.relative)) cy.task("resetAnalyticsFixtures");
});
