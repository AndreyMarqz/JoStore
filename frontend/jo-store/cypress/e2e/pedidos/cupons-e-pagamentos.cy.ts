import { addCartItem, addCard, createCustomer, listCoupons, productByCode, resetCouponFixtures } from "../../support/pedidos/fixtures";
import { openStoreAs } from "../../support/pedidos/session";
import { profile } from "../../support/vendas/flow";

describe("Pedido / 05 Cupons — RF0037 e RN0033 a RN0036", () => {
  beforeEach(() => { resetCouponFixtures(); });

  it("permite apenas um cupom promocional por compra", () => {
    createCustomer().then((customer) => addCard(customer.id).then((withCard) => productByCode("ROP-000003").then((product) => addCartItem(withCard.id, product.id).then(() => {
      openStoreAs(withCard);
      cy.slowClick('[data-cy="header-cart"]');
      cy.contains("button", "Cupons disponíveis").wait(800).click();
      cy.get('[data-cy="coupon-toggle-E2E-PROMO-110"]').check();
      cy.get('[data-cy="coupon-toggle-E2E-PROMO-10"]').should("be.disabled");
    }))));
  });

  it("aceita saldo inferior a R$ 10,00 no cartão quando há cupom", () => {
    createCustomer().then((customer) => addCard(customer.id).then((withCard) => productByCode("ROP-000003").then((product) => addCartItem(withCard.id, product.id).then(() => {
      openStoreAs(withCard);
      cy.slowClick('[data-cy="header-cart"]');
      cy.contains("button", "Cupons disponíveis").wait(800).click();
      cy.get('[data-cy="coupon-toggle-E2E-PROMO-110"]').check();
      cy.slowClick('[aria-label="Fechar cupons"]');
      cy.slowClick('[data-cy="cart-proceed-checkout"]');
      cy.slowClick('[data-cy="checkout-confirm-payment"]');
      cy.contains(/registrado com status EM PROCESSAMENTO/i).should("be.visible");
    }))));
  });

  it("gera cupom de troca para a diferença dos cupons utilizados", () => {
    createCustomer().then((customer) => addCard(customer.id).then((withCard) => productByCode("ROP-000003").then((product) => addCartItem(withCard.id, product.id).then(() => {
      openStoreAs(withCard);
      cy.slowClick('[data-cy="header-cart"]');
      cy.contains("button", "Cupons disponíveis").wait(800).click();
      cy.get('[data-cy="coupon-toggle-E2E-TROCA-80"]').check();
      cy.get('[data-cy="coupon-toggle-E2E-TROCA-50"]').check();
      cy.slowClick('[aria-label="Fechar cupons"]');
      cy.slowClick('[data-cy="cart-proceed-checkout"]');
      cy.slowClick('[data-cy="checkout-confirm-payment"]');
      cy.contains(/registrado com status EM PROCESSAMENTO/i).should("be.visible");
      profile(withCard);
      cy.get('[data-cy="order-status"]').first().should("have.text", "APROVADA");
      cy.get('[data-cy="difference-coupon"]').should("contain.text", "13,10");
      listCoupons(withCard.id).then((coupons) => expect(coupons.some((coupon) => coupon.code.startsWith("TROCA-") && coupon.value === 13.1)).to.eq(true));
    }))));
  });

  it("mantém os cupons de maior valor e remove automaticamente os menores desnecessários", () => {
    createCustomer().then((customer) => addCard(customer.id).then((withCard) => productByCode("ROP-000001").then((product) => addCartItem(withCard.id, product.id).then(() => {
      openStoreAs(withCard);
      cy.slowClick('[data-cy="header-cart"]');
      cy.contains("button", "Cupons disponíveis").wait(800).click();
      cy.get('[data-cy="coupon-toggle-E2E-TROCA-80"]').check();
      cy.get('[data-cy="coupon-toggle-E2E-TROCA-50"]').check();
      cy.get('[data-cy="coupon-toggle-E2E-TROCA-13990"]').check();
      cy.contains(/cupons ajustados/i).should("be.visible");
      cy.get('[data-cy="coupon-toggle-E2E-TROCA-13990"]').should("be.checked");
      cy.get('[data-cy="coupon-toggle-E2E-TROCA-80"]').should("be.checked");
      cy.get('[data-cy="coupon-toggle-E2E-TROCA-50"]')
        .should("not.be.checked")
        .and("be.disabled");
      cy.get('[data-cy="coupon-E2E-TROCA-50"]')
        .should("have.class", "is-disabled")
        .and("contain.text", "Cupons de maior valor já cobrem a compra");
    }))));
  });
});
