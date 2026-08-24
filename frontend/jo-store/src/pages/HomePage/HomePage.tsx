import { Navigation, Pagination, EffectFade, A11y, Autoplay } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { heroSlides } from '../../data/storeData'
import type { ProductCard, ProductSection } from '../../types/store'
import { ProductCarouselSection } from '../../components/ProductCarouselSection/ProductCarouselSection'
import './HomePage.css'

type HomePageProps = {
  productSections: ProductSection[]
  productsError: string
  onProductSelect: (product: ProductCard) => void
}

export function HomePage({ productSections, productsError, onProductSelect }: HomePageProps) {
  return (
    <>
      <section className="hero-carousel-section" aria-label="Carrossel principal da loja">
        <Swiper
          modules={[Navigation, Pagination, EffectFade, A11y, Autoplay]}
          className="hero-swiper"
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          effect="fade"
          loop
          autoplay={{ delay: 5000, disableOnInteraction: false }}
        >
          {heroSlides.map((slide) => (
            <SwiperSlide key={slide.id}>
              <div className={`hero-slide ${slide.accent}`}>
                {slide.image ? (
                  <img src={slide.image} alt="" className="hero-slide-image" />
                ) : (
                  <div className="hero-slide-placeholder" aria-hidden="true" />
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      <div className="product-sections">
        {productsError ? <p className="product-sections-notice">{productsError}</p> : null}
        {productSections.map((section) => (
          <ProductCarouselSection
            key={section.id}
            sectionId={section.id}
            title={section.title}
            products={section.products}
            onProductSelect={onProductSelect}
          />
        ))}
      </div>
    </>
  )
}
