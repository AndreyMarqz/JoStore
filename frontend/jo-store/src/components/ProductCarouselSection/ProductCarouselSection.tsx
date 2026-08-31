import { Navigation, Pagination, A11y } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import type { ProductCard } from '../../types/store'
import './ProductCarouselSection.css'

type ProductCarouselSectionProps = {
  title: string
  sectionId: string
  products: ProductCard[]
  onProductSelect: (product: ProductCard) => void
}

export function ProductCarouselSection({
  title,
  sectionId,
  products,
  onProductSelect,
}: ProductCarouselSectionProps) {
  return (
    <section className="product-section" aria-labelledby={`${sectionId}-title`}>
      <div className="product-section-header">
        <h2 id={`${sectionId}-title`} className="product-section-title">
          {title}
        </h2>
      </div>

      <Swiper
        modules={[Navigation, Pagination, A11y]}
        className="product-swiper"
        slidesPerView={1.7}
        spaceBetween={12}
        navigation
        pagination={{ clickable: true }}
        breakpoints={{
          640: { slidesPerView: 2.5, spaceBetween: 20 },
          920: { slidesPerView: 3.2, spaceBetween: 24 },
          1200: { slidesPerView: 4.15, spaceBetween: 24 },
        }}
      >
        {products.map((product) => (
          <SwiperSlide key={product.id}>
            <button
              type="button"
              className="product-card"
              onClick={() => onProductSelect(product)}
              aria-label={`Abrir detalhes de ${product.name}`}
            >
              <div className={`product-card-media ${product.accent}`} aria-hidden="true">
                {product.image ? (
                  <img
                    className="product-card-image"
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                  />
                ) : (
                  <div className="product-card-placeholder" />
                )}
              </div>

              <div className="product-card-body">
                <h3 className="product-card-title">{product.name}</h3>
                <p className="product-card-price">{product.price}</p>
                <p className="product-card-shipping">{product.shipping}</p>
              </div>
            </button>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}
