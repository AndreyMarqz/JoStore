import { useEffect, useState } from "react";
import type { CartItem } from "../../types/store";
import type { ApiCart } from "../../services/orderGateway";
import "./CartPage.css";

type CartPageProps = {
  cartItems: CartItem[];
  cartSnapshot?: ApiCart | null;
  onBackToHome: () => void;
  onOpenCoupons: () => void;
  onUpdateItemQuantity: (itemId: string, nextQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  subtotal: number;
  shippingTotal: number;
  couponDiscountTotal: number;
  finalTotal: number;
  selectedCouponsCount: number;
  onProceedToCheckout: () => void;
};

function formatReservationTime(remainingMilliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMilliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function ReservationNotice({ cartSnapshot }: { cartSnapshot: ApiCart }) {
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [snapshotReceivedAt, setSnapshotReceivedAt] = useState(() => Date.now());

  useEffect(() => {
    const receivedAt = Date.now();
    setSnapshotReceivedAt(receivedAt);
    setCurrentTime(receivedAt);
  }, [cartSnapshot.expiresAt, cartSnapshot.serverTime]);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const expirationTime = new Date(cartSnapshot.expiresAt!);
  const serverTime = new Date(cartSnapshot.serverTime);
  const remainingMilliseconds = Math.max(
    0,
    expirationTime.getTime() -
      serverTime.getTime() -
      (currentTime - snapshotReceivedAt),
  );
  const isExpiringSoon =
    cartSnapshot.expirationWarning || remainingMilliseconds <= 5 * 60 * 1000;

  return (
    <section
      className={`cart-reservation-notice${isExpiringSoon ? " cart-reservation-notice--urgent" : ""}`}
      data-cy="reservation-expiry"
      aria-label="Prazo da reserva dos itens"
    >
      <div className="cart-reservation-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M12 7v5l3.2 2M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 3a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z" />
        </svg>
      </div>
      <div className="cart-reservation-content">
        <span className="cart-reservation-eyebrow">Itens reservados para você</span>
        <strong>
          Finalize a compra em{" "}
          <time dateTime={`PT${Math.ceil(remainingMilliseconds / 1000)}S`}>
            {formatReservationTime(remainingMilliseconds)}
          </time>
        </strong>
        <p>
          Reserva até {expirationTime.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}. O prazo é renovado a cada inclusão de produto.
        </p>
      </div>
      {isExpiringSoon ? (
        <span
          className="cart-reservation-status"
          role="alert"
          data-cy="reservation-warning"
        >
          Restam menos de 5 minutos
        </span>
      ) : null}
    </section>
  );
}

function ExpiredReservationNotice({
  items,
}: {
  items: ApiCart["removedItems"];
}) {
  if (items.length === 0) return null;

  return (
    <section
      className="cart-reservation-expired"
      aria-labelledby="expired-reservation-title"
      role="alert"
    >
      <div className="cart-reservation-expired-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 2a8 8 0 1 1-8 8 8 8 0 0 1 8-8Zm-1 3v5.4l3.5 2.1 1-1.7-2.5-1.5V7Z" />
        </svg>
      </div>
      <div className="cart-reservation-expired-content">
        <h2 id="expired-reservation-title">Sua reserva expirou</h2>
        <p>
          Os itens foram liberados e removidos do carrinho. Adicione-os
          novamente para continuar a compra.
        </p>
        <ul className="cart-expired-items-list">
          {items.map((item) => (
            <li key={item.id} data-cy="expired-cart-item">
              <strong>
                {item.name} <span>·</span> {item.size} <span>·</span>{" "}
                {item.quantity} {item.quantity === 1 ? "peça" : "peças"}
              </strong>
              <small>{item.reason}</small>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function CartPage({
  cartItems,
  cartSnapshot,
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

        <button
          type="button"
          className="cart-page-back-button"
          onClick={onBackToHome}
        >
          Continuar comprando
        </button>
      </div>

      <div className="cart-layout">
        <div className="cart-items-panel">
          {cartSnapshot?.expiresAt ? (
            <ReservationNotice cartSnapshot={cartSnapshot} />
          ) : null}
          {cartSnapshot?.removedItems ? (
            <ExpiredReservationNotice items={cartSnapshot.removedItems} />
          ) : null}
          {cartItems.length > 0 ? (
            <div className="cart-items-list">
              {cartItems.map((item) => (
                <article key={item.cartItemId} className="cart-item-card">
                  <div
                    className={`cart-item-media ${item.accent}`}
                    aria-hidden="true"
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="cart-item-image"
                      />
                    ) : (
                      <div className="product-card-placeholder" />
                    )}
                  </div>

                  <div className="cart-item-copy">
                    <h2 className="cart-item-name">{item.name}</h2>
                    <p className="cart-item-unit">
                      Tamanho: {item.size || "M"}
                    </p>
                    <div className="cart-item-controls">
                      <div className="cart-item-stepper">
                        <button
                          data-cy={`cart-decrease-${item.cartItemId}`}
                          type="button"
                          className="cart-item-stepper-button"
                          aria-label={`Diminuir quantidade de ${item.name}`}
                          onClick={() =>
                            onUpdateItemQuantity(
                              item.cartItemId,
                              item.quantity - 1,
                            )
                          }
                        >
                          -
                        </button>
                        <span className="cart-item-stepper-value">
                          {item.quantity}
                        </span>
                        <button
                          data-cy={`cart-increase-${item.cartItemId}`}
                          type="button"
                          className="cart-item-stepper-button"
                          aria-label={`Aumentar quantidade de ${item.name}`}
                          onClick={() =>
                            onUpdateItemQuantity(
                              item.cartItemId,
                              item.quantity + 1,
                            )
                          }
                        >
                          +
                        </button>
                      </div>

                      <button
                        data-cy={`cart-remove-${item.cartItemId}`}
                        type="button"
                        className="cart-item-remove"
                        onClick={() => onRemoveItem(item.cartItemId)}
                      >
                        Remover item
                      </button>
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
                {cartSnapshot?.removedItems.length
                  ? "Os produtos da reserva expirada foram liberados. Escolha os itens novamente para continuar."
                  : "Adicione alguns produtos da home para visualizar o resumo da sua compra aqui."}
              </p>
              <button
                type="button"
                className="cart-page-back-button"
                onClick={onBackToHome}
              >
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
              <strong>
                {cartItems.reduce((total, item) => total + item.quantity, 0)}
              </strong>
            </div>
            <div className="cart-summary-row">
              <span>Subtotal</span>
              <strong data-cy="cart-shipping-total">
                {subtotal.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </strong>
            </div>
            <div className="cart-summary-row">
              <span>Frete</span>
              <strong>
                {shippingTotal.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </strong>
            </div>
            <button
              type="button"
              className="cart-coupon-button"
              onClick={onOpenCoupons}
            >
              Cupons disponíveis{" "}
              {selectedCouponsCount > 0
                ? `(${selectedCouponsCount} selecionado${selectedCouponsCount > 1 ? "s" : ""})`
                : ""}
            </button>
          </div>

          {couponDiscountTotal > 0 ? (
            <div className="cart-summary-discount">
              <span>Descontos</span>
              <strong>
                -
                {couponDiscountTotal.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </strong>
            </div>
          ) : null}

          <div className="cart-summary-total">
            <span>Total</span>
            <strong>
              {finalTotal.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </strong>
          </div>

          <button
            data-cy="cart-proceed-checkout"
            disabled={cartItems.length === 0}
            type="button"
            className="cart-checkout-button"
            onClick={onProceedToCheckout}
          >
            Finalizar compra
          </button>
        </aside>
      </div>
    </section>
  );
}
