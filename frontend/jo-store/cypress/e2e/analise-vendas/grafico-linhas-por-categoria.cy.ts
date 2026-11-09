// Pausas intencionais para que a apresentação acompanhe cada ação no runner.
const presentationDelay = 1600;
const categories = {
  camisas: "40000000-0000-0000-0000-000000000001",
  camisetas: "40000000-0000-0000-0000-000000000002",
  vestidos: "40000000-0000-0000-0000-000000000003",
};

function openAnalysis() {
  cy.visit("/admin");
  cy.wait(presentationDelay);
  cy.contains("button", "Gráfico de análise").click();
  cy.wait(presentationDelay);
  cy.get('[data-cy="sales-analysis"]').should("be.visible");
}

function selectCategory(categoryId: string) {
  cy.wait(presentationDelay);
  cy.get('[data-cy="sales-analysis-category-trigger"]').then(($trigger) => {
    if (!$trigger.parent("details").prop("open")) cy.wrap($trigger).click();
  });
  cy.wait(presentationDelay);
  cy.get(`[data-cy="sales-analysis-category-${categoryId}"]`).check();
  cy.wait(presentationDelay);
}

function fillPeriod(startDate = "2026-01-01", endDate = "2026-03-31") {
  cy.get('[data-cy="sales-analysis-start-date"]').clear().type(startDate);
  cy.wait(presentationDelay);
  cy.get('[data-cy="sales-analysis-end-date"]').clear().type(endDate);
  cy.wait(presentationDelay);
}

function submitHistory(alias = "salesHistory") {
  cy.intercept("GET", "**/admin/sales-history*").as(alias);
  cy.get('[data-cy="sales-analysis-submit"]').click();
}

describe("Análise de vendas — gráfico de linhas por categoria", () => {
  it("Cenário 1 — consulta uma categoria em período válido e soma somente as vendas ENTREGUE por mês", () => {
    openAnalysis();
    selectCategory(categories.camisas);
    fillPeriod();
    submitHistory();
    cy.wait("@salesHistory").its("response.body").then((body) => {
      expect(body.total).to.equal(539.7);
      expect(body.points).to.deep.include.members([
        { month: "1/2026", values: { [categories.camisas]: 379.8 } },
        { month: "2/2026", values: { [categories.camisas]: 159.9 } },
      ]);
    });
    cy.wait(presentationDelay);
    cy.get('[data-cy="sales-analysis-chart"]').should("be.visible");
    cy.get('[data-cy="sales-analysis-total"]').should("contain", "539,70");
  });

  it("Cenário 2 — compara duas ou mais categorias no mesmo período", () => {
    openAnalysis();
    selectCategory(categories.camisas);
    selectCategory(categories.vestidos);
    fillPeriod();
    submitHistory();
    cy.wait("@salesHistory");
    cy.wait(presentationDelay);
    cy.get('[data-cy="sales-analysis-chart"]').should("be.visible");
    cy.get('[data-cy="sales-analysis-total"]').should("contain", "759,60");
    cy.get('[data-cy="sales-analysis-chart"]').contains("Camisas").should("be.visible");
    cy.get('[data-cy="sales-analysis-chart"]').contains("Vestidos").should("be.visible");
  });

  it("Cenário 3 — apresenta o resultado em gráfico de linhas, por mês e com valores em reais", () => {
    openAnalysis();
    selectCategory(categories.camisas);
    selectCategory(categories.vestidos);
    fillPeriod();
    submitHistory();
    cy.wait("@salesHistory");
    cy.wait(presentationDelay);
    cy.get('[data-cy="sales-analysis-chart"]').should("be.visible");
    cy.get('[data-cy="sales-analysis-chart"] svg path.recharts-line-curve').should("have.length", 2);
    cy.get('[data-cy="sales-analysis-chart"]').contains("1/2026").should("be.visible");
    cy.get('[data-cy="sales-analysis-chart"]').contains("R$").should("be.visible");
  });

  it("Cenário 4 — altera a data inicial ou final e atualiza o resultado do gráfico", () => {
    openAnalysis();
    selectCategory(categories.camisas);
    fillPeriod("2026-02-01", "2026-02-28");
    submitHistory();
    cy.wait("@salesHistory");
    cy.wait(presentationDelay);
    cy.get('[data-cy="sales-analysis-total"]').should("contain", "159,90");
  });

  it("Cenário 5 — não contabiliza no gráfico uma compra com status diferente de ENTREGUE", () => {
    openAnalysis();
    selectCategory(categories.camisetas);
    fillPeriod();
    submitHistory();
    cy.wait("@salesHistory").its("response.body.total").should("equal", 0);
    cy.wait(presentationDelay);
    cy.get('[data-cy="sales-analysis-chart"]').should("be.visible");
    cy.get('[data-cy="sales-analysis-total"]').should("contain", "0,00");
  });

  it("Cenário 6 — reflete na consulta seguinte a compra que passa para ENTREGUE dentro do período", () => {
    openAnalysis();
    selectCategory(categories.camisas);
    fillPeriod();
    submitHistory("firstHistory");
    cy.wait("@firstHistory").its("response.body.total").should("equal", 539.7);
    cy.wait(presentationDelay);
    cy.task("markAnalyticsOrderDelivered");
    cy.wait(presentationDelay);
    submitHistory("updatedHistory");
    cy.wait("@updatedHistory").its("response.body.total").should("equal", 729.6);
    cy.wait(presentationDelay);
    cy.get('[data-cy="sales-analysis-total"]').should("contain", "729,60");
  });

  it("Cenário 7 — permite o gráfico ao administrador e nega o acesso a outro perfil", () => {
    openAnalysis();
    selectCategory(categories.camisas);
    fillPeriod();
    submitHistory("administratorHistory");
    cy.wait("@administratorHistory").its("response.statusCode").should("equal", 200);
    cy.wait(presentationDelay);
    cy.get('[data-cy="sales-analysis-chart"]').should("be.visible");
    cy.intercept("GET", "**/admin/sales-history*", (request) => {
      request.headers["x-jostore-role"] = "CLIENTE";
      request.continue();
    }).as("forbiddenHistory");
    cy.get('[data-cy="sales-analysis-submit"]').click();
    cy.wait("@forbiddenHistory").its("response.statusCode").should("equal", 403);
    cy.wait(presentationDelay);
    cy.get('[data-cy="sales-analysis"] [role="alert"]')
      .should("contain", "somente para o perfil administrador");
  });

  it("Cenário 8 — responde a consulta do histórico em até um segundo", () => {
    openAnalysis();
    selectCategory(categories.camisas);
    selectCategory(categories.vestidos);
    fillPeriod();
    cy.intercept("GET", "**/admin/sales-history*").as("performanceHistory");
    let startedAt = 0;
    cy.then(() => { startedAt = Date.now(); });
    cy.get('[data-cy="sales-analysis-submit"]').click();
    cy.wait("@performanceHistory").then((interception) => {
      expect(Date.now() - startedAt).to.be.lessThan(1000);
      expect(interception.response?.statusCode).to.equal(200);
    });
    cy.wait(presentationDelay);
    cy.get('[data-cy="sales-analysis-chart"]').should("be.visible");
  });
});
