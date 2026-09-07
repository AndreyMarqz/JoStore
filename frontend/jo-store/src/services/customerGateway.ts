import type {
  AddressRole,
  CardCreateInput,
  ClientAddressInput,
  ClientCard,
  ClientDetails,
  ClientFilter,
  ClientPasswordUpdateInput,
  ClientRegistrationInput,
  ClientSummary,
  ClientUpdateInput,
  PageResult,
} from '../types/store'

type ListClientsOptions = {
  filter?: ClientFilter
  page?: number
  size?: number
}

export class CustomerGatewayError extends Error {
  public readonly status: number

  constructor(
    message: string,
    status: number,
  ) {
    super(message)
    this.status = status
    this.name = 'CustomerGatewayError'
  }
}

export interface CustomerGateway {
  createClient(input: ClientRegistrationInput): Promise<ClientDetails>
  authenticate(email: string, password: string): Promise<ClientDetails>
  getClientById(id: string): Promise<ClientDetails>
  listClients(options?: ListClientsOptions): Promise<PageResult<ClientSummary>>
  updateClient(id: string, input: ClientUpdateInput): Promise<ClientDetails>
  updatePassword(id: string, input: ClientPasswordUpdateInput): Promise<void>
  inactivateClient(id: string): Promise<ClientDetails>
  reactivateClient(id: string): Promise<ClientDetails>
  addAddress(clientId: string, input: ClientAddressInput): Promise<ClientDetails>
  updateAddress(clientId: string, addressId: string, input: ClientAddressInput): Promise<ClientDetails>
  removeAddress(clientId: string, addressId: string): Promise<ClientDetails>
  addCard(clientId: string, input: CardCreateInput): Promise<ClientDetails>
  removeCard(clientId: string, cardId: string): Promise<ClientDetails>
  setPreferredCard(clientId: string, cardId: string): Promise<ClientDetails>
}

const customerStorageKey = 'jostore.customers.v1'

type PersistedCustomers = {
  clients: ClientDetails[]
  passwordHashes: Record<string, string>
  nextClientCode: number
}

function readPersistedCustomers(): PersistedCustomers {
  try {
    const stored = localStorage.getItem(customerStorageKey)
    if (stored) return JSON.parse(stored) as PersistedCustomers
  } catch {
    // A aplicação continua com uma base vazia se o armazenamento local estiver inválido.
  }

  return { clients: [], passwordHashes: {}, nextClientCode: 1 }
}

const persistedCustomers = readPersistedCustomers()
const clients: ClientDetails[] = persistedCustomers.clients
const passwordHashes = new Map<string, string>(Object.entries(persistedCustomers.passwordHashes))
const requiredAddressRoles: AddressRole[] = ['Residência', 'Cobrança', 'Entrega']
const allowedCardBrands = ['Visa', 'Mastercard', 'Elo', 'American Express']
let nextClientCode = persistedCustomers.nextClientCode

function persistCustomers() {
  localStorage.setItem(customerStorageKey, JSON.stringify({
    clients,
    passwordHashes: Object.fromEntries(passwordHashes),
    nextClientCode,
  } satisfies PersistedCustomers))
}

function cloneClient(client: ClientDetails): ClientDetails {
  return structuredClone(client)
}

function normalize(value: string | undefined) {
  return value?.trim().toLocaleLowerCase('pt-BR') ?? ''
}

function includesFilter(value: string, filter: string | undefined) {
  const normalizedFilter = normalize(filter)
  return !normalizedFilter || normalize(value).includes(normalizedFilter)
}

function getClientOrFail(id: string) {
  const client = clients.find((item) => item.id === id)

  if (!client) {
    throw new CustomerGatewayError('Cliente não encontrado.', 404)
  }

  return client
}

async function hashPassword(password: string) {
  const data = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function validateStrongPassword(password: string) {
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) {
    throw new CustomerGatewayError('A senha deve ter ao menos 8 caracteres, letra maiúscula, minúscula e caractere especial.', 422)
  }
}

function validateAddress(input: ClientAddressInput) {
  const requiredFields = [
    input.residenceType,
    input.streetType,
    input.street,
    input.number,
    input.neighborhood,
    input.zipCode,
    input.city,
    input.state,
    input.country,
  ]

  if (requiredFields.some((field) => !field.trim())) {
    throw new CustomerGatewayError('Preencha todos os campos obrigatórios do endereço.', 422)
  }

  if (input.roles.includes('Entrega') && !input.label?.trim()) {
    throw new CustomerGatewayError('Todo endereço de entrega precisa ter um nome curto.', 422)
  }
}

