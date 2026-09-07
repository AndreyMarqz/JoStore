export type DummyProduct = {
  id: number
  title: string
  description?: string
  price: number
  rating: number
  discountPercentage: number
  category?: string
  thumbnail?: string
  images?: string[]
  availabilityStatus?: string
}

export type ProductCard = {
  id: number
  name: string
  category?: string
  description: string
  price: string
  shipping: string
  accent: string
  image: string
  images: string[]
}

export type ProductSection = {
  id: string
  title: string
  products: ProductCard[]
}

export type CartItem = ProductCard & {
  quantity: number
  size: string
  unitPriceValue: number
  totalPriceValue: number
  totalPrice: string
}

export type ToastState = {
  variant: 'success' | 'error'
  title: string
  message: string
} | null

export type ViewMode = 'home' | 'product' | 'cart' | 'checkout' | 'profile' | 'admin'

export type AdminSection = 'clients' | 'orders' | 'analytics'

export type Coupon = {
  id: string
  code: string
  title: string
  discountLabel: string
  description: string
  minimumSubtotal: number
  type: 'percentage' | 'fixed' | 'shipping'
  amount: number
}

export type Order = {
  id: string
  number: string
  createdAt: string
  status: string
  items: CartItem[]
  paymentCards: ClientCard[]
  address: ClientAddress
  subtotal: number
  shippingTotal: number
  discountTotal: number
  total: number
}

export type ClientStatus = 'ATIVO' | 'INATIVO'

export type AddressRole = 'Residência' | 'Cobrança' | 'Entrega'

export type ClientPhone = {
  type: string
  areaCode: string
  number: string
}

export type ClientPersonalInfo = {
  gender: string
  fullName: string
  birthDate: string
  cpf: string
  email: string
  phone: ClientPhone
}

export type ClientAddressInput = {
  label?: string
  roles: AddressRole[]
  residenceType: string
  streetType: string
  street: string
  number: string
  neighborhood: string
  zipCode: string
  city: string
  state: string
  country: string
  notes?: string
}

export type ClientAddress = ClientAddressInput & {
  id: string
}

export type ClientCard = {
  id: string
  holder: string
  brand: string
  last4: string
  preferred: boolean
}

export type CardCreateInput = {
  holder: string
  number: string
  brand: string
  securityCode: string
}

export type ClientSummary = {
  id: string
  code: string
  fullName: string
  cpf: string
  email: string
  status: ClientStatus
  ranking: number
}

export type ClientDetails = ClientSummary & ClientPersonalInfo & {
  addresses: ClientAddress[]
  cards: ClientCard[]
}

export type ClientRegistrationInput = ClientPersonalInfo & {
  password: string
  confirmPassword: string
  addresses: ClientAddressInput[]
}

export type ClientUpdateInput = ClientPersonalInfo

export type ClientPasswordUpdateInput = {
  currentPassword: string
  password: string
  confirmPassword: string
}

export type ClientTransaction = {
  id: string
  reference: string
  occurredAt: string
  status: string
  amount: number
}

export type ClientFilter = {
  code?: string
  fullName?: string
  cpf?: string
  email?: string
  gender?: string
  birthDate?: string
  phoneType?: string
  phoneAreaCode?: string
  phoneNumber?: string
  status?: ClientStatus
  city?: string
  state?: string
  country?: string
  zipCode?: string
  residenceType?: string
  streetType?: string
  street?: string
  number?: string
  neighborhood?: string
}

export type PageResult<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
