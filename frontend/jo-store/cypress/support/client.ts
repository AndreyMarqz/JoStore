export function prepareMockStore() {
  cy.visit("/?gateway=mock");
  cy.clearLocalStorage();
  cy.reload();
}

export function registerClient() {
  cy.get('[data-cy="header-profile"]').click();
  cy.get('[data-cy="login-create-account"]').click();

  cy.get('[data-cy="client-full-name"]').type("Ana Cliente da Silva");
  cy.get('[data-cy="client-cpf"]').type("12345678901");
  cy.get('[data-cy="client-birth-date"]').type("1999-03-15");
  cy.get('[data-cy="client-gender"]').select("Feminino");
  cy.get('[data-cy="client-phone-type"]')
    .should("be.enabled")
    .select("Celular");
  cy.get('[data-cy="client-phone-ddd"]').type("11");
  cy.get('[data-cy="client-phone-number"]').type("999999999");
  cy.get('[data-cy="client-registration-next"]').click();

  cy.get('[data-cy="client-email"]').type("ana@example.com");
  cy.get('[data-cy="client-password"]').type("Senha@123");
  cy.get('[data-cy="client-confirm-password"]').type("Senha@123");
  cy.get('[data-cy="client-registration-next"]').click();

  cy.get('[data-cy="client-address-label"]').clear().type("Casa");
  cy.get('[data-cy="client-address-residence-type"]').select("Casa");
  cy.get('[data-cy="client-address-street-type"]').select("Rua");
  cy.get('[data-cy="client-address-street"]').type("das Flores");
  cy.get('[data-cy="client-address-number"]').type("100");
  cy.get('[data-cy="client-address-neighborhood"]').type("Centro");
  cy.get('[data-cy="client-address-zip-code"]').type("01001000");
  cy.get('[data-cy="client-address-city"]').type("São Paulo");
  cy.get('[data-cy="client-address-state"]').select("SP");
  cy.get('[data-cy="client-address-country"]').select("Brasil");
  cy.get('[data-cy^="client-address-role-"]').check();
  cy.get('[data-cy="client-register-submit"]').click();

  cy.contains("Código do cliente: CLI-000001").should("be.visible");
}
