import {
  api,
  approvedSale,
  deliver,
  profile,
  authorizeAndReceive,
} from "../../../support/vendas/flow";
import { addCartItem } from "../../../support/pedidos/fixtures";
import { openStoreAs } from "../../../support/pedidos/session";
describe("Vendas · RF0041–RF0045/RN0041–RN0043/RN0046/RF0054 · Trocas", () => {
  it("bloqueia troca antes da entrega na interface e na API", () => {
    approvedSale().then((sale) => {
      cy.get(
        `[data-cy="order-${sale.order.id}"] [data-cy="request-exchange"]`,
      ).should("be.disabled");
      cy.request({
        method: "POST",
        url: `${api}/customers/${sale.customer.id}/orders/${sale.order.id}/exchanges`,
        body: { items: [{ orderItemId: sale.order.items[0].id, quantity: 1 }] },
        failOnStatusCode: false,
      })
        .its("status")
        .should("eq", 422);
    });
  });
  it("troca parcial: autoriza, notifica, recebe, emite cupom e recompõe somente a quantidade devolvida", () => {
    approvedSale(2).then((sale) => {
      deliver(sale);
      profile(sale.customer);
      cy.slowType(
        `[data-cy="exchange-quantity-${sale.order.items[0].id}"]`,
        "1",
      );
      cy.get(`[data-cy="exchange-quantity-${sale.order.items[0].id}"]`).should(
        "have.value",
        "1",
      );
      cy.slowClick(
        `[data-cy="order-${sale.order.id}"] [data-cy="request-exchange"]`,
      );
      cy.contains("Troca parcial").should("be.visible");
      authorizeAndReceive(sale);
      cy.task("salesSnapshot", {
        customerId: sale.customer.id,
        productId: sale.productId,
      }).should("include", { stock: 29, reserved: 0 });
      profile(sale.customer);
      cy.contains('[data-cy^="available-coupon-"]', "99,90").should(
        "be.visible",
      );
      cy.get(
        `[data-cy="order-${sale.order.id}"] [data-cy="order-status"]`,
      ).should("have.text", "ENTREGUE");
    });
  });
  it("troca integral e utiliza o cupom emitido em uma nova compra", () => {
    approvedSale().then((sale) => {
      deliver(sale);
      profile(sale.customer);
      cy.slowClick(
        `[data-cy="order-${sale.order.id}"] [data-cy="exchange-full-order"]`,
      );
      cy.get(
        `[data-cy="order-${sale.order.id}"] [data-cy="order-status"]`,
      ).should("have.text", "EM TROCA");
      authorizeAndReceive(sale);
      cy.task("salesSnapshot", {
        customerId: sale.customer.id,
        productId: sale.productId,
      }).should("include", { stock: 30, reserved: 0 });
      profile(sale.customer);
      cy.get(
        `[data-cy="order-${sale.order.id}"] [data-cy="order-status"]`,
      ).should("have.text", "TROCADO");
      cy.request<Array<{ id: string; code: string }>>(
        `${api}/customers/${sale.customer.id}/coupons`,
      )
        .its("body")
        .then((coupons) => {
          const coupon = coupons.find((c) => c.code.startsWith("TROCA-"))!;
          expect(coupon).not.to.equal(undefined);
          addCartItem(sale.customer.id, sale.productId);
          openStoreAs(sale.customer, "/carrinho");
          cy.contains("button", "Cupons disponíveis").click();
          cy.contains(".coupon-card", coupon.code)
            .find('input[type="checkbox"]')
            .check();
          cy.slowClick('[aria-label="Fechar cupons"]');
          cy.slowClick('[data-cy="cart-proceed-checkout"]');
          cy.intercept(
            "POST",
            `${api}/customers/${sale.customer.id}/orders`,
          ).as("reusedCoupon");
          cy.slowClick('[data-cy="checkout-confirm-payment"]');
          cy.wait("@reusedCoupon").then((r) => {
            expect(r.response?.body.couponDiscount).to.eq(99.9);
            profile(sale.customer);
            cy.get(
              `[data-cy="order-${r.response?.body.id}"] [data-cy="order-status"]`,
            ).should("have.text", "APROVADA");
            cy.get(`[data-cy="available-coupon-${coupon.id}"]`).should(
              "not.exist",
            );
          });
        });
    });
  });
});
