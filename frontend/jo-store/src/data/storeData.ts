import carousel1 from "../assets/carousel1.jpg";
import type { Coupon, ProductCard, ProductSection } from "../types/store";

export const heroImage = carousel1;

export const accentClasses = [
  "product-accent-one",
  "product-accent-two",
  "product-accent-three",
  "product-accent-four",
  "product-accent-five",
  "product-accent-six",
] as const;

const fallbackProducts: ProductCard[] = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    name: "Jaqueta Urban Edge",
    description: "Jaqueta casual para compor looks urbanos.",
    price: "R$ 189,90",
    shipping: "Frete gratis",
    accent: "product-accent-one",
    image: "",
    images: [],
  },
  {
    id: "10000000-0000-0000-0000-000000000002",
    name: "Camisa Linen Flow",
    description: "Camisa leve com modelagem solta.",
    price: "R$ 129,90",
    shipping: "Frete a combinar",
    accent: "product-accent-two",
    image: "",
    images: [],
  },
  {
    id: "10000000-0000-0000-0000-000000000003",
    name: "Vestido Aura",
    description: "Vestido versatil para producoes simples.",
    price: "R$ 219,90",
    shipping: "Frete gratis",
    accent: "product-accent-three",
    image: "",
    images: [],
  },
  {
    id: "10000000-0000-0000-0000-000000000004",
    name: "Moletom Essential",
    description: "Moletom minimalista para uso diario.",
    price: "R$ 159,90",
    shipping: "Frete a combinar",
    accent: "product-accent-four",
    image: "",
    images: [],
  },
  {
    id: "10000000-0000-0000-0000-000000000005",
    name: "Calca Daily Fit",
    description: "Calca de uso diario com visual limpo.",
    price: "R$ 149,90",
    shipping: "Frete gratis",
    accent: "product-accent-five",
    image: "",
    images: [],
  },
  {
    id: "10000000-0000-0000-0000-000000000006",
    name: "Blazer Soft Line",
    description: "Blazer de acabamento suave.",
    price: "R$ 249,90",
    shipping: "Frete a combinar",
    accent: "product-accent-six",
    image: "",
    images: [],
  },
];

export const fallbackSections: ProductSection[] = [
  { id: "offers", title: "Ofertas do dia", products: fallbackProducts },
  { id: "best-sellers", title: "Mais vendidos", products: fallbackProducts },
  { id: "featured", title: "Destaque", products: fallbackProducts },
];

export const fashionCategoryGroups = {
  offers: ["womens-dresses", "tops", "mens-shirts"],
  bestSellers: ["mens-shirts", "tops", "mens-shoes", "womens-shoes"],
  featured: ["womens-dresses", "tops", "mens-shirts", "womens-shoes"],
} as const;

export const availableCoupons: Coupon[] = [
  {
    id: "30000000-0000-0000-0000-000000000001",
    code: "BEMVINDO10",
    title: "Boas-vindas",
    discountLabel: "10% OFF",
    description: "Valido para a primeira compra acima de R$ 150.",
    minimumSubtotal: 150,
    type: "PROMOCIONAL",
    amount: 10,
  },
  {
    id: "style-30",
    code: "JO30",
    title: "Seleção Fashion",
    discountLabel: "R$ 30 OFF",
    description: "Desconto fixo acima de R$ 300.",
    minimumSubtotal: 300,
    type: "TROCA",
    amount: 30,
  },
  {
    id: "vip-shipping",
    code: "FRETEGRATIS",
    title: "Envio Especial",
    discountLabel: "Frete gratis",
    description: "Frete gratis acima de R$ 220.",
    minimumSubtotal: 220,
    type: "TROCA",
    amount: 0,
  },
  {
    id: "tops-15",
    code: "STYLE15",
    title: "Estilo JoStore",
    discountLabel: "R$ 15 OFF",
    description: "Desconto fixo acima de R$ 180.",
    minimumSubtotal: 180,
    type: "TROCA",
    amount: 15,
  },
];

export const adminOrderStatusTransitions: Record<string, string[]> = {
  "EM ABERTO": ["EM PROCESSAMENTO"],
  "EM PROCESSAMENTO": ["PAGAMENTO REALIZADO"],
  "PAGAMENTO REALIZADO": ["EM TRANSITO"],
  "EM TRANSITO": ["ENTREGUE"],
  "TROCA SOLICITADA": ["TROCA ACEITA", "TROCA NEGADA"],
  "TROCA ACEITA": ["ITEM ENVIADO"],
  "ITEM RECEBIDO": ["TROCA PROCESSADA"],
};
