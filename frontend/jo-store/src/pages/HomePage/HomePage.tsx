import { heroImage } from '../../data/storeData'
import type { ProductCard, ProductSection } from '../../types/store'
import { ProductCarouselSection } from '../../components/ProductCarouselSection/ProductCarouselSection'
import './HomePage.css'

type HomePageProps = {
  productSections: ProductSection[]
  productsError: string
  onProductSelect: (product: ProductCard) => void
}

export function HomePage({ productSections, productsError, onProductSelect }: HomePageProps) {
  function scrollToCollection() {
    document.querySelector('.product-sections')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <section className="hero-carousel-section" aria-label="Destaque principal da loja">
        <div className="hero-slide slide-one">
          <img src={heroImage} alt="Coleção em destaque da JoStore" className="hero-slide-image" />
          <div className="hero-slide-content">
            <p className="hero-slide-eyebrow">JoStore apresenta</p>
            <h1>Nova coleção</h1>
            <p>Peças marcantes para uma temporada feita para ser vista.</p>
            <button type="button" className="hero-slide-action" onClick={scrollToCollection}>Ver coleção</button>
          </div>
        </div>
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
