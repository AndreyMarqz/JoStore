import { Navigation, Pagination, A11y } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import type { ProductCard } from '../../types/store'
import './ProductModal.css'

type ProductModalProps = {
  product: ProductCard | null
  quantity: number
  onClose: () => void
  onQuantityChange: (value: number) => void
  onDecrease: () => void
  onIncrease: () => void
  onAddToCart: () => void
  onBuyNow: () => void
}

export function ProductModal({
  product,
  quantity,
  onClose,
  onQuantityChange,
  onDecrease,
  onIncrease,
  onAddToCart,
  onBuyNow,
}: ProductModalProps) {
  if (!product) {
    return null
  }

  return (
    <div
      className="product-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      onClick={onClose}
    >
      <div className="product-modal" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="product-modal-close"
          aria-label="Fechar detalhes do produto"
          onClick={onClose}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6 18 18" />
            <path d="M18 6 6 18" />
          </svg>
        </button>

        <div className="product-modal-gallery">
          <Swiper
            modules={[Navigation, Pagination, A11y]}
            className="product-modal-swiper"
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
          >
            {(product.images.length ? product.images : ['']).map((image, index) => (
              <SwiperSlide key={`${product.id}-${index}`}>
                <div className={`product-modal-media ${product.accent}`}>
                  {image ? (
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="product-modal-image"
                    />
                  ) : (
                    <div className="product-card-placeholder" />
                  )}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        <div className="product-modal-content">
          <div className="product-modal-copy">
            <h2 id="product-modal-title" className="product-modal-title">
              {product.name}
            </h2>
            <p className="product-modal-description">{product.description}</p>
          </div>

          <p className="product-modal-price">{product.price}</p>
          <p className="product-modal-shipping">{product.shipping}</p>

          <div className="product-modal-quantity">
            <label htmlFor="product-quantity" className="product-modal-quantity-label">
              Selecionar quantidade
            </label>
            <div className="product-modal-stepper">
              <button
                type="button"
                className="product-modal-stepper-button"
                aria-label="Diminuir quantidade"
                onClick={onDecrease}
              >
                -
              </button>
              <input
                id="product-quantity"
                className="product-modal-quantity-input"
                type="number"
                min="1"
                value={quantity}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  onQuantityChange(Number.isNaN(value) || value < 1 ? 1 : value)
                }}
              />
              <button
                type="button"
                className="product-modal-stepper-button"
                aria-label="Aumentar quantidade"
                onClick={onIncrease}
              >
                +
              </button>
            </div>
          </div>

          <div className="product-modal-actions">
            <button
              type="button"
              className="product-modal-action product-modal-action-secondary"
              onClick={onAddToCart}
            >
              Adicionar ao carrinho
            </button>
            <button
              type="button"
              className="product-modal-action product-modal-action-primary"
              onClick={onBuyNow}
            >
              Comprar agora
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
