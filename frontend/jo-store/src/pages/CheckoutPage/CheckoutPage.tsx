import { useState, type FormEvent } from "react";
import { CustomerGatewayError } from "../../services/customerGateway";
import { useCustomerGateway } from "../../services/useCustomerGateway";
import type {
  CardCreateInput,
  ClientAddress,
  ClientAddressInput,
  ClientCard,
  ClientDetails,
  ToastState,
} from "../../types/store";
import "./CheckoutPage.css";

type CheckoutPageProps = {
  client: ClientDetails;
  selectedCouponsCount: number;
  subtotal: number;
  shippingTotal: number;
  couponDiscountTotal: number;
  finalTotal: number;
  onBackToCart: () => void;
  onOpenCoupons: () => void;
  onClientChanged: (client: ClientDetails) => void;
  onShowToast: (toast: Exclude<ToastState, null>) => void;
  onConfirmPurchase: (cards: ClientCard[], address: ClientAddress) => void;
};

const emptyCardForm: CardCreateInput = {
  number: "",
  holder: "",
  brand: "Visa",
  securityCode: "",
};

function createEmptyAddress(): ClientAddressInput {
  return {
    label: "",
    roles: ["Entrega"],
    residenceType: "",
    streetType: "",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
    notes: "",
  };
}

