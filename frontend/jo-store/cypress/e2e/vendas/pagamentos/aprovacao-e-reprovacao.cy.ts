import {
  prepare,
  checkout,
  profile,
  approvedSale,
} from "../../../support/vendas/flow";
describe("Vendas · RN0037/RN0038/RF0053/RN0028 · Validação de pagamento", () => {
  it("aprova um cartão, registra histórico e baixa estoque uma única vez", () => {
    approvedSale().then((sale) => {
      cy.task("salesSnapshot", {
        customerId: sale.customer.id,
        productId: sale.productId,
      }).should("include", { stock: 29, reserved: 0 });
      cy.get(`[data-cy="order-${sale.order.id}"] summary`).click();
      cy.contains("Compra finalizada").should("be.visible");
      cy.contains("Pagamento validado").should("be.visible");
      cy.reload();
      cy.contains("button", "Meus pedidos").click();
      cy.get(
        `[data-cy="order-${sale.order.id}"] [data-cy="order-status"]`,
      ).should("have.text", "APROVADA");
      cy.task("salesSnapshot", {
        customerId: sale.customer.id,
        productId: sale.productId,
      }).should("include", { stock: 29, reserved: 0 });
    });
  });
  it("reprova cartão final 0000, desbloqueia itens e mantém estoque físico", () => {
    prepare("4111111111170000").then(({ customer, productId }) =>
      checkout(customer).then((order) => {
        profile(customer);
        cy.get(`[data-cy="order-${order.id}"] [data-cy="order-status"]`).should(
          "have.text",
          "REPROVADA",
        );
        cy.task("salesSnapshot", { customerId: customer.id, productId }).should(
          "include",
          { stock: 30, reserved: 0 },
        );
        cy.get(
          `[data-cy="order-${order.id}"] [data-cy="request-exchange"]`,
        ).should("be.disabled");
      }),
    );
  });
});
