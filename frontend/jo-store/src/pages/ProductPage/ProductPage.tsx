import { Navigation, Pagination, A11y } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import type { ProductCard } from '../../types/store'
import './ProductPage.css'

type Props = { product: ProductCard; quantity: number; selectedSize: string; onBack: () => void; onQuantityChange: (value: number) => void; onDecrease: () => void; onIncrease: () => void; onSelectSize: (size: string) => void; onAddToCart: () => void; onBuyNow: () => void }
const sizes = ['PP', 'P', 'M', 'G', 'GG']

export function ProductPage({ product, quantity, selectedSize, onBack, onQuantityChange, onDecrease, onIncrease, onSelectSize, onAddToCart, onBuyNow }: Props) {
  const images = product.images.length ? product.images : ['']
  return <section className="product-page" aria-labelledby="product-page-title">
    <button type="button" className="product-page-back" onClick={onBack}>← Voltar para produtos</button>
    <div className="product-page-layout">
      <div className="product-page-gallery"><Swiper modules={[Navigation, Pagination, A11y]} className="product-page-swiper" slidesPerView={1} navigation pagination={{ clickable: true }}>
        {images.map((image, index) => <SwiperSlide key={`${product.id}-${index}`}><div className={`product-page-media ${product.accent}`}>{image ? <img src={image} alt={`${product.name} ${index + 1}`} className="product-page-image" /> : <div className="product-card-placeholder" />}</div></SwiperSlide>)}
      </Swiper></div>
      <div className="product-page-details">
        <p className="product-page-label">Produto selecionado</p><h1 id="product-page-title">{product.name}</h1><p className="product-page-description">{product.description}</p><p className="product-page-price">{product.price}</p><p className="product-page-shipping">{product.shipping}</p>
        <fieldset className="product-page-sizes"><legend>Escolha o tamanho</legend><div className="product-page-size-options">{sizes.map((size) => <button key={size} type="button" className={`product-page-size${selectedSize === size ? ' is-selected' : ''}`} onClick={() => onSelectSize(size)} aria-pressed={selectedSize === size}>{size}</button>)}</div><span>Guia de tamanhos disponível</span></fieldset>
        <div className="product-page-quantity"><label htmlFor="product-page-quantity">Quantidade</label><div className="product-page-stepper"><button type="button" aria-label="Diminuir quantidade" onClick={onDecrease}>−</button><input id="product-page-quantity" type="number" min="1" value={quantity} onChange={(event) => onQuantityChange(Math.max(1, Number(event.target.value) || 1))} /><button type="button" aria-label="Aumentar quantidade" onClick={onIncrease}>+</button></div></div>
        <div className="product-page-actions"><button type="button" className="product-page-action product-page-action-secondary" onClick={onAddToCart}>Adicionar ao carrinho</button><button type="button" className="product-page-action product-page-action-primary" onClick={onBuyNow}>Comprar agora</button></div><p className="product-page-assurance">Compra segura · Troca facilitada · Entrega acompanhada</p>
      </div>
    </div>
  </section>
}