export function CheckoutPage({
  client,
  selectedCouponsCount,
  subtotal,
  shippingTotal,
  couponDiscountTotal,
  finalTotal,
  onBackToCart,
  onOpenCoupons,
  onClientChanged,
  onShowToast,
  onConfirmPurchase,
}: CheckoutPageProps) {
  const customerGateway = useCustomerGateway();
  const deliveryAddresses = client.addresses.filter((address) =>
    address.roles.includes("Entrega"),
  );
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>(() =>
    client.cards.filter((card) => card.preferred).map((card) => card.id),
  );
  const [selectedAddressId, setSelectedAddressId] = useState(
    () => deliveryAddresses[0]?.id ?? "",
  );
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [cardForm, setCardForm] = useState<CardCreateInput>(emptyCardForm);
  const [addressForm, setAddressForm] =
    useState<ClientAddressInput>(createEmptyAddress);

  const selectedCards = client.cards.filter((card) =>
    selectedCardIds.includes(card.id),
  );
  const selectedAddress = deliveryAddresses.find(
    (address) => address.id === selectedAddressId,
  );

  function showError(error: unknown, fallback: string) {
    onShowToast({
      variant: "error",
      title: "Operação não concluída",
      message: error instanceof CustomerGatewayError ? error.message : fallback,
    });
  }

  function toggleCard(cardId: string) {
    setSelectedCardIds((current) =>
      current.includes(cardId)
        ? current.filter((id) => id !== cardId)
        : [...current, cardId],
    );
  }

  async function handleSubmitCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const updatedClient = await customerGateway.addCard(client.id, cardForm);
      const newCard = updatedClient.cards.at(-1);
      onClientChanged(updatedClient);
      if (newCard) setSelectedCardIds((current) => [...current, newCard.id]);
      setCardForm(emptyCardForm);
      setIsAddingCard(false);
      onShowToast({
        variant: "success",
        title: "Cartão salvo",
        message: "O cartão foi associado ao seu perfil.",
      });
    } catch (error) {
      showError(error, "Não foi possível salvar o cartão.");
    }
  }

  async function handleRemoveCard(cardId: string) {
    try {
      const updatedClient = await customerGateway.removeCard(client.id, cardId);
      onClientChanged(updatedClient);
      setSelectedCardIds((current) => current.filter((id) => id !== cardId));
      onShowToast({
        variant: "success",
        title: "Cartão removido",
        message: "O cartão foi removido do perfil.",
      });
    } catch (error) {
      showError(error, "Não foi possível remover o cartão.");
    }
  }

  async function handleSetPreferredCard(cardId: string) {
    try {
      const updatedClient = await customerGateway.setPreferredCard(
        client.id,
        cardId,
      );
      onClientChanged(updatedClient);
      onShowToast({
        variant: "success",
        title: "Cartão preferencial",
        message: "A preferência foi atualizada.",
      });
    } catch (error) {
      showError(error, "Não foi possível atualizar a preferência.");
    }
  }

  async function handleSubmitAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const updatedClient = await customerGateway.addAddress(
        client.id,
        addressForm,
      );
      const newAddress = updatedClient.addresses.at(-1);
      onClientChanged(updatedClient);
      if (newAddress) setSelectedAddressId(newAddress.id);
      setAddressForm(createEmptyAddress());
      setIsAddingAddress(false);
      onShowToast({
        variant: "success",
        title: "Endereço salvo",
        message: "O endereço de entrega foi associado ao perfil.",
      });
    } catch (error) {
      showError(error, "Não foi possível salvar o endereço.");
    }
  }

  async function handleRemoveAddress(addressId: string) {
    try {
      const updatedClient = await customerGateway.removeAddress(
        client.id,
        addressId,
      );
      onClientChanged(updatedClient);
      if (selectedAddressId === addressId) {
        setSelectedAddressId(
          updatedClient.addresses.find((address) =>
            address.roles.includes("Entrega"),
          )?.id ?? "",
        );
      }
      onShowToast({
        variant: "success",
        title: "Endereço removido",
        message: "O endereço foi removido do perfil.",
      });
    } catch (error) {
      showError(error, "Não foi possível remover o endereço.");
    }
  }

  function handleConfirm() {
    if (selectedCards.length === 0) {
      onShowToast({
        variant: "error",
        title: "Pagamento pendente",
        message: "Selecione ao menos um cartão.",
      });
      return;
    }

    if (!selectedAddress) {
      onShowToast({
        variant: "error",
        title: "Entrega pendente",
        message: "Selecione um endereço de entrega.",
      });
      return;
    }

    onConfirmPurchase(selectedCards, selectedAddress);
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
        <button
          type="button"
          className="cart-page-back-button"
          onClick={onBackToCart}
        >
          Voltar ao carrinho
        </button>
      </div>

      <div className="checkout-layout">
        <div className="checkout-main">
          <section className="checkout-panel">
            <div className="checkout-panel-header">
              <h2 className="checkout-panel-title">Cartões</h2>
              <button
                type="button"
                className="checkout-link-button"
                onClick={() => setIsAddingCard((current) => !current)}
              >
                {isAddingCard ? "Cancelar" : "Adicionar cartão"}
              </button>
            </div>

            {client.cards.length > 0 ? (
              <div className="checkout-card-list">
                {client.cards.map((card) => (
                  <article key={card.id} className="checkout-payment-card">
                    <label className="checkout-payment-card-main">
                      <input
                        type="checkbox"
                        checked={selectedCardIds.includes(card.id)}
                        onChange={() => toggleCard(card.id)}
                      />
                      <span>
                        <strong>
                          {card.brand} final {card.last4}
                        </strong>
                        <small>
                          {card.holder}
                          {card.preferred ? " - preferencial" : ""}
                        </small>
                      </span>
                    </label>
                    <div className="checkout-card-actions">
                      {!card.preferred ? (
                        <button
                          type="button"
                          className="checkout-link-button"
                          onClick={() => handleSetPreferredCard(card.id)}
                        >
                          Preferencial
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="checkout-link-button"
                        onClick={() => handleRemoveCard(card.id)}
                      >
                        Remover
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="checkout-empty-note">Nenhum cartão cadastrado.</p>
            )}

            {isAddingCard ? (
              <form
                className="checkout-inline-form"
                onSubmit={handleSubmitCard}
              >
                <input
                  required
                  inputMode="numeric"
                  placeholder="Número do cartão"
                  value={cardForm.number}
                  onChange={(event) =>
                    setCardForm((current) => ({
                      ...current,
                      number: event.target.value.replace(/[^\d\s]/g, ""),
                    }))
                  }
                />
                <input
                  required
                  placeholder="Nome impresso no cartão"
                  value={cardForm.holder}
                  onChange={(event) =>
                    setCardForm((current) => ({
                      ...current,
                      holder: event.target.value,
                    }))
                  }
                />
                <div className="checkout-inline-form-row">
                  <select
                    value={cardForm.brand}
                    onChange={(event) =>
                      setCardForm((current) => ({
                        ...current,
                        brand: event.target.value,
                      }))
                    }
                  >
                    <option>Visa</option>
                    <option>Mastercard</option>
                    <option>Elo</option>
                    <option>American Express</option>
                  </select>
                  <input
                    required
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="Código de segurança"
                    value={cardForm.securityCode}
                    onChange={(event) =>
                      setCardForm((current) => ({
                        ...current,
                        securityCode: event.target.value.replace(/\D/g, ""),
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
              <button
                type="button"
                className="checkout-link-button"
                onClick={() => setIsAddingAddress((current) => !current)}
              >
                {isAddingAddress ? "Cancelar" : "Adicionar endereço"}
              </button>
            </div>

            {deliveryAddresses.map((address) => (
              <label
                key={address.id}
                className={`checkout-address-option${selectedAddressId === address.id ? " is-selected" : ""}`}
              >
                <input
                  type="radio"
                  name="delivery-address"
                  checked={selectedAddressId === address.id}
                  onChange={() => setSelectedAddressId(address.id)}
                />
                <div>
                  <strong>{address.label}</strong>
                  <p>{address.residenceType}</p>
                  <span>{`${address.streetType} ${address.street}, ${address.number} - ${address.neighborhood} - ${address.city}/${address.state} - CEP ${address.zipCode}`}</span>
                  {address.notes ? <span>{address.notes}</span> : null}
                </div>
                <button
                  type="button"
                  className="checkout-link-button"
                  onClick={(event) => {
                    event.preventDefault();
                    handleRemoveAddress(address.id);
                  }}
                >
                  Remover
                </button>
              </label>
            ))}
            {deliveryAddresses.length === 0 ? (
              <p className="checkout-empty-note">
                Nenhum endereço de entrega cadastrado.
              </p>
            ) : null}

            {isAddingAddress ? (
              <form
                className="checkout-inline-form"
                onSubmit={handleSubmitAddress}
              >
                <div className="checkout-inline-form-row">
                  <input
                    required
                    placeholder="Nome do endereço"
                    value={addressForm.label}
                    onChange={(event) =>
                      setAddressForm((current) => ({
                        ...current,
                        label: event.target.value,
                      }))
                    }
                  />
                  <select
                    required
                    value={addressForm.residenceType}
                    onChange={(event) =>
                      setAddressForm((current) => ({
                        ...current,
                        residenceType: event.target.value,
                      }))
                    }
                  >
                    <option value="">Tipo de residência</option>
                    <option>Casa</option>
                    <option>Apartamento</option>
                    <option>Condomínio</option>
                    <option>Comercial</option>
                  </select>
                </div>
                <div className="checkout-inline-form-row">
                  <select
                    required
                    value={addressForm.streetType}
                    onChange={(event) =>
                      setAddressForm((current) => ({
                        ...current,
                        streetType: event.target.value,
                      }))
                    }
                  >
                    <option value="">Tipo de logradouro</option>
                    <option>Rua</option>
                    <option>Avenida</option>
                    <option>Praca</option>
                    <option>Alameda</option>
                  </select>
                  <input
                    required
                    placeholder="Logradouro"
                    value={addressForm.street}
                    onChange={(event) =>
                      setAddressForm((current) => ({
                        ...current,
                        street: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="checkout-inline-form-row">
                  <input
                    required
                    placeholder="Número"
                    value={addressForm.number}
                    onChange={(event) =>
                      setAddressForm((current) => ({
                        ...current,
                        number: event.target.value,
                      }))
                    }
                  />
                  <input
                    required
                    placeholder="Bairro"
                    value={addressForm.neighborhood}
                    onChange={(event) =>
                      setAddressForm((current) => ({
                        ...current,
                        neighborhood: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="checkout-inline-form-row">
                  <input
                    required
                    placeholder="Cidade"
                    value={addressForm.city}
                    onChange={(event) =>
                      setAddressForm((current) => ({
                        ...current,
                        city: event.target.value,
                      }))
                    }
                  />
                  <input
                    required
                    placeholder="Estado"
                    value={addressForm.state}
                    onChange={(event) =>
                      setAddressForm((current) => ({
                        ...current,
                        state: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="checkout-inline-form-row">
                  <input
                    required
                    placeholder="País"
                    value={addressForm.country}
                    onChange={(event) =>
                      setAddressForm((current) => ({
                        ...current,
                        country: event.target.value,
                      }))
                    }
                  />
                  <input
                    required
                    placeholder="CEP"
                    value={addressForm.zipCode}
                    onChange={(event) =>
                      setAddressForm((current) => ({
                        ...current,
                        zipCode: event.target.value,
                      }))
                    }
                  />
                </div>
                <textarea
                  placeholder="Observacao (opcional)"
                  value={addressForm.notes}
                  onChange={(event) =>
                    setAddressForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
                <button type="submit" className="checkout-inline-submit">
                  Salvar endereço
                </button>
              </form>
            ) : null}
          </section>
        </div>

        <aside
          className="checkout-summary-panel"
          aria-label="Resumo final da compra"
        >
          <h2 className="checkout-panel-title">Resumo final</h2>
          <div className="checkout-summary-rows">
            <div className="checkout-summary-row">
              <span>Subtotal</span>
              <strong>
                {subtotal.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </strong>
            </div>
            <div className="checkout-summary-row">
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
              Cupons aplicaveis{" "}
              {selectedCouponsCount > 0 ? `(${selectedCouponsCount})` : ""}
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
            <span>Total da compra</span>
            <strong>
              {finalTotal.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </strong>
          </div>
          <button
            type="button"
            className="cart-checkout-button"
            onClick={handleConfirm}
          >
            Confirmar pagamento
          </button>
        </aside>
      </div>
    </section>
  );
}
