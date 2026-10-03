import type {
  AddressRole,
  AddressLookupResult,
  CardCreateInput,
  ClientAddress,
  ClientAddressInput,
  ClientCard,
  ClientDetails,
  ClientFilter,
  ClientPasswordUpdateInput,
  ClientPhone,
  ClientRegistrationInput,
  ClientStatus,
  ClientSummary,
  ClientUpdateInput,
  PageResult,
} from "../types/store";
import {
  CustomerGatewayError,
  mockCustomerGateway,
  type CustomerGateway,
} from "./customerGateway";

const apiBaseUrl =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8080/api/v1";
const localAccessStorageKey = "jostore.local-access.v1";

type ApiAddressRole = "RESIDENCIA" | "COBRANCA" | "ENTREGA";
type ApiGender =
  "FEMININO" | "MASCULINO" | "NAO_BINARIO" | "PREFIRO_NAO_INFORMAR";
type ApiPhoneType = "CELULAR" | "RESIDENCIAL" | "COMERCIAL";
type ApiCardBrand = "VISA" | "MASTERCARD" | "ELO" | "AMERICAN_EXPRESS";

type ApiPhone = { type: ApiPhoneType; areaCode: string; number: string };
type ApiAddress = {
  id: string;
  label: string;
  roles: ApiAddressRole[];
  residenceType: string;
  streetType: string;
  street: string;
  number: string;
  neighborhood: string;
  zipCode: string;
  city: string;
  state: string;
  country: string;
  complement?: string;
  notes?: string;
};
type ApiAddressLookup = AddressLookupResult;
type ApiCard = {
  id: string;
  holder: string;
  brand: ApiCardBrand;
  last4: string;
  preferred: boolean;
};
type ApiCustomer = {
  id: string;
  code: string;
  fullName: string;
  cpf: string;
  gender: ApiGender;
  birthDate: string;
  phone: ApiPhone;
  email: string;
  status: ClientStatus;
  addresses: ApiAddress[];
  cards: ApiCard[];
};
type ApiCustomerSummary = Pick<
  ApiCustomer,
  "id" | "code" | "fullName" | "cpf" | "email" | "status"
>;
type ApiPage<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};
type ApiError = {
  message?: string;
  fieldErrors?: Array<{ field: string; message: string }>;
};
type LocalAccess = { email: string; password: string; customerId: string };

const roleToApi: Record<AddressRole, ApiAddressRole> = {
  Residência: "RESIDENCIA",
  Cobrança: "COBRANCA",
  Entrega: "ENTREGA",
};
const roleFromApi: Record<ApiAddressRole, AddressRole> = {
  RESIDENCIA: "Residência",
  COBRANCA: "Cobrança",
  ENTREGA: "Entrega",
};
const genderToApi: Record<string, ApiGender> = {
  Feminino: "FEMININO",
  Masculino: "MASCULINO",
  "Não binário": "NAO_BINARIO",
  "Prefiro não informar": "PREFIRO_NAO_INFORMAR",
};
const genderFromApi: Record<ApiGender, string> = {
  FEMININO: "Feminino",
  MASCULINO: "Masculino",
  NAO_BINARIO: "Não binário",
  PREFIRO_NAO_INFORMAR: "Prefiro não informar",
};
const phoneTypeToApi: Record<string, ApiPhoneType> = {
  Celular: "CELULAR",
  Residencial: "RESIDENCIAL",
  Comercial: "COMERCIAL",
};
const phoneTypeFromApi: Record<ApiPhoneType, string> = {
  CELULAR: "Celular",
  RESIDENCIAL: "Residencial",
  COMERCIAL: "Comercial",
};
const brandToApi: Record<string, ApiCardBrand> = {
  Visa: "VISA",
  Mastercard: "MASTERCARD",
  Elo: "ELO",
  "American Express": "AMERICAN_EXPRESS",
};
const brandFromApi: Record<ApiCardBrand, string> = {
  VISA: "Visa",
  MASTERCARD: "Mastercard",
  ELO: "Elo",
  AMERICAN_EXPRESS: "American Express",
};

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

function readLocalAccess(): LocalAccess[] {
  try {
    const value = localStorage.getItem(localAccessStorageKey);
    return value ? (JSON.parse(value) as LocalAccess[]) : [];
  } catch {
    return [];
  }
}

