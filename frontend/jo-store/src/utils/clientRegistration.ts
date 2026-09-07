import type {
  AddressRole,
  ClientAddressInput,
  ClientRegistrationInput,
} from '../types/store'

const requiredAddressRoles: AddressRole[] = [
  'Residência',
  'Cobrança',
  'Entrega',
]

function createInitialAddress(): ClientAddressInput {
  return {
    label: 'Residência principal',
    roles: [],
    residenceType: '',
    streetType: '',
    street: '',
    number: '',
    neighborhood: '',
    zipCode: '',
    city: '',
    state: '',
    country: '',
    notes: '',
  }
}

export function createEmptyClientRegistration(): ClientRegistrationInput {
  return {
    gender: '',
    fullName: '',
    birthDate: '',
    cpf: '',
    email: '',
    phone: {
      type: '',
      areaCode: '',
      number: '',
    },
    password: '',
    confirmPassword: '',
    addresses: [createInitialAddress()],
  }
}

export function validateClientRegistration(
  input: ClientRegistrationInput,
): string | null {
  if (!input.fullName.trim()) return 'Preencha o nome completo.'
  if (!input.gender.trim()) return 'Selecione o gênero.'
  if (!input.birthDate.trim()) return 'Preencha a data de nascimento.'
  if (!input.cpf.trim()) return 'Preencha o CPF.'
  if (!input.email.trim()) return 'Preencha o e-mail.'
  if (!input.phone.type.trim()) return 'Selecione o tipo de telefone.'
  if (!input.phone.areaCode.trim() || !input.phone.number.trim()) {
    return 'Preencha o DDD e o número de telefone.'
  }

  const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/

  if (!strongPassword.test(input.password)) {
    return 'A senha deve ter ao menos 8 caracteres, letra maiúscula, minúscula e caractere especial.'
  }

  if (input.password !== input.confirmPassword) {
    return 'Os campos de senha e confirmar senha devem ser iguais.'
  }

  if (input.addresses.length === 0) {
    return 'Cadastre ao menos um endereço.'
  }

  const hasAllRequiredRoles = requiredAddressRoles.every((role) =>
    input.addresses.some((address) => address.roles.includes(role)),
  )

  if (!hasAllRequiredRoles) {
    return 'O cliente precisa ter endereço residencial, de cobrança e de entrega.'
  }

  for (const address of input.addresses) {
    const hasMissingRequiredField =
      !address.residenceType.trim() ||
      !address.streetType.trim() ||
      !address.street.trim() ||
      !address.number.trim() ||
      !address.neighborhood.trim() ||
      !address.zipCode.trim() ||
      !address.city.trim() ||
      !address.state.trim() ||
      !address.country.trim()

    if (hasMissingRequiredField) {
      return 'Preencha todos os campos obrigatórios do endereço.'
    }

    if (address.roles.includes('Entrega') && !address.label?.trim()) {
      return 'Todo endereço de entrega precisa ter um nome curto.'
    }
  }

  return null
}
