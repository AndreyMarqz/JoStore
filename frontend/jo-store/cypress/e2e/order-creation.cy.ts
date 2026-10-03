const api = "http://localhost:8080/api/v1";

type Customer = {
  id: string;
  addresses: { id: string }[];
  cards: { id: string }[];
};

function createCustomer(): Cypress.Chainable<Customer> {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-10);
  return cy
    .request<Customer>({
      method: "POST",
      url: `${api}/customers`,
      body: {
        fullName: "Cliente E2E Pedido",
        cpf: `9${suffix}`,
        gender: "FEMININO",
        birthDate: "1995-05-10",
        phone: { type: "CELULAR", areaCode: "11", number: "999999999" },
        email: `pedido.${suffix}@example.com`,
        password: "Senha@123",
        confirmPassword: "Senha@123",
        addresses: [
          {
            label: "Casa",
            roles: ["RESIDENCIA", "COBRANCA", "ENTREGA"],
            residenceType: "Casa",
            streetType: "Rua",
            street: "Flores",
            number: "100",
            neighborhood: "Centro",
            zipCode: "01001000",
            city: "Sao Paulo",
            state: "SP",
            country: "Brasil",
          },
        ],
      },
    })
    .its("body");
}

function addCard(customerId: string, number = "4111111111111111") {
  return cy
    .request<Customer>({
      method: "POST",
      url: `${api}/customers/${customerId}/cards`,
      body: {
        holder: "Cliente E2E Pedido",
        number,
        brand: number.startsWith("5") ? "MASTERCARD" : "VISA",
        securityCode: "123",
      },
    })
    .its("body");
}

function addItem(
  customerId: string,
  productId = "10000000-0000-0000-0000-000000000003",
  quantity = 1,
) {
  return cy.request({
    method: "POST",
    url: `${api}/customers/${customerId}/cart/items`,
    body: { productId, size: "M", quantity },
  });
}

function quote(customer: Customer, couponIds: string[] = []) {
  return cy.request<{ total: number; shipping: number }>({
    method: "POST",
    url: `${api}/customers/${customer.id}/orders/quote`,
    body: { deliveryAddressId: customer.addresses[0].id, couponIds },
  });
}