function validateAddressRoles(addresses: ClientDetails['addresses']) {
  const valid = requiredAddressRoles.every((role) =>
    addresses.some((address) => address.roles.includes(role)),
  )

  if (!valid) {
    throw new CustomerGatewayError(
      'O cliente precisa manter ao menos um endereço residencial, de cobrança e de entrega.',
      422,
    )
  }
}

function toSummary(client: ClientDetails): ClientSummary {
  return {
    id: client.id,
    code: client.code,
    fullName: client.fullName,
    cpf: client.cpf,
    email: client.email,
    status: client.status,
    ranking: client.ranking,
  }
}

function matchesAddressFilter(client: ClientDetails, filter: ClientFilter) {
  const hasAddressFilter = Boolean(
    filter.residenceType || filter.streetType || filter.street || filter.number ||
    filter.neighborhood || filter.city || filter.state || filter.country || filter.zipCode,
  )

  return !hasAddressFilter || client.addresses.some((address) =>
    includesFilter(address.residenceType, filter.residenceType) &&
    includesFilter(address.streetType, filter.streetType) &&
    includesFilter(address.street, filter.street) &&
    includesFilter(address.number, filter.number) &&
    includesFilter(address.neighborhood, filter.neighborhood) &&
    includesFilter(address.city, filter.city) &&
    includesFilter(address.state, filter.state) &&
    includesFilter(address.country, filter.country) &&
    includesFilter(address.zipCode, filter.zipCode),
  )
}

function matchesFilter(client: ClientDetails, filter: ClientFilter) {
  return (
    includesFilter(client.code, filter.code) &&
    includesFilter(client.fullName, filter.fullName) &&
    includesFilter(client.cpf, filter.cpf) &&
    includesFilter(client.email, filter.email) &&
    includesFilter(client.gender, filter.gender) &&
    includesFilter(client.birthDate, filter.birthDate) &&
    includesFilter(client.phone.type, filter.phoneType) &&
    includesFilter(client.phone.areaCode, filter.phoneAreaCode) &&
    includesFilter(client.phone.number, filter.phoneNumber) &&
    (!filter.status || client.status === filter.status) &&
    matchesAddressFilter(client, filter)
  )
}

