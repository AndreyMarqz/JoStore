import type { Coupon } from "../../types/store";
import "./CouponModal.css";

type CouponModalProps = {
  isOpen: boolean;
  coupons: Coupon[];
  subtotal: number;
  purchaseTotal: number;
  selectedCouponIds: string[];
  onClose: () => void;
  onToggleCoupon: (couponId: string) => void;
};

export function CouponModal({
  isOpen,
  coupons,
  subtotal,
  purchaseTotal,
  selectedCouponIds,
  onClose,
  onToggleCoupon,
}: CouponModalProps) {
  if (!isOpen) return null;

  const selectedPromotionalCouponId = coupons.find(
    (coupon) => coupon.type === "PROMOCIONAL" && selectedCouponIds.includes(coupon.id),
  )?.id;

  return (
    <div
      className="coupon-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coupon-modal-title"
      onClick={onClose}
    >
      <div
        className="coupon-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="coupon-modal-close"
          aria-label="Fechar cupons"
          onClick={onClose}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6 18 18" />
            <path d="M18 6 6 18" />
          </svg>
        </button>

        <h2 id="coupon-modal-title" className="coupon-modal-title">
          Cupons disponíveis
        </h2>
        <p className="coupon-modal-subtitle">
          Veja quais descontos podem ser usados na compra atual.
        </p>

        <div className="coupon-list">
          {coupons.map((coupon) => {
            const canUse = subtotal >= coupon.minimumSubtotal;
            const isSelected = selectedCouponIds.includes(coupon.id);
            const blockedByPromotionalCoupon =
              coupon.type === "PROMOCIONAL" &&
              Boolean(selectedPromotionalCouponId) &&
              selectedPromotionalCouponId !== coupon.id;
            const candidateIds = [...selectedCouponIds, coupon.id];
            const orderedCandidates = coupons
              .filter((item) => candidateIds.includes(item.id))
              .sort((first, second) => second.amount - first.amount);
            let coveredValue = 0;
            const retainedCandidateIds: string[] = [];
            for (const candidate of orderedCandidates) {
              if (coveredValue >= purchaseTotal) break;
              retainedCandidateIds.push(candidate.id);
              coveredValue += candidate.amount;
            }
            const blockedByCoveredPurchase =
              purchaseTotal > 0 &&
              !isSelected &&
              !retainedCandidateIds.includes(coupon.id);
            const isUnavailable =
              !canUse || blockedByPromotionalCoupon || blockedByCoveredPurchase;

            return (
              <article
                key={coupon.id}
                data-cy={`coupon-${coupon.code}`}
                className={`coupon-card${isUnavailable && !isSelected ? " is-disabled" : ""}`}
              >
                <div className="coupon-card-head">
                  <div>
                    <p className="coupon-code">{coupon.code}</p>
                    <h3 className="coupon-name">{coupon.title}</h3>
                  </div>
                  <strong className="coupon-discount">
                    {coupon.discountLabel}
                  </strong>
                </div>

                <p className="coupon-description">{coupon.description}</p>

                <div className="coupon-card-footer">
                  <div className="coupon-usage">
                    {canUse ? (
                      <label className="coupon-select">
                        <input
                          data-cy={`coupon-toggle-${coupon.code}`}
                          type="checkbox"
                          checked={isSelected}
                          disabled={isUnavailable && !isSelected}
                          onChange={() => onToggleCoupon(coupon.id)}
                        />
                        <span>Aplicar na compra</span>
                      </label>
                    ) : null}
                    <span
                      className={
                        !isUnavailable
                          ? "coupon-status coupon-status-valid"
                          : "coupon-status coupon-status-invalid"
                      }
                    >
                      {blockedByPromotionalCoupon
                        ? "Outro cupom promocional já está selecionado"
                        : blockedByCoveredPurchase
                        ? "Cupons de maior valor já cobrem a compra"
                        : canUse
                        ? "Pode ser utilizado nesta compra"
                        : "Ainda indisponível para esta compra"}
                    </span>
                  </div>
                  <span className="coupon-minimum">
                    Mínimo:{" "}
                    {coupon.minimumSubtotal.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
