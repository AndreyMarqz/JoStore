import carousel1 from '../assets/carousel-1.jpg'
import carousel2 from '../assets/carousel-2.jpg'
import carousel3 from '../assets/carousel-3.jpg'
import type {
  Address,
  Coupon,
  PaymentCard,
  ProductCard,
  ProductSection,
  UserProfile,
} from '../types/store'

export const heroSlides = [
  { id: 1, image: carousel1, accent: 'slide-one' },
  { id: 2, image: carousel2, accent: 'slide-two' },
  { id: 3, image: carousel3, accent: 'slide-three' },
]

export const accentClasses = [
  'product-accent-one',
  'product-accent-two',
  'product-accent-three',
  'product-accent-four',
  'product-accent-five',
  'product-accent-six',
] as const

export const emptyUserProfile: UserProfile = {
  gender: '',
  fullName: '',
  birthDate: '',
  cpf: '',
  phoneType: '',
  phoneAreaCode: '',
  phoneNumber: '',
  email: '',
  password: '',
  residenceType: '',
  streetType: '',
  street: '',
  number: '',
  neighborhood: '',
  zipCode: '',
  city: '',
  state: '',
  country: '',
  addressNotes: '',
  status: 'Ativo',
}

export const fallbackProducts: ProductCard[] = [
  { id: 1, name: 'Jaqueta Urban Edge', description: 'Jaqueta casual com corte moderno para compor looks urbanos no dia a dia.', price: 'R$ 189,90', shipping: 'Frete grátis', accent: 'product-accent-one', image: '', images: [] },
  { id: 2, name: 'Camisa Linen Flow', description: 'Camisa leve com toque macio e modelagem solta para momentos mais frescos.', price: 'R$ 129,90', shipping: 'Frete a combinar', accent: 'product-accent-two', image: '', images: [] },
  { id: 3, name: 'Vestido Aura', description: 'Vestido versátil com caimento elegante para produções simples e sofisticadas.', price: 'R$ 219,90', shipping: 'Frete grátis', accent: 'product-accent-three', image: '', images: [] },
  { id: 4, name: 'Moletom Essential', description: 'Moletom minimalista com shape confortável para combinar com diferentes estilos.', price: 'R$ 159,90', shipping: 'Frete a combinar', accent: 'product-accent-four', image: '', images: [] },
  { id: 5, name: 'Calça Daily Fit', description: 'Calça de uso diário com visual limpo e ajuste pensado para conforto prolongado.', price: 'R$ 149,90', shipping: 'Frete grátis', accent: 'product-accent-five', image: '', images: [] },
  { id: 6, name: 'Blazer Soft Line', description: 'Blazer de acabamento suave para elevar o visual mantendo a proposta contemporânea.', price: 'R$ 249,90', shipping: 'Frete a combinar', accent: 'product-accent-six', image: '', images: [] },
]

export const fallbackSections: ProductSection[] = [
  { id: 'offers', title: 'Ofertas do dia', products: fallbackProducts },
  { id: 'best-sellers', title: 'Mais vendidos', products: fallbackProducts },
  { id: 'featured', title: 'Destaque', products: fallbackProducts },
]

export const fashionCategoryGroups = {
  offers: ['womens-dresses', 'tops', 'mens-shirts'],
  bestSellers: ['mens-shirts', 'tops', 'mens-shoes', 'womens-shoes'],
  featured: ['womens-dresses', 'tops', 'mens-shirts', 'womens-shoes'],
} as const

export const availableCoupons: Coupon[] = [
  {
    id: 'welcome-10',
    code: 'BEMVINDO10',
    title: 'Boas-vindas',
    discountLabel: '10% OFF',
    description: 'Válido para primeira compra em pedidos acima de R$ 150,00.',
    minimumSubtotal: 150,
    type: 'percentage',
    amount: 10,
  },
  {
    id: 'fashion-30',
    code: 'JO30',
    title: 'Seleção Fashion',
    discountLabel: 'R$ 30 OFF',
    description: 'Desconto fixo em compras acima de R$ 300,00.',
    minimumSubtotal: 300,
    type: 'fixed',
    amount: 30,
  },
  {
    id: 'vip-frete',
    code: 'FRETEGRATIS',
    title: 'Envio Especial',
    discountLabel: 'Frete grátis',
    description: 'Libera frete grátis em pedidos acima de R$ 220,00.',
    minimumSubtotal: 220,
    type: 'shipping',
    amount: 0,
  },
  {
    id: 'tops-15',
    code: 'STYLE15',
    title: 'Estilo JoStore',
    discountLabel: '15% OFF',
    description: 'Ideal para renovar o look com desconto percentual acima de R$ 260,00.',
    minimumSubtotal: 260,
    type: 'percentage',
    amount: 15,
  },
  {
    id: 'extra-50',
    code: 'JO50',
    title: 'Compra Premium',
    discountLabel: 'R$ 50 OFF',
    description: 'Economia extra em pedidos mais robustos a partir de R$ 420,00.',
    minimumSubtotal: 420,
    type: 'fixed',
    amount: 50,
  },
  {
    id: 'flash-20',
    code: 'FLASH20',
    title: 'Flash Sale',
    discountLabel: '20% OFF',
    description: 'Cupom relâmpago para compras acima de R$ 500,00.',
    minimumSubtotal: 500,
    type: 'percentage',
    amount: 20,
  },
  {
    id: 'mini-15',
    code: 'LOOK15',
    title: 'Look do Dia',
    discountLabel: 'R$ 15 OFF',
    description: 'Desconto leve para compras a partir de R$ 180,00.',
    minimumSubtotal: 180,
    type: 'fixed',
    amount: 15,
  },
]

export const initialPaymentCards: PaymentCard[] = [
  { id: 'card-1', holder: 'Andrey Marques', brand: 'Visa', last4: '1842', expiry: '08/29' },
  { id: 'card-2', holder: 'Andrey Marques', brand: 'Mastercard', last4: '9921', expiry: '11/30' },
]

export const initialAddresses: Address[] = [
  {
    id: 'address-1',
    label: 'Casa',
    recipient: 'Andrey Marques',
    residenceType: 'Casa',
    streetType: 'Rua',
    street: 'das Acácias',
    number: '120',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brasil',
    zipCode: '01310-100',
    notes: 'Portão cinza na frente.',
  },
  {
    id: 'address-2',
    label: 'Trabalho',
    recipient: 'Andrey Marques',
    residenceType: 'Comercial',
    streetType: 'Avenida',
    street: 'Paulista',
    number: '1500',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brasil',
    zipCode: '01311-200',
    notes: '',
  },
]

export const customerCancelableStatuses = ['EM ABERTO', 'EM PROCESSAMENTO'] as const
export const exchangeRequestStatuses = ['PEDIDO RECEBIDO'] as const

export const adminOrderStatusTransitions: Record<string, string[]> = {
  'EM ABERTO': ['EM PROCESSAMENTO'],
  'EM PROCESSAMENTO': ['PAGAMENTO REALIZADO'],
  'PAGAMENTO REALIZADO': ['EM TRÂNSITO'],
  'EM TRÂNSITO': ['ENTREGUE'],
  'TROCA SOLICITADA': ['TROCA ACEITA', 'TROCA NEGADA'],
  'TROCA ACEITA': ['ITEM ENVIADO'],
  'ITEM RECEBIDO': ['TROCA PROCESSADA'],
}
