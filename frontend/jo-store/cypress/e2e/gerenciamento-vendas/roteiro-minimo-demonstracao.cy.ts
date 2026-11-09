import { addCartItem, addCard, createCustomer, listCoupons, productByCode, resetCouponFixtures } from "../../support/pedidos/fixtures";
import { openStoreAs } from "../../support/pedidos/session";
import { api, approvedSale, authorizeAndReceive, checkout, deliver, prepare, profile } from "../../support/vendas/flow";

const presentationDelay = () => Number(Cypress.expose("uiActionDelayMs") ?? 1800);

function openCheckout(customer: Parameters<typeof openStoreAs>[0]) {
  openStoreAs(customer);
  cy.slowClick('[data-cy="header-cart"]');
  cy.slowClick('[data-cy="cart-proceed-checkout"]');
}

describe("Roteiro de demonstração — Gerenciar Vendas Eletrônicas", () => {
  it("Cenário 1 — aprova uma compra paga com um único cartão de crédito e baixa o estoque", () => {
    approvedSale().then((sale) => {
      cy.get(`[data-cy="order-${sale.order.id}"] summary`).click();
      cy.contains("Compra finalizada").should("be.visible");
      cy.contains("Pagamento validado").should("be.visible");
      cy.get(`[data-cy="order-${sale.order.id}"] [data-cy="order-status"]`).should("have.text", "APROVADA");
      cy.task("salesSnapshot", { customerId: sale.customer.id, productId: sale.productId })
        .should("include", { stock: 29, reserved: 0 });
    });
  });

  it("Cenário 2 — bloqueia pagamento inferior a R$ 10,00 em um dos dois cartões e aceita a divisão válida", () => {
    createCustomer().then((customer) => addCard(customer.id).then((first) => addCard(first.id, "5555555555554444").then((withCards) =>
      productByCode("ROP-000001").then((product) => addCartItem(withCards.id, product.id).then(() => {
        openCheckout(withCards);
        cy.get('[data-cy^="checkout-card-"]').filter('[type="checkbox"]').each(($card) => cy.wrap($card).check());
        cy.get('[data-cy^="checkout-card-amount-"]').first().clear().type("9.00");
        cy.get('[data-cy^="checkout-card-amount-"]').last().clear().type("197.90");
        cy.slowClick('[data-cy="checkout-confirm-payment"]');
        cy.contains(/cada cartão deve pagar ao menos R\$ 10,00/i).should("be.visible");
        cy.wait(presentationDelay());
        cy.get('[data-cy^="checkout-card-amount-"]').first().clear().type("100.00");
        cy.get('[data-cy^="checkout-card-amount-"]').last().clear().type("106.90");
        cy.intercept("POST", `${api}/customers/${withCards.id}/orders`).as("createOrderWithTwoCards");
        cy.slowClick('[data-cy="checkout-confirm-payment"]');
        cy.wait("@createOrderWithTwoCards").then(({ response }) => {
          expect(response?.statusCode).to.eq(201);
          expect(response?.body.status).to.eq("EM_PROCESSAMENTO");
        });
      })),
    )));
  });

  it("Cenário 3 — permite pagamento com cupom promocional e saldo inferior a R$ 10,00 no cartão", () => {
    resetCouponFixtures();
    createCustomer().then((customer) => addCard(customer.id).then((withCard) => productByCode("ROP-000003").then((product) => addCartItem(withCard.id, product.id).then(() => {
      openStoreAs(withCard);
      cy.slowClick('[data-cy="header-cart"]');
      cy.contains("button", "Cupons disponíveis").click();
      cy.get('[data-cy="coupon-toggle-E2E-PROMO-110"]').check();
      cy.slowClick('[aria-label="Fechar cupons"]');
      cy.slowClick('[data-cy="cart-proceed-checkout"]');
      cy.intercept("POST", `${api}/customers/${withCard.id}/orders`).as("orderWithPromoCoupon");
      cy.slowClick('[data-cy="checkout-confirm-payment"]');
      cy.wait("@orderWithPromoCoupon").its("response.statusCode").should("eq", 201);
      cy.contains(/registrado com status EM PROCESSAMENTO/i).should("be.visible");
    }))));
  });

  it("Cenário 4 — usa cupons de troca acima do total e emite cupom para a diferença", () => {
    resetCouponFixtures();
    createCustomer().then((customer) => addCard(customer.id).then((withCard) => productByCode("ROP-000003").then((product) => addCartItem(withCard.id, product.id).then(() => {
      openStoreAs(withCard);
      cy.slowClick('[data-cy="header-cart"]');
      cy.contains("button", "Cupons disponíveis").click();
      cy.get('[data-cy="coupon-toggle-E2E-TROCA-80"]').check();
      cy.get('[data-cy="coupon-toggle-E2E-TROCA-50"]').check();
      cy.slowClick('[aria-label="Fechar cupons"]');
      cy.slowClick('[data-cy="cart-proceed-checkout"]');
      cy.slowClick('[data-cy="checkout-confirm-payment"]');
      profile(withCard);
      cy.get('[data-cy="order-status"]').first().should("have.text", "APROVADA");
      cy.get('[data-cy="difference-coupon"]').should("contain.text", "13,10");
      listCoupons(withCard.id).then((coupons) => {
        expect(coupons.some((coupon) => coupon.code.startsWith("TROCA-") && coupon.value === 13.1)).to.eq(true);
      });
    }))));
  });

  it("Cenário 5 — reprova pagamento, desbloqueia os itens e não dá baixa no estoque", () => {
    prepare("4111111111170000").then(({ customer, productId }) => checkout(customer).then((order) => {
      profile(customer);
      cy.get(`[data-cy="order-${order.id}"] [data-cy="order-status"]`, { timeout: 30000 }).should("have.text", "REPROVADA");
      cy.task("salesSnapshot", { customerId: customer.id, productId }).should("include", { stock: 30, reserved: 0 });
    }));
  });

  it("Cenário 6 — expira o bloqueio do carrinho, remove itens e desabilita a compra", () => {
    prepare().then(({ customer, productId }) => {
      cy.request("POST", `${api}/customers/${customer.id}/cart/items`, { productId, size: "G", quantity: 2 });
      openStoreAs(customer, "/carrinho");
      cy.get(".cart-item-card").should("have.length", 2);
      cy.request("POST", `${api}/e2e/clock/advance?seconds=301`);
      cy.visit("/carrinho");
      cy.get('[data-cy="reservation-warning"]').should("be.visible");
      cy.wait(presentationDelay());
      cy.request("POST", `${api}/e2e/clock/advance?seconds=300`);
      cy.visit("/carrinho");
      cy.get('[data-cy="expired-cart-item"]').should("have.length", 2);
      cy.get('[data-cy="cart-proceed-checkout"]').should("be.disabled");
      cy.task("salesSnapshot", { customerId: customer.id, productId }).should("include", { stock: 30, reserved: 0 });
    });
  });

  it("Cenário 7 — administrador despacha uma venda APROVADA e confirma a entrega até ENTREGUE", () => {
    approvedSale().then((sale) => {
      deliver(sale);
      profile(sale.customer);
      cy.get(`[data-cy="order-${sale.order.id}"] [data-cy="order-status"]`).should("have.text", "ENTREGUE");
      cy.request({ method: "POST", url: `${api}/orders/${sale.order.id}/dispatch`, failOnStatusCode: false })
        .its("status").should("eq", 422);
    });
  });

  it("Cenário 8 — bloqueia a solicitação de troca quando o pedido ainda não foi ENTREGUE", () => {
    approvedSale().then((sale) => {
      cy.get(`[data-cy="order-${sale.order.id}"] [data-cy="request-exchange"]`).should("be.disabled");
      cy.request({
        method: "POST",
        url: `${api}/customers/${sale.customer.id}/orders/${sale.order.id}/exchanges`,
        body: { items: [{ orderItemId: sale.order.items[0].id, quantity: 1 }] },
        failOnStatusCode: false,
      }).its("status").should("eq", 422);
    });
  });

  it("Cenário 9 — permite solicitar a troca parcial de um item e a troca integral de uma compra", () => {
    approvedSale(2).then((partialSale) => {
      deliver(partialSale);
      profile(partialSale.customer);
      cy.slowType(`[data-cy="exchange-quantity-${partialSale.order.items[0].id}"]`, "1");
      cy.slowClick(`[data-cy="order-${partialSale.order.id}"] [data-cy="request-exchange"]`);
      cy.get(`[data-cy="order-${partialSale.order.id}"] [data-cy="order-status"]`).should("have.text", "EM TROCA");
    });
    approvedSale().then((fullSale) => {
      deliver(fullSale);
      profile(fullSale.customer);
      cy.slowClick(`[data-cy="order-${fullSale.order.id}"] [data-cy="exchange-full-order"]`);
      cy.get(`[data-cy="order-${fullSale.order.id}"] [data-cy="order-status"]`).should("have.text", "EM TROCA");
    });
  });

  it("Cenário 10 — processa a troca: solicitação, autorização, notificação, recebimento, cupom e reentrada no estoque", () => {
    approvedSale(2).then((sale) => {
      deliver(sale);
      profile(sale.customer);
      cy.slowType(`[data-cy="exchange-quantity-${sale.order.items[0].id}"]`, "1");
      cy.slowClick(`[data-cy="order-${sale.order.id}"] [data-cy="request-exchange"]`);
      cy.slowClick('[data-cy="sales-view-exchanges"]');
      cy.contains("Troca parcial").should("be.visible");
      cy.slowClick('[data-cy="sales-view-orders"]');
      authorizeAndReceive(sale);
      cy.task("salesSnapshot", { customerId: sale.customer.id, productId: sale.productId }).should("include", { stock: 29, reserved: 0 });
      profile(sale.customer);
      cy.get(`[data-cy="order-${sale.order.id}"] [data-cy="order-status"]`).should("have.text", "TROCADO");
      cy.slowClick('[data-cy="sales-view-exchanges"]');
      cy.contains('[data-cy^="available-coupon-"]', "99,90").should("be.visible");
    });
  });

  it("Cenário 11 — utiliza em uma nova compra o cupom de troca emitido após a devolução", () => {
    approvedSale().then((sale) => {
      deliver(sale);
      profile(sale.customer);
      cy.slowClick(`[data-cy="order-${sale.order.id}"] [data-cy="exchange-full-order"]`);
      authorizeAndReceive(sale);
      cy.request<Array<{ id: string; code: string }>>(`${api}/customers/${sale.customer.id}/coupons`).its("body").then((coupons) => {
        const coupon = coupons.find((item) => item.code.startsWith("TROCA-"));
        expect(coupon).not.to.equal(undefined);
        addCartItem(sale.customer.id, sale.productId);
        openStoreAs(sale.customer, "/carrinho");
        cy.contains("button", "Cupons disponíveis").click();
        cy.contains(".coupon-card", coupon!.code).find('input[type="checkbox"]').check();
        cy.slowClick('[aria-label="Fechar cupons"]');
        cy.slowClick('[data-cy="cart-proceed-checkout"]');
        cy.intercept("POST", `${api}/customers/${sale.customer.id}/orders`).as("reusedCoupon");
        cy.slowClick('[data-cy="checkout-confirm-payment"]');
        cy.wait("@reusedCoupon").then((result) => {
          expect(result.response?.body.couponDiscount).to.eq(99.9);
          profile(sale.customer);
          cy.get(`[data-cy="order-${result.response?.body.id}"] [data-cy="order-status"]`).should("have.text", "APROVADA");
          cy.get(`[data-cy="available-coupon-${coupon!.id}"]`).should("not.exist");
        });
      });
    });
  });
});
