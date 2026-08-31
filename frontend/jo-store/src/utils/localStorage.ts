import type { Address, CartItem, Order, PaymentCard, UserProfile } from '../types/store'

const STORAGE_KEY = 'jostore:store-session:v1'

export type StoredStoreSession = {
  cartItems: CartItem[]
  selectedCouponIds: string[]
  paymentCards: PaymentCard[]
  addresses: Address[]
  selectedPaymentCardIds: string[]
  selectedAddressId: string
  orders: Order[]
  cartAdditions: number
  userProfile: UserProfile
  isProfileRegistered: boolean
}

let cachedSession: Partial<StoredStoreSession> | null | undefined

export function loadStoreSession(): Partial<StoredStoreSession> | null {
  if (cachedSession !== undefined) {
    return cachedSession
  }

  try {
    const savedValue = window.localStorage.getItem(STORAGE_KEY)
    cachedSession = savedValue ? (JSON.parse(savedValue) as Partial<StoredStoreSession>) : null
  } catch {
    cachedSession = null
  }

  return cachedSession
}

export function saveStoreSession(session: StoredStoreSession) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    cachedSession = session
  } catch {}
}
