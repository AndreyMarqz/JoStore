export type ApiCustomer = {
  id: string; code: string; fullName: string; cpf: string;
  gender: "FEMININO" | "MASCULINO" | "NAO_BINARIO" | "PREFIRO_NAO_INFORMAR";
  birthDate: string;
  phone: { type: "CELULAR" | "RESIDENCIAL" | "COMERCIAL"; areaCode: string; number: string };
  email: string; status: "ATIVO" | "INATIVO";
  addresses: Array<Record<string, unknown>>; cards: Array<Record<string, unknown>>;
};

const role: Record<string, string> = { RESIDENCIA: "Residência", COBRANCA: "Cobrança", ENTREGA: "Entrega" };
const gender: Record<string, string> = { FEMININO: "Feminino", MASCULINO: "Masculino", NAO_BINARIO: "Não binário", PREFIRO_NAO_INFORMAR: "Prefiro não informar" };
const phoneType: Record<string, string> = { CELULAR: "Celular", RESIDENCIAL: "Residencial", COMERCIAL: "Comercial" };
const brand: Record<string, string> = { VISA: "Visa", MASTERCARD: "Mastercard", ELO: "Elo", AMERICAN_EXPRESS: "American Express" };

export function browserCustomer(customer: ApiCustomer) {
  return {
    ...customer,
    gender: gender[customer.gender], phone: { ...customer.phone, type: phoneType[customer.phone.type] },
    addresses: customer.addresses.map((address) => ({ ...address, roles: ((address.roles as string[]) ?? []).map((item) => role[item]) })),
    cards: customer.cards.map((card) => ({ ...card, brand: brand[String(card.brand)] })),
  };
}

export function openStoreAs(customer: ApiCustomer, path = "/") {
  cy.intercept("GET", `http://localhost:8081/api/v1/customers/${customer.id}/cart`).as("loadE2eCart");
  cy.intercept("GET", "http://localhost:8081/api/v1/products").as("loadE2eProducts");
  cy.visit(path, { onBeforeLoad(window) {
    window.localStorage.clear();
    window.localStorage.setItem("jostore.session.v1", JSON.stringify(browserCustomer(customer)));
  }});
  cy.wait("@loadE2eCart").its("response.statusCode").should("eq", 200);
  cy.wait("@loadE2eProducts").its("response.statusCode").should("eq", 200);
  cy.wait(800);
}
