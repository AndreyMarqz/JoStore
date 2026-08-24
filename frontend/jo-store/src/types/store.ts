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
  unitPriceValue: number
  totalPriceValue: number
  totalPrice: string
}

export type ToastState = {
  variant: 'success' | 'error'
  title: string
  message: string
} | null

export type ViewMode = 'home' | 'cart' | 'checkout' | 'profile' | 'admin'

export type ProfileSection = 'info' | 'edit-info' | 'orders'
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

export type PaymentCard = {
  id: string
  holder: string
  brand: string
  last4: string
  expiry: string
}

export type Address = {
  id: string
  label: string
  recipient: string
  residenceType: string
  streetType: string
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
  country: string
  zipCode: string
  notes: string
}

export type Order = {
  id: string
  number: string
  createdAt: string
  status: string
  items: CartItem[]
  paymentCards: PaymentCard[]
  address: Address
  subtotal: number
  shippingTotal: number
  discountTotal: number
  total: number
}

export type UserProfile = {
  gender: string
  fullName: string
  birthDate: string
  cpf: string
  phoneType: string
  phoneAreaCode: string
  phoneNumber: string
  email: string
  password: string
  residenceType: string
  streetType: string
  street: string
  number: string
  neighborhood: string
  zipCode: string
  city: string
  state: string
  country: string
  addressNotes: string
  status: 'Ativo' | 'Inativo'
}