export const mockCustomerGateway: CustomerGateway = {
  async createClient(input) {
    if (clients.some((client) => client.cpf === input.cpf)) {
      throw new CustomerGatewayError('Já existe um cliente cadastrado com este CPF.', 409)
    }

    if (clients.some((client) => normalize(client.email) === normalize(input.email))) {
      throw new CustomerGatewayError('Já existe um cliente cadastrado com este e-mail.', 409)
    }

    validateStrongPassword(input.password)
    if (input.password !== input.confirmPassword) {
      throw new CustomerGatewayError('Os campos de senha e confirmação devem ser iguais.', 422)
    }

    input.addresses.forEach(validateAddress)
    const addresses = input.addresses.map((address) => ({ ...address, id: crypto.randomUUID() }))
    validateAddressRoles(addresses)

    const client: ClientDetails = {
      id: crypto.randomUUID(),
      code: `CLI-${String(nextClientCode).padStart(6, '0')}`,
      fullName: input.fullName,
      cpf: input.cpf,
      email: input.email,
      gender: input.gender,
      birthDate: input.birthDate,
      phone: { ...input.phone },
      status: 'ATIVO',
      ranking: 0,
      addresses,
      cards: [],
    }

    nextClientCode += 1
    clients.unshift(client)
    passwordHashes.set(client.id, await hashPassword(input.password))
    persistCustomers()
    return cloneClient(client)
  },

  async authenticate(email, password) {
    const client = clients.find((item) => normalize(item.email) === normalize(email))

    if (!client || passwordHashes.get(client.id) !== await hashPassword(password)) {
      throw new CustomerGatewayError('E-mail ou senha inválidos.', 401)
    }

    if (client.status === 'INATIVO') {
      throw new CustomerGatewayError('Este cliente está inativo. Entre em contato com o atendimento.', 403)
    }

    return cloneClient(client)
  },

  async getClientById(id) {
    return cloneClient(getClientOrFail(id))
  },

  async listClients({ filter = {}, page = 0, size = 10 } = {}) {
    const filteredClients = clients.filter((client) => matchesFilter(client, filter))
    const start = page * size

    return {
      content: filteredClients.slice(start, start + size).map(toSummary),
      page,
      size,
      totalElements: filteredClients.length,
      totalPages: Math.max(1, Math.ceil(filteredClients.length / size)),
    }
  },

  async updateClient(id, input) {
    const client = getClientOrFail(id)

    if (clients.some((item) => item.id !== id && normalize(item.email) === normalize(input.email))) {
      throw new CustomerGatewayError('Já existe um cliente cadastrado com este e-mail.', 409)
    }

    if (clients.some((item) => item.id !== id && item.cpf === input.cpf)) {
      throw new CustomerGatewayError('Já existe um cliente cadastrado com este CPF.', 409)
    }

    Object.assign(client, {
      fullName: input.fullName,
      cpf: input.cpf,
      email: input.email,
      gender: input.gender,
      birthDate: input.birthDate,
      phone: { ...input.phone },
    })

    persistCustomers()

    return cloneClient(client)
  },

  async updatePassword(id, input) {
    getClientOrFail(id)
    const currentHash = await hashPassword(input.currentPassword)

    if (passwordHashes.get(id) !== currentHash) {
      throw new CustomerGatewayError('A senha atual informada está incorreta.', 422)
    }

    validateStrongPassword(input.password)
    if (input.password !== input.confirmPassword) {
      throw new CustomerGatewayError('Os campos de nova senha e confirmação devem ser iguais.', 422)
    }

    passwordHashes.set(id, await hashPassword(input.password))
    persistCustomers()
  },

  async inactivateClient(id) {
    const client = getClientOrFail(id)
    client.status = 'INATIVO'
    persistCustomers()
    return cloneClient(client)
  },

  async reactivateClient(id) {
    const client = getClientOrFail(id)
    client.status = 'ATIVO'
    persistCustomers()
    return cloneClient(client)
  },

  async addAddress(clientId, input) {
    validateAddress(input)
    const client = getClientOrFail(clientId)
    client.addresses.push({ ...input, id: crypto.randomUUID() })
    validateAddressRoles(client.addresses)
    persistCustomers()
    return cloneClient(client)
  },

  async updateAddress(clientId, addressId, input) {
    validateAddress(input)
    const client = getClientOrFail(clientId)
    const addressIndex = client.addresses.findIndex((address) => address.id === addressId)

    if (addressIndex < 0) {
      throw new CustomerGatewayError('Endereço não encontrado.', 404)
    }

    const updatedAddresses = client.addresses.map((address) =>
      address.id === addressId ? { ...input, id: addressId } : address,
    )
    validateAddressRoles(updatedAddresses)
    client.addresses = updatedAddresses
    persistCustomers()
    return cloneClient(client)
  },

  async removeAddress(clientId, addressId) {
    const client = getClientOrFail(clientId)
    const updatedAddresses = client.addresses.filter((address) => address.id !== addressId)

    if (updatedAddresses.length === client.addresses.length) {
      throw new CustomerGatewayError('Endereço não encontrado.', 404)
    }

    validateAddressRoles(updatedAddresses)
    client.addresses = updatedAddresses
    persistCustomers()
    return cloneClient(client)
  },

  async addCard(clientId, input) {
    const number = input.number.replace(/\D/g, '')

    if (!input.holder.trim()) {
      throw new CustomerGatewayError('Informe o nome do titular do cartão.', 422)
    }

    if (number.length < 13 || number.length > 19) {
      throw new CustomerGatewayError('Informe um número de cartão válido, com 13 a 19 dígitos.', 422)
    }

    if (!input.securityCode.trim()) {
      throw new CustomerGatewayError('Informe o CVV do cartão.', 422)
    }

    const brand = allowedCardBrands.find((item) => normalize(item) === normalize(input.brand))

    if (!brand) {
      throw new CustomerGatewayError('A bandeira informada não está cadastrada no sistema.', 422)
    }

    const client = getClientOrFail(clientId)
    const card: ClientCard = {
      id: crypto.randomUUID(),
      holder: input.holder.trim(),
      brand,
      last4: number.slice(-4),
      preferred: client.cards.length === 0,
    }

    client.cards.push(card)
    persistCustomers()
    return cloneClient(client)
  },

  async removeCard(clientId, cardId) {
    const client = getClientOrFail(clientId)
    const cardIndex = client.cards.findIndex((card) => card.id === cardId)

    if (cardIndex < 0) {
      throw new CustomerGatewayError('Cartão não encontrado.', 404)
    }

    const [removedCard] = client.cards.splice(cardIndex, 1)

    if (removedCard.preferred && client.cards.length > 0) {
      client.cards[0].preferred = true
    }

    persistCustomers()

    return cloneClient(client)
  },

  async setPreferredCard(clientId, cardId) {
    const client = getClientOrFail(clientId)

    if (!client.cards.some((card) => card.id === cardId)) {
      throw new CustomerGatewayError('Cartão não encontrado.', 404)
    }

    client.cards = client.cards.map((card) => ({ ...card, preferred: card.id === cardId }))
    persistCustomers()
    return cloneClient(client)
  },
}