function saveLocalAccess(access: LocalAccess) {
  const remaining = readLocalAccess().filter(
    (item) =>
      item.customerId !== access.customerId &&
      normalize(item.email) !== normalize(access.email),
  );
  localStorage.setItem(
    localAccessStorageKey,
    JSON.stringify([...remaining, access]),
  );
}

function updateLocalPassword(customerId: string, password: string) {
  const entries = readLocalAccess().map((entry) =>
    entry.customerId === customerId ? { ...entry, password } : entry,
  );
  localStorage.setItem(localAccessStorageKey, JSON.stringify(entries));
}

function mapPhoneFromApi(phone: ApiPhone): ClientPhone {
  return {
    type: phoneTypeFromApi[phone.type],
    areaCode: phone.areaCode,
    number: phone.number,
  };
}

function mapAddressFromApi(address: ApiAddress): ClientAddress {
  return { ...address, roles: address.roles.map((role) => roleFromApi[role]) };
}

function mapCardFromApi(card: ApiCard): ClientCard {
  return { ...card, brand: brandFromApi[card.brand] };
}

function mapCustomerFromApi(customer: ApiCustomer): ClientDetails {
  return {
    id: customer.id,
    code: customer.code,
    fullName: customer.fullName,
    cpf: customer.cpf,
    email: customer.email,
    status: customer.status,
    gender: genderFromApi[customer.gender],
    birthDate: customer.birthDate,
    phone: mapPhoneFromApi(customer.phone),
    addresses: customer.addresses.map(mapAddressFromApi),
    cards: customer.cards.map(mapCardFromApi),
  };
}

function mapAddressToApi(address: ClientAddressInput) {
  return {
    ...address,
    label: address.label ?? "",
    roles: address.roles.map((role) => roleToApi[role]),
    state: address.state.trim().toUpperCase(),
  };
}

function mapPersonalDataToApi(input: ClientUpdateInput) {
  const gender = genderToApi[input.gender];
  const phoneType = phoneTypeToApi[input.phone.type];
  if (!gender || !phoneType)
    throw new CustomerGatewayError("Gênero ou tipo de telefone inválido.", 422);

  return {
    fullName: input.fullName,
    cpf: input.cpf,
    gender,
    birthDate: input.birthDate,
    phone: {
      type: phoneType,
      areaCode: input.phone.areaCode,
      number: input.phone.number,
    },
    email: input.email,
  };
}