describe("Criação de pedido — API e interface", () => {
  it("Fluxo feliz pela interface — revisa carrinho, checkout e confirma o pedido", () => {
    return createCustomer()
      .then((customer) => addCard(customer.id))
      .then((withCard) => {
        return addItem(
          withCard.id,
          "10000000-0000-0000-0000-000000000003",
          1,
        ).then(() => {
          const session = {
            ...withCard,
            gender: "Feminino",
            phone: { ...withCard.phone, type: "Celular" },
            addresses: withCard.addresses.map(
              (address: Record<string, unknown>) => ({
                ...address,
                roles: (address.roles as string[]).map(
                  (role) =>
                    ({
                      RESIDENCIA: "Residência",
                      COBRANCA: "Cobrança",
                      ENTREGA: "Entrega",
                    })[role],
                ),
              }),
            ),
            cards: withCard.cards.map((card: Record<string, unknown>) => ({
              ...card,
              brand: "Visa",
            })),
          };
          cy.intercept("GET", `${api}/customers/${withCard.id}/cart`).as(
            "loadCart",
          );
          cy.visit("/", {
            onBeforeLoad(window) {
              window.localStorage.setItem(
                "jostore.session.v1",
                JSON.stringify(session),
              );
            },
          });
          cy.wait("@loadCart").its("response.statusCode").should("eq", 200);
          cy.get('[data-cy="header-cart"]').click();
          cy.contains("Finalizar compra").click();
          cy.contains("Confirmar pagamento").click();
          cy.contains("EM PROCESSAMENTO").should("be.visible");
        });
      });
  });

  it("RF0031/RF0032/RN0031 — inclui mais de um produto, altera quantidade e rejeita estoque excedido", () => {
    createCustomer().then((customer) => {
      addItem(customer.id, "10000000-0000-0000-0000-000000000001", 1);
      addItem(customer.id, "10000000-0000-0000-0000-000000000003", 2).then(
        ({ body }) => {
          const item = body.items.find(
            (current: { product: { id: string } }) =>
              current.product.id === "10000000-0000-0000-0000-000000000003",
          );
          cy.request({
            method: "PUT",
            url: `${api}/customers/${customer.id}/cart/items/${item.id}`,
            body: { productId: item.product.id, size: "M", quantity: 3 },
          })
            .its("body.items")
            .should("have.length", 2);
        },
      );
      cy.request({
        method: "POST",
        url: `${api}/customers/${customer.id}/cart/items`,
        failOnStatusCode: false,
        body: {
          productId: "10000000-0000-0000-0000-000000000006",
          size: "M",
          quantity: 11,
        },
      })
        .its("status")
        .should("eq", 422);
      cy.request(`${api}/customers/${customer.id}/cart`)
        .its("body.items")
        .should("have.length", 2);
    });
  });

  it("RF0033/RF0034/RF0038 — calcula frete e registra pedido EM_PROCESSAMENTO", () => {
    createCustomer().then((customer) =>
      addCard(customer.id).then((withCard) => {
        addItem(customer.id, "10000000-0000-0000-0000-000000000001", 2);
        quote(withCard).then(({ body }) => {
          expect(body.shipping).to.eq(19);
          cy.request({
            method: "POST",
            url: `${api}/customers/${withCard.id}/orders`,
            body: {
              quote: {
                deliveryAddressId: withCard.addresses[0].id,
                couponIds: [],
              },
              cardPayments: [
                { cardId: withCard.cards[0].id, amount: body.total },
              ],
            },
          })
            .its("body.status")
            .should("eq", "EM_PROCESSAMENTO");
        });
      }),
    );
  });

  it("RF0035/RF0036/RF0037 — incorpora novo endereço e cartão ao perfil", () => {
    createCustomer().then((customer) => {
      cy.request<Customer>({
        method: "POST",
        url: `${api}/customers/${customer.id}/addresses`,
        body: {
          label: "Trabalho",
          roles: ["ENTREGA"],
          residenceType: "Comercial",
          streetType: "Avenida",
          street: "Paulista",
          number: "200",
          neighborhood: "Bela Vista",
          zipCode: "01310100",
          city: "Sao Paulo",
          state: "SP",
          country: "Brasil",
        },
      })
        .its("body.addresses")
        .should("have.length", 2);
      addCard(customer.id, "5555555555554444")
        .its("cards")
        .should("have.length", 1);
    });
  });

  it("RN0033/RN0034/RN0035 — valida um promocional e o mínimo em múltiplos cartões", () => {
    createCustomer().then((customer) =>
      addCard(customer.id).then((first) =>
        addCard(customer.id, "5555555555554444").then((withCards) => {
          addItem(withCards.id);
          quote(withCards).then(({ body }) => {
            cy.request({
              method: "POST",
              url: `${api}/customers/${withCards.id}/orders`,
              failOnStatusCode: false,
              body: {
                quote: {
                  deliveryAddressId: withCards.addresses[0].id,
                  couponIds: [],
                },
                cardPayments: [
                  { cardId: withCards.cards[0].id, amount: 5 },
                  { cardId: withCards.cards[1].id, amount: body.total - 5 },
                ],
              },
            })
              .its("status")
              .should("eq", 422);
          });
        }),
      ),
    );
  });

  it("RN0036 — cupom excedente gera cupom de troca para a diferença", () => {
    return cy
      .task("resetExchangeCoupon")
      .then(() => createCustomer())
      .then((customer) => {
        return addItem(customer.id)
          .then(() => quote(customer, ["30000000-0000-0000-0000-000000000005"]))
          .then(() => {
            cy.request({
              method: "POST",
              url: `${api}/customers/${customer.id}/orders`,
              body: {
                quote: {
                  deliveryAddressId: customer.addresses[0].id,
                  couponIds: ["30000000-0000-0000-0000-000000000005"],
                },
                cardPayments: [],
              },
            })
              .its("body.generatedExchangeCoupon.code")
              .should("match", /^TROCA-/);
          });
      });
  });

  it("RN0036 - aceita apenas os cupons necessarios e gera a diferenca", () => {
    const couponIds = [
      "40000000-0000-0000-0000-000000000080",
      "40000000-0000-0000-0000-000000000050",
      "40000000-0000-0000-0000-000000000040",
    ];

    return cy
      .task("resetRn0036CouponSet")
      .then(() => createCustomer())
      .then((customer) => {
        return addItem(customer.id).then(() => {
          cy.request({
            method: "POST",
            url: `${api}/customers/${customer.id}/orders/quote`,
            failOnStatusCode: false,
            body: { deliveryAddressId: customer.addresses[0].id, couponIds },
          }).then(({ status, body }) => {
            expect(status).to.eq(422);
            expect(body.message).to.match(/cupom desnecess/i);
          });

          return quote(customer, couponIds.slice(0, 2)).then(({ body }) => {
            expect(body.total).to.eq(0);
            return cy
              .request({
                method: "POST",
                url: `${api}/customers/${customer.id}/orders`,
                body: {
                  quote: {
                    deliveryAddressId: customer.addresses[0].id,
                    couponIds: couponIds.slice(0, 2),
                  },
                  cardPayments: [],
                },
              })
              .its("body")
              .then((order) => {
                expect(order.coupons).to.have.length(2);
                expect(order.generatedExchangeCoupon.value).to.eq(13.1);
              });
          });
        });
      });
  });

  it("RF0031 - remove um item do carrinho sem afetar os demais", () => {
    return createCustomer().then((customer) => {
      return addItem(customer.id, "10000000-0000-0000-0000-000000000001")
        .then(() =>
          addItem(customer.id, "10000000-0000-0000-0000-000000000003"),
        )
        .then(({ body }) => {
          const itemToRemove = body.items.find(
            (item: { product: { id: string } }) =>
              item.product.id === "10000000-0000-0000-0000-000000000001",
          );
          return cy.request({
            method: "DELETE",
            url: `${api}/customers/${customer.id}/cart/items/${itemToRemove.id}`,
          });
        })
        .then(() => cy.request(`${api}/customers/${customer.id}/cart`))
        .its("body.items")
        .should("have.length", 1);
    });
  });

  it("RN0034 - conclui pagamento dividido em dois cartoes com minimo de R$ 10", () => {
    return createCustomer()
      .then((customer) => addCard(customer.id))
      .then((firstCard) => addCard(firstCard.id, "5555555555554444"))
      .then((customer) =>
        addItem(customer.id)
          .then(() => quote(customer))
          .then(({ body }) => {
            expect(body.total).to.be.greaterThan(20);
            return cy
              .request({
                method: "POST",
                url: `${api}/customers/${customer.id}/orders`,
                body: {
                  quote: {
                    deliveryAddressId: customer.addresses[0].id,
                    couponIds: [],
                  },
                  cardPayments: [
                    { cardId: customer.cards[0].id, amount: 10 },
                    { cardId: customer.cards[1].id, amount: body.total - 10 },
                  ],
                },
              })
              .its("body.status")
              .should("eq", "EM_PROCESSAMENTO");
          }),
      );
  });

  it("RN0033/RN0035 - bloqueia dois promocionais e aceita cupom com saldo menor que R$ 10 no cartao", () => {
    const highCoupon = "40000000-0000-0000-0000-000000000110";
    const extraPromoCoupon = "40000000-0000-0000-0000-000000000010";

    return cy
      .task("resetPaymentCouponSet")
      .then(() => createCustomer())
      .then((customer) => addCard(customer.id))
      .then((customer) =>
        addItem(customer.id).then(() => {
          cy.request({
            method: "POST",
            url: `${api}/customers/${customer.id}/orders/quote`,
            failOnStatusCode: false,
            body: {
              deliveryAddressId: customer.addresses[0].id,
              couponIds: [highCoupon, extraPromoCoupon],
            },
          })
            .its("status")
            .should("eq", 422);

          return quote(customer, [highCoupon]).then(({ body }) => {
            expect(body.total).to.be.lessThan(10);
            return cy
              .request({
                method: "POST",
                url: `${api}/customers/${customer.id}/orders`,
                body: {
                  quote: {
                    deliveryAddressId: customer.addresses[0].id,
                    couponIds: [highCoupon],
                  },
                  cardPayments: [
                    { cardId: customer.cards[0].id, amount: body.total },
                  ],
                },
              })
              .its("body.status")
              .should("eq", "EM_PROCESSAMENTO");
          });
        }),
      );
  });

  it("RF0035/RF0036/RF0037 - cadastra endereco e cartao durante o checkout", () => {
    return createCustomer()
      .then((customer) => addItem(customer.id).then(() => customer))
      .then((customer) => {
        const session = {
          ...customer,
          gender: "Feminino",
          phone: { ...customer.phone, type: "Celular" },
          addresses: customer.addresses.map(
            (address: Record<string, unknown>) => ({
              ...address,
              roles: (address.roles as string[]).map(
                (role) =>
                  ({
                    RESIDENCIA: "Residência",
                    COBRANCA: "Cobrança",
                    ENTREGA: "Entrega",
                  })[role],
              ),
            }),
          ),
          cards: [],
        };
        cy.intercept("GET", `${api}/customers/${customer.id}/cart`).as(
          "loadCheckoutCart",
        );
        cy.visit("/", {
          onBeforeLoad(window) {
            window.localStorage.setItem(
              "jostore.session.v1",
              JSON.stringify(session),
            );
          },
        });
        cy.wait("@loadCheckoutCart");
        cy.get('[data-cy="header-cart"]').click();
        cy.contains("Finalizar compra").click();

        cy.contains("button", "Adicionar cartão +").click();
        cy.get('input[placeholder="Número do cartão"]').type(
          "4111111111111111",
        );
        cy.get('input[placeholder="Nome impresso no cartão"]').type(
          "Cliente E2E Pedido",
        );
        cy.get(".checkout-inline-form").first().find("select").select("Visa");
        cy.get('input[placeholder="Código de segurança"]').type("123");
        cy.contains("button", "Salvar cartão").click();
        cy.contains("O cartão foi associado ao seu perfil.").should(
          "be.visible",
        );

        cy.contains("button", "Adicionar endereço +").click();
        cy.get(".checkout-inline-form")
          .last()
          .within(() => {
            cy.get('input[placeholder="Nome do endereço"]').type("Trabalho");
            cy.get("select").eq(0).select("Comercial");
            cy.get("select").eq(1).select("Avenida");
            cy.get('input[placeholder="Logradouro"]').type("Paulista");
            cy.get('input[placeholder="Número"]').type("200");
            cy.get('input[placeholder="Bairro"]').type("Bela Vista");
            cy.get('input[placeholder="Cidade"]').type("São Paulo");
            cy.get("select").eq(2).select("SP");
            cy.get("select").eq(3).select("Brasil");
            cy.get('input[placeholder="CEP"]').type("01310100");
            cy.get('input[type="checkbox"]').check();
          });
        cy.contains("button", "Salvar endereço").click();
        cy.contains("O endereço de entrega foi associado ao perfil.").should(
          "be.visible",
        );
        cy.contains("Trabalho").should("be.visible");
        cy.contains("Visa final 1111").should("be.visible");
        cy.contains("Confirmar pagamento").click();
        cy.contains("EM PROCESSAMENTO").should("be.visible");
      });
  });

  it("RNF0011/RNF0012 - registra o pedido em tempo aceitavel e grava o log de escrita", () => {
    return cy.task<number>("countOrderLogs").then((logsBefore) =>
      createCustomer()
        .then((customer) => addCard(customer.id))
        .then((customer) =>
          addItem(customer.id)
            .then(() => quote(customer))
            .then(({ body }) =>
              cy
                .request({
                  method: "POST",
                  url: `${api}/customers/${customer.id}/orders`,
                  body: {
                    quote: {
                      deliveryAddressId: customer.addresses[0].id,
                      couponIds: [],
                    },
                    cardPayments: [
                      { cardId: customer.cards[0].id, amount: body.total },
                    ],
                  },
                })
                .then((response) => {
                  expect(response.status).to.eq(201);
                  expect(response.duration).to.be.lessThan(2000);
                  return cy
                    .task<number>("countOrderLogs")
                    .should("eq", logsBefore + 1);
                }),
            ),
        ),
    );
  });
});
