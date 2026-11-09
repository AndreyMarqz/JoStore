import {
  api,
  approvedSale,
  deliver,
  profile,
} from "../../../support/vendas/flow";
describe("Vendas · RF0039/RF0040/RN0039/RN0040 · Administração", () => {
  it("despacha venda aprovada, confirma entrega e impede repetição da transição", () => {
    approvedSale().then((sale) => {
      deliver(sale);
      profile(sale.customer);
      cy.get(
        `[data-cy="order-${sale.order.id}"] [data-cy="order-status"]`,
      ).should("have.text", "ENTREGUE");
      cy.request({
        method: "POST",
        url: `${api}/orders/${sale.order.id}/dispatch`,
        failOnStatusCode: false,
      })
        .its("status")
        .should("eq", 422);
      cy.task("salesSnapshot", {
        customerId: sale.customer.id,
        productId: sale.productId,
      }).should("include", { stock: 29, reserved: 0 });
    });
  });
});
