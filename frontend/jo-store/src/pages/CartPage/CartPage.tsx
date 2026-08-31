import type { CartItem } from '../../types/store'
import './CartPage.css'

type CartPageProps = {
  cartItems: CartItem[]
  onBackToHome: () => void
  onOpenCoupons: () => void
  onUpdateItemQuantity: (itemId: number, nextQuantity: number) => void
  onRemoveItem: (itemId: number) => void
  subtotal: number
  shippingTotal: number
  couponDiscountTotal: number
  finalTotal: number
  selectedCouponsCount: number
  onProceedToCheckout: () => void
}

export function CartPage({
  cartItems,
  onBackToHome,
  onOpenCoupons,
  onUpdateItemQuantity,
  onRemoveItem,
  subtotal,
  shippingTotal,
  couponDiscountTotal,
  finalTotal,
  selectedCouponsCount,
  onProceedToCheckout,
}: CartPageProps) {
  return (
    <section className="cart-page" aria-labelledby="cart-page-title">
      <div className="cart-page-header">
        <div>
          <h1 id="cart-page-title" className="cart-page-title">
            Seu carrinho
          </h1>
          <p className="cart-page-subtitle">
            Revise os produtos adicionados antes de seguir para a compra.
          </p>
        </div>

        <button type="button" className="cart-page-back-button" onClick={onBackToHome}>
          Continuar comprando
        </button>
      </div>

      <div className="cart-layout">
        <div className="cart-items-panel">
          {cartItems.length > 0 ? (
            <div className="cart-items-list">
              {cartItems.map((item) => (
                <article key={item.id} className="cart-item-card">
                  <div className={`cart-item-media ${item.accent}`} aria-hidden="true">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="cart-item-image" />
                    ) : (
                      <div className="product-card-placeholder" />
                    )}
                  </div>

                    <div className="cart-item-copy">
                      <h2 className="cart-item-name">{item.name}</h2>
                      <p className="cart-item-unit">Tamanho: {item.size || 'M'}</p>
                      <div className="cart-item-controls">
                      <div className="cart-item-stepper">
                        <button type="button"
                          className="cart-item-stepper-button"
                          aria-label={`Diminuir quantidade de ${item.name}`}
                          onClick={() => onUpdateItemQuantity(item.id, item.quantity - 1)}
                        >-</button>
                        <span className="cart-item-stepper-value">{item.quantity}</span>
                        <button type="button"
                          className="cart-item-stepper-button"
                          aria-label={`Aumentar quantidade de ${item.name}`}
                          onClick={() => onUpdateItemQuantity(item.id, item.quantity + 1)}
                        >+</button>
                      </div>

                      <button type="button" className="cart-item-remove" onClick={() => onRemoveItem(item.id)}>Remover item</button>
                    </div>
                  </div>

                  <div className="cart-item-pricing">
                    <span className="cart-item-total">{item.totalPrice}</span>
                    <span className="cart-item-unit">{item.price} cada</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="cart-empty-state">
              <h2 className="cart-empty-title">Seu carrinho está vazio</h2>
              <p className="cart-empty-copy">
                Adicione alguns produtos da home para visualizar o resumo da sua compra aqui.
              </p>
              <button type="button" className="cart-page-back-button" onClick={onBackToHome}>
                Voltar para a home
              </button>
            </div>
          )}
        </div>

        <aside className="cart-summary-panel" aria-label="Resumo da compra">
          <h2 className="cart-summary-title">Resumo da compra</h2>

          <div className="cart-summary-rows">
            <div className="cart-summary-row">
              <span>Itens</span>
              <strong>{cartItems.reduce((total, item) => total + item.quantity, 0)}</strong>
            </div>
            <div className="cart-summary-row">
              <span>Subtotal</span>
              <strong>{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
            </div>
            <div className="cart-summary-row">
              <span>Frete</span>
              <strong>{shippingTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
            </div>
            <button type="button" className="cart-coupon-button" onClick={onOpenCoupons}>
              Cupons disponíveis {selectedCouponsCount > 0 ? `(${selectedCouponsCount} selecionado${selectedCouponsCount > 1 ? 's' : ''})` : ''}
            </button>
          </div>

          {couponDiscountTotal > 0 ? (
            <div className="cart-summary-discount">
              <span>Descontos</span>
              <strong>-{couponDiscountTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
            </div>
          ) : null}

          <div className="cart-summary-total">
            <span>Total</span>
            <strong>{finalTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
          </div>

          <button type="button" className="cart-checkout-button" onClick={onProceedToCheckout}>
            Finalizar compra
          </button>
        </aside>
      </div>
    </section>
  )
}
