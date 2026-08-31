import { Navigation, Pagination, A11y } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import type { ProductCard } from '../../types/store'
import './ProductModal.css'

type ProductModalProps = {
  product: ProductCard | null
  onClose: () => void
  onViewProduct: () => void
}

export function ProductModal({
  product,
  onClose,
  onViewProduct,
}: ProductModalProps) {
  if (!product) return null

  return (
    <div className="product-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="product-modal-title" onClick={onClose}>
      <div className="product-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button"
          className="product-modal-close"
          aria-label="Fechar detalhes do produto"
          onClick={onClose}
        ><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6 18 18" /><path d="M18 6 6 18" /></svg></button>

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

          <div className="product-modal-actions">
            <button type="button"
              className="product-modal-action product-modal-action-primary"
              onClick={onViewProduct}
            >
              Visualizar item
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
