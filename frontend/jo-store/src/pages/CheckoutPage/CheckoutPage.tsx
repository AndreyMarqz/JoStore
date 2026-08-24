import { useState, type FormEvent } from 'react'
import type { Address, CartItem, PaymentCard, ToastState } from '../../types/store'
import { formatCardExpiry } from '../../utils/store'
import './CheckoutPage.css'

type CheckoutPageProps = {
  cartItems: CartItem[]
  paymentCards: PaymentCard[]
  addresses: Address[]
  selectedPaymentCardIds: string[]
  selectedAddressId: string
  selectedCouponsCount: number
  subtotal: number
  shippingTotal: number
  couponDiscountTotal: number
  finalTotal: number
  onBackToCart: () => void
  onOpenCoupons: () => void
  onTogglePaymentCard: (cardId: string) => void
  onSelectAddress: (addressId: string) => void
  onAddPaymentCard: (card: Omit<PaymentCard, 'id'>) => void
  onAddAddress: (address: Omit<Address, 'id'>) => void
  onShowToast: (toast: Exclude<ToastState, null>) => void
  onConfirmPurchase: () => void
}

export function CheckoutPage({
  cartItems,
  paymentCards,
  addresses,
  selectedPaymentCardIds,
  selectedAddressId,
  selectedCouponsCount,
  subtotal,
  shippingTotal,
  couponDiscountTotal,
  finalTotal,
  onBackToCart,
  onOpenCoupons,
  onTogglePaymentCard,
  onSelectAddress,
  onAddPaymentCard,
  onAddAddress,
  onShowToast,
  onConfirmPurchase,
}: CheckoutPageProps) {
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [isAddingAddress, setIsAddingAddress] = useState(false)
  const [cardForm, setCardForm] = useState({
    number: '',
    holder: '',
    brand: '',
    cvv: '',
    expiry: '',
  })
  const [addressForm, setAddressForm] = useState({
    label: '',
    recipient: '',
    residenceType: '',
    streetType: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    notes: '',
  })

  const selectedCards = paymentCards.filter((card) => selectedPaymentCardIds.includes(card.id))
  const paymentAllocations = selectedCards.map((card, index) => {
    const baseShare = selectedCards.length ? finalTotal / selectedCards.length : 0
    const roundedShare = Number(baseShare.toFixed(2))
    const isLast = index === selectedCards.length - 1
    const previousTotal = roundedShare * index
    const adjustedShare = isLast ? Number((finalTotal - previousTotal).toFixed(2)) : roundedShare

    return {
      ...card,
      share: adjustedShare < 0 ? 0 : adjustedShare,
    }
  })

  function handleSubmitCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    const requiredCardFields = [
      { key: 'number', label: 'Número do cartão' },
      { key: 'holder', label: 'Nome impresso no cartão' },
      { key: 'brand', label: 'Bandeira do cartão' },
      { key: 'cvv', label: 'CVV' },
      { key: 'expiry', label: 'Data de validade' },
    ] as const

    const missingCardField = requiredCardFields.find(({ key }) => !cardForm[key].trim())

    if (missingCardField) {
      form.querySelector<HTMLInputElement>(`[name="${missingCardField.key}"]`)?.focus()
      onShowToast({
        variant: 'error',
        title: 'Cartão não salvo',
        message: `Preencha o campo "${missingCardField.label}".`,
      })
      return
    }

    const sanitizedNumber = cardForm.number.replace(/\D/g, '')

    if (sanitizedNumber.length < 13) {
      form.querySelector<HTMLInputElement>('[name="number"]')?.focus()
      onShowToast({
        variant: 'error',
        title: 'Cartão não salvo',
        message: 'Informe um número de cartão válido.',
      })
      return
    }

    onAddPaymentCard({
      holder: cardForm.holder,
      brand: cardForm.brand,
      last4: sanitizedNumber.slice(-4),
      expiry: cardForm.expiry,
    })

    setCardForm({ number: '', holder: '', brand: '', cvv: '', expiry: '' })
    setIsAddingCard(false)
    onShowToast({
      variant: 'success',
      title: 'Cartão salvo com sucesso',
      message: `${cardForm.brand} final ${sanitizedNumber.slice(-4)} foi adicionado aos meios de pagamento.`,
    })
  }

  function handleSubmitAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    const requiredAddressFields = [
      { key: 'label', label: 'Apelido do endereço' },
      { key: 'recipient', label: 'Destinatário' },
      { key: 'residenceType', label: 'Tipo de residência' },
      { key: 'streetType', label: 'Tipo de logradouro' },
      { key: 'street', label: 'Logradouro' },
      { key: 'number', label: 'Número' },
      { key: 'neighborhood', label: 'Bairro' },
      { key: 'city', label: 'Cidade' },
      { key: 'state', label: 'Estado' },
      { key: 'country', label: 'País' },
      { key: 'zipCode', label: 'CEP' },
    ] as const

    const missingAddressField = requiredAddressFields.find(({ key }) => !addressForm[key].trim())

    if (missingAddressField) {
      form.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${missingAddressField.key}"]`)?.focus()
      onShowToast({
        variant: 'error',
        title: 'Endereço não salvo',
        message: `Preencha o campo "${missingAddressField.label}".`,
      })
      return
    }

    onAddAddress(addressForm)
    setAddressForm({
      label: '',
      recipient: '',
      residenceType: '',
      streetType: '',
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
      notes: '',
    })
    setIsAddingAddress(false)
    onShowToast({
      variant: 'success',
      title: 'Endereço salvo com sucesso',
      message: `${addressForm.label} foi adicionado aos endereços de entrega.`,
    })
  }

  return (
    <section className="checkout-page" aria-labelledby="checkout-page-title">
      <div className="checkout-page-header">
        <div>
          <h1 id="checkout-page-title" className="checkout-page-title">
            Finalizar compra
          </h1>
          <p className="checkout-page-subtitle">
            Escolha pagamento, endereço e revise o pedido antes de concluir.
          </p>
        </div>

        <button type="button" className="cart-page-back-button" onClick={onBackToCart}>
          Voltar ao carrinho
        </button>
      </div>

      <div className="checkout-layout">
        <div className="checkout-main">
          <section className="checkout-panel">
            <div className="checkout-panel-header">
              <h2 className="checkout-panel-title">Resumo do pedido</h2>
              <span className="checkout-panel-meta">{cartItems.length} produto(s)</span>
            </div>

            <div className="checkout-order-list">
              {cartItems.map((item) => (
                <article key={item.id} className="checkout-order-item">
                  <div className={`checkout-order-media ${item.accent}`} aria-hidden="true">
                    {item.image ? <img src={item.image} alt={item.name} className="checkout-order-image" /> : <div className="product-card-placeholder" />}
                  </div>
                  <div className="checkout-order-copy">
                    <h3 className="checkout-order-name">{item.name}</h3>
                    <p className="checkout-order-detail">Quantidade: {item.quantity}</p>
                    <p className="checkout-order-detail">{item.shipping}</p>
                  </div>
                  <strong className="checkout-order-price">{item.totalPrice}</strong>
                </article>
              ))}
            </div>
          </section>

          <section className="checkout-panel">
            <div className="checkout-panel-header">
              <h2 className="checkout-panel-title">Cartões para pagamento</h2>
              <button type="button" className="checkout-link-button" onClick={() => setIsAddingCard((value) => !value)}>
                {isAddingCard ? 'Cancelar' : 'Adicionar novo cartão'}
              </button>
            </div>

            <div className="checkout-card-list">
              {paymentCards.map((card) => {
                const isSelected = selectedPaymentCardIds.includes(card.id)

                return (
                  <label key={card.id} className={`checkout-card-option${isSelected ? ' is-selected' : ''}`}>
                    <input type="checkbox" checked={isSelected} onChange={() => onTogglePaymentCard(card.id)} />
                    <div>
                      <strong>{card.brand} final {card.last4}</strong>
                      <p>{card.holder}</p>
                      <span>Validade {card.expiry}</span>
                    </div>
                  </label>
                )
              })}
            </div>

            {paymentAllocations.length > 0 ? (
              <div className="checkout-payment-split">
                <h3 className="checkout-subtitle">Combinação de pagamento</h3>
                {paymentAllocations.map((card) => (
                  <div key={card.id} className="checkout-split-row">
                    <span>{card.brand} final {card.last4}</span>
                    <strong>{card.share.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                  </div>
                ))}
              </div>
            ) : null}

            {isAddingCard ? (
              <form className="checkout-inline-form" onSubmit={handleSubmitCard}>
                <input
                  name="number"
                  type="text"
                  placeholder="Número do cartão"
                  value={cardForm.number}
                  onChange={(event) => setCardForm((current) => ({ ...current, number: event.target.value.replace(/[^\d\s]/g, '') }))}
                />
                <input
                  name="holder"
                  type="text"
                  placeholder="Nome impresso no cartão"
                  value={cardForm.holder}
                  onChange={(event) => setCardForm((current) => ({ ...current, holder: event.target.value }))}
                />
                <div className="checkout-inline-form-row">
                  <input
                    name="brand"
                    type="text"
                    placeholder="Bandeira do cartão"
                    value={cardForm.brand}
                    onChange={(event) => setCardForm((current) => ({ ...current, brand: event.target.value }))}
                  />
                  <input
                    name="cvv"
                    type="text"
                    placeholder="Código de segurança (CVV)"
                    maxLength={4}
                    value={cardForm.cvv}
                    onChange={(event) => setCardForm((current) => ({ ...current, cvv: event.target.value.replace(/\D/g, '') }))}
                  />
                </div>
                <div className="checkout-inline-form-row">
                  <input
                    name="expiry"
                    type="text"
                    placeholder="MM/AA"
                    value={cardForm.expiry}
                    onChange={(event) =>
                      setCardForm((current) => ({
                        ...current,
                        expiry: formatCardExpiry(event.target.value),
                      }))
                    }
                  />
                </div>
                <button type="submit" className="checkout-inline-submit">
                  Salvar cartão
                </button>
              </form>
            ) : null}
          </section>

          <section className="checkout-panel">
            <div className="checkout-panel-header">
              <h2 className="checkout-panel-title">Endereço de entrega</h2>
              <button type="button" className="checkout-link-button" onClick={() => setIsAddingAddress((value) => !value)}>
                {isAddingAddress ? 'Cancelar' : 'Adicionar novo endereço'}
              </button>
            </div>

            <div className="checkout-address-list">
              {addresses.map((address) => {
                const isSelected = selectedAddressId === address.id

                return (
                  <label key={address.id} className={`checkout-address-option${isSelected ? ' is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="delivery-address"
                      checked={isSelected}
                      onChange={() => onSelectAddress(address.id)}
                    />
                    <div>
                      <strong>{address.label}</strong>
                      <p>{address.recipient}</p>
                      <span>{address.residenceType}</span>
                      <span>{address.streetType} {address.street}, {address.number}</span>
                      <span>{address.neighborhood}</span>
                      <span>{address.city} - {address.state}</span>
                      <span>{address.country}</span>
                      <span>{address.zipCode}</span>
                      {address.notes ? <span>{address.notes}</span> : null}
                    </div>
                  </label>
                )
              })}
            </div>

            {isAddingAddress ? (
              <form className="checkout-inline-form" onSubmit={handleSubmitAddress}>
                <div className="checkout-inline-form-row">
                  <input
                    name="label"
                    type="text"
                    placeholder="Apelido do endereço"
                    value={addressForm.label}
                    onChange={(event) => setAddressForm((current) => ({ ...current, label: event.target.value }))}
                  />
                  <input
                    name="recipient"
                    type="text"
                    placeholder="Destinatário"
                    value={addressForm.recipient}
                    onChange={(event) => setAddressForm((current) => ({ ...current, recipient: event.target.value }))}
                  />
                </div>
                <div className="checkout-inline-form-row">
                  <select
                    name="residenceType"
                    value={addressForm.residenceType}
                    onChange={(event) => setAddressForm((current) => ({ ...current, residenceType: event.target.value }))}
                  >
                    <option value="">Tipo de residência</option>
                    <option value="Casa">Casa</option>
                    <option value="Apartamento">Apartamento</option>
                    <option value="Condomínio">Condomínio</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div className="checkout-inline-form-row">
                  <select
                    name="streetType"
                    value={addressForm.streetType}
                    onChange={(event) => setAddressForm((current) => ({ ...current, streetType: event.target.value }))}
                  >
                    <option value="">Tipo de logradouro</option>
                    <option value="Rua">Rua</option>
                    <option value="Avenida">Avenida</option>
                    <option value="Praça">Praça</option>
                    <option value="Alameda">Alameda</option>
                  </select>
                  <input
                    name="street"
                    type="text"
                    placeholder="Logradouro"
                    value={addressForm.street}
                    onChange={(event) => setAddressForm((current) => ({ ...current, street: event.target.value }))}
                  />
                </div>
                <div className="checkout-inline-form-row">
                  <input
                    name="number"
                    type="text"
                    placeholder="Número"
                    value={addressForm.number}
                    onChange={(event) => setAddressForm((current) => ({ ...current, number: event.target.value }))}
                  />
                  <input
                    name="neighborhood"
                    type="text"
                    placeholder="Bairro"
                    value={addressForm.neighborhood}
                    onChange={(event) => setAddressForm((current) => ({ ...current, neighborhood: event.target.value }))}
                  />
                </div>
                <div className="checkout-inline-form-row">
                  <input
                    name="city"
                    type="text"
                    placeholder="Cidade"
                    value={addressForm.city}
                    onChange={(event) => setAddressForm((current) => ({ ...current, city: event.target.value }))}
                  />
                  <input
                    name="state"
                    type="text"
                    placeholder="Estado"
                    value={addressForm.state}
                    onChange={(event) => setAddressForm((current) => ({ ...current, state: event.target.value }))}
                  />
                </div>
                <div className="checkout-inline-form-row">
                  <input
                    name="country"
                    type="text"
                    placeholder="País"
                    value={addressForm.country}
                    onChange={(event) => setAddressForm((current) => ({ ...current, country: event.target.value }))}
                  />
                  <input
                    name="zipCode"
                    type="text"
                    placeholder="CEP"
                    value={addressForm.zipCode}
                    onChange={(event) => setAddressForm((current) => ({ ...current, zipCode: event.target.value }))}
                  />
                </div>
                <textarea
                  name="notes"
                  placeholder="Observação (opcional)"
                  value={addressForm.notes}
                  onChange={(event) => setAddressForm((current) => ({ ...current, notes: event.target.value }))}
                />
                <button type="submit" className="checkout-inline-submit">
                  Salvar endereço
                </button>
              </form>
            ) : null}
          </section>
        </div>

        <aside className="checkout-summary-panel" aria-label="Resumo final da compra">
          <h2 className="checkout-panel-title">Resumo final</h2>

          <div className="checkout-summary-rows">
            <div className="checkout-summary-row">
              <span>Subtotal</span>
              <strong>{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
            </div>
            <div className="checkout-summary-row">
              <span>Frete</span>
              <strong>{shippingTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
            </div>
            <button type="button" className="cart-coupon-button" onClick={onOpenCoupons}>
              Cupons aplicáveis {selectedCouponsCount > 0 ? `(${selectedCouponsCount})` : ''}
            </button>
          </div>

          {couponDiscountTotal > 0 ? (
            <div className="cart-summary-discount">
              <span>Descontos</span>
              <strong>-{couponDiscountTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
            </div>
          ) : null}

          <div className="cart-summary-total">
            <span>Total da compra</span>
            <strong>{finalTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
          </div>

          <button type="button" className="cart-checkout-button" onClick={onConfirmPurchase}>
            Confirmar pagamento
          </button>
        </aside>
      </div>
    </section>
  )
}