function mapRegistrationToApi(input: ClientRegistrationInput) {
  return {
    ...mapPersonalDataToApi(input),
    password: input.password,
    confirmPassword: input.confirmPassword,
    addresses: input.addresses.map(mapAddressToApi),
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new CustomerGatewayError(
      "Não foi possível conectar à API da JoStore. Verifique se o backend está em execução.",
      503,
    );
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ApiError | null;
    const fieldMessage = error?.fieldErrors?.[0]?.message;
    throw new CustomerGatewayError(
      fieldMessage ??
        error?.message ??
        "Não foi possível concluir a operação solicitada.",
      response.status,
    );
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function createQuery(filter: ClientFilter, page: number, size: number) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  const supportedFilters = [
    "code",
    "fullName",
    "cpf",
    "email",
    "status",
  ] as const;
  supportedFilters.forEach((field) => {
    const value = filter[field];
    if (value) params.set(field, value);
  });
  return params.toString();
}

export const httpCustomerGateway: CustomerGateway = {
  async createClient(input) {
    const customer = await request<ApiCustomer>("/customers", {
      method: "POST",
      body: JSON.stringify(mapRegistrationToApi(input)),
    });
    const mappedCustomer = mapCustomerFromApi(customer);

    saveLocalAccess({
      email: input.email,
      password: input.password,
      customerId: mappedCustomer.id,
    });
    return mappedCustomer;
  },

  async authenticate(email, password) {
    let access = readLocalAccess().find(
      (entry) =>
        normalize(entry.email) === normalize(email) &&
        entry.password === password,
    );

    if (!access) {
      const legacyCustomer = await mockCustomerGateway.authenticate(
        email,
        password,
      );

      try {
        const createdCustomer = await request<ApiCustomer>("/customers", {
          method: "POST",
          body: JSON.stringify(
            mapRegistrationToApi({
              ...legacyCustomer,
              password,
              confirmPassword: password,
            }),
          ),
        });
        access = { email, password, customerId: createdCustomer.id };
        saveLocalAccess(access);
      } catch (error) {
        if (error instanceof CustomerGatewayError && error.status === 422) {
          // Ex.: a credencial de demonstração "123" não pode ser enviada ao
          // backend porque a política de senha é corretamente mais restritiva.
          // Ela continua válida apenas para navegar no protótipo.
          return legacyCustomer;
        }

        if (!(error instanceof CustomerGatewayError) || error.status !== 409) {
          throw error;
        }

        const page = await request<ApiPage<ApiCustomerSummary>>(
          `/customers?${createQuery({ email }, 0, 1)}`,
        );
        const existingCustomer = page.content[0];
        if (!existingCustomer) throw error;

        access = { email, password, customerId: existingCustomer.id };
        saveLocalAccess(access);
      }
    }

    const customer = mapCustomerFromApi(
      await request<ApiCustomer>(`/customers/${access.customerId}`),
    );
    if (customer.status === "INATIVO") {
      throw new CustomerGatewayError(
        "Este cliente está inativo. Entre em contato com o atendimento.",
        403,
      );
    }
    return customer;
  },

  async getClientById(id) {
    return mapCustomerFromApi(await request<ApiCustomer>(`/customers/${id}`));
  },

  async listClients({ filter = {}, page = 0, size = 10 } = {}) {
    const result = await request<ApiPage<ApiCustomerSummary>>(
      `/customers?${createQuery(filter, page, size)}`,
    );
    return {
      ...result,
      content: result.content,
    } satisfies PageResult<ClientSummary>;
  },

  async updateClient(id, input) {
    return mapCustomerFromApi(
      await request<ApiCustomer>(`/customers/${id}`, {
        method: "PUT",
        body: JSON.stringify(mapPersonalDataToApi(input)),
      }),
    );
  },

  async updatePassword(id, input: ClientPasswordUpdateInput) {
    await request<void>(`/customers/${id}/password`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    updateLocalPassword(id, input.password);
  },

  async inactivateClient(id) {
    return mapCustomerFromApi(
      await request<ApiCustomer>(`/customers/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "INATIVO" }),
      }),
    );
  },

  async reactivateClient(id) {
    return mapCustomerFromApi(
      await request<ApiCustomer>(`/customers/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ATIVO" }),
      }),
    );
  },

  async addAddress(clientId, input) {
    return mapCustomerFromApi(
      await request<ApiCustomer>(`/customers/${clientId}/addresses`, {
        method: "POST",
        body: JSON.stringify(mapAddressToApi(input)),
      }),
    );
  },

  async updateAddress(clientId, addressId, input) {
    return mapCustomerFromApi(
      await request<ApiCustomer>(
        `/customers/${clientId}/addresses/${addressId}`,
        {
          method: "PUT",
          body: JSON.stringify(mapAddressToApi(input)),
        },
      ),
    );
  },

  async lookupAddress(zipCode) {
    return request<ApiAddressLookup>(
      `/addresses/lookup/${zipCode.replace(/\D/g, "")}`,
    );
  },

  async removeAddress(clientId, addressId) {
    await request<void>(`/customers/${clientId}/addresses/${addressId}`, {
      method: "DELETE",
    });
    return this.getClientById(clientId);
  },

  async addCard(clientId, input: CardCreateInput) {
    const brand = brandToApi[input.brand];
    if (!brand)
      throw new CustomerGatewayError(
        "A bandeira informada não é permitida.",
        422,
      );
    return mapCustomerFromApi(
      await request<ApiCustomer>(`/customers/${clientId}/cards`, {
        method: "POST",
        body: JSON.stringify({ ...input, brand }),
      }),
    );
  },

  async updateCard(clientId, cardId, input: CardCreateInput) {
    const brand = brandToApi[input.brand];
    if (!brand)
      throw new CustomerGatewayError(
        "A bandeira informada não é permitida.",
        422,
      );
    return mapCustomerFromApi(
      await request<ApiCustomer>(`/customers/${clientId}/cards/${cardId}`, {
        method: "PUT",
        body: JSON.stringify({ ...input, brand }),
      }),
    );
  },

  async removeCard(clientId, cardId) {
    await request<void>(`/customers/${clientId}/cards/${cardId}`, {
      method: "DELETE",
    });
    return this.getClientById(clientId);
  },

  async setPreferredCard(clientId, cardId) {
    return mapCustomerFromApi(
      await request<ApiCustomer>(
        `/customers/${clientId}/cards/${cardId}/preferred`,
        {
          method: "PATCH",
        },
      ),
    );
  },
};
