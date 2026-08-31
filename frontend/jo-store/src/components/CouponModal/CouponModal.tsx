import { availableCoupons } from '../../data/storeData'
import './CouponModal.css'

type CouponModalProps = {
  isOpen: boolean
  subtotal: number
  selectedCouponIds: string[]
  onClose: () => void
  onToggleCoupon: (couponId: string) => void
}

export function CouponModal({
  isOpen,
  subtotal,
  selectedCouponIds,
  onClose,
  onToggleCoupon,
}: CouponModalProps) {
  if (!isOpen) return null

  return (
    <div className="coupon-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="coupon-modal-title" onClick={onClose}>
      <div className="coupon-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="coupon-modal-close" aria-label="Fechar cupons" onClick={onClose}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6 18 18" /><path d="M18 6 6 18" /></svg></button>

        <h2 id="coupon-modal-title" className="coupon-modal-title">Cupons disponíveis</h2>
        <p className="coupon-modal-subtitle">
          Veja quais descontos podem ser usados na compra atual.
        </p>

        <div className="coupon-list">
          {availableCoupons.map((coupon) => {
            const canUse = subtotal >= coupon.minimumSubtotal
            const isSelected = selectedCouponIds.includes(coupon.id)

            return (
              <article key={coupon.id} className="coupon-card">
                <div className="coupon-card-head">
                  <div>
                    <p className="coupon-code">{coupon.code}</p>
                    <h3 className="coupon-name">{coupon.title}</h3>
                  </div>
                  <strong className="coupon-discount">{coupon.discountLabel}</strong>
                </div>

                <p className="coupon-description">{coupon.description}</p>

                <div className="coupon-card-footer">
                  <div className="coupon-usage">
                    {canUse ? (
                      <label className="coupon-select"><input type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleCoupon(coupon.id)}
                        /><span>Aplicar na compra</span></label>
                    ) : null}
                    <span className={canUse ? 'coupon-status coupon-status-valid' : 'coupon-status coupon-status-invalid'}>
                      {canUse ? 'Pode ser utilizado nesta compra' : 'Ainda indisponível para esta compra'}
                    </span>
                  </div>
                  <span className="coupon-minimum">
                    Mínimo:{' '}
                    {coupon.minimumSubtotal.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
