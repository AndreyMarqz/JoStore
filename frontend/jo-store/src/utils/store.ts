import type { DummyProduct, ProductCard, ProductSection, UserProfile } from '../types/store'

export function formatPrice(value: number) {
  return (value * 5.2).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function parseFormattedPrice(price: string) {
  return Number(price.replace(/[^\d,]/g, '').replace(',', '.'))
}

export function formatCardExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)

  if (digits.length <= 2) {
    return digits
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

export function normalizeOrderStatus(status: string) {
  return status.trim().toUpperCase()
}

export function formatProfilePhone(profile: UserProfile) {
  return `${profile.phoneType} • (${profile.phoneAreaCode}) ${profile.phoneNumber}`
}

export function getMaskedPassword(password: string) {
  return password ? '•'.repeat(Math.max(8, password.length)) : ''
}

export function mapProduct(product: DummyProduct, index: number, accentClasses: readonly string[]): ProductCard {
  const shipping = product.price >= 50 || product.rating >= 4.5
    ? 'Frete grátis'
    : 'Frete a combinar'

  return {
    id: product.id,
    name: product.title,
    description: product.description ?? 'Peça selecionada para compor a vitrine principal da JoStore.',
    price: formatPrice(product.price),
    shipping,
    accent: accentClasses[index % accentClasses.length],
    image: product.thumbnail ?? product.images?.[0] ?? '',
    images: product.images?.length ? product.images : product.thumbnail ? [product.thumbnail] : [],
  }
}

export function buildProductSections(
  products: DummyProduct[],
  fashionCategoryGroups: Record<string, readonly string[]>,
  accentClasses: readonly string[],
): ProductSection[] {
  const uniqueProducts = Array.from(
    new Map(products.map((product) => [product.id, product])).values(),
  )

  const fromCategories = (categories: readonly string[]) =>
    uniqueProducts.filter((product) => product.category && categories.includes(product.category))

  const offersBase = fromCategories(fashionCategoryGroups.offers)
  const bestSellersBase = fromCategories(fashionCategoryGroups.bestSellers)
  const featuredBase = fromCategories(fashionCategoryGroups.featured)

  const toCard = (product: DummyProduct, index: number) => mapProduct(product, index, accentClasses)

  const offers = [...offersBase]
    .sort((a, b) => b.discountPercentage - a.discountPercentage)
    .slice(0, 8)
    .map(toCard)

  const bestSellers = [...bestSellersBase]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8)
    .map(toCard)

  const featured = featuredBase
    .slice(0, 8)
    .map(toCard)

  return [
    { id: 'offers', title: 'Ofertas do dia', products: offers },
    { id: 'best-sellers', title: 'Mais vendidos', products: bestSellers },
    { id: 'featured', title: 'Destaque', products: featured },
  ]
}
