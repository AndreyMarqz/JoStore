import { useState, type FormEvent } from "react";
import { brazilianStates, countries } from "../../utils/addressOptions";
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
  brand: "",
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
    complement: "",
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
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isEditingCardPreferred, setIsEditingCardPreferred] = useState(false);
  const [isAddressComplementNotApplicable, setIsAddressComplementNotApplicable] = useState(false);
  const [cardForm, setCardForm] = useState<CardCreateInput>(emptyCardForm);
  const [addressForm, setAddressForm] =
    useState<ClientAddressInput>(createEmptyAddress);

  const selectedCards = client.cards.filter((card) =>
    selectedCardIds.includes(card.id),
  );
  const cardSplitAmounts = (() => {
    if (selectedCards.length < 2) return [];

    const totalInCents = Math.round(finalTotal * 100);
    const baseAmount = Math.floor(totalInCents / selectedCards.length);
    const remainder = totalInCents % selectedCards.length;

    return selectedCards.map((card, index) => ({
      card,
      amount: (baseAmount + (index < remainder ? 1 : 0)) / 100,
    }));
  })();
  const selectedAddress = deliveryAddresses.find(
    (address) => address.id === selectedAddressId,
  );
  const editingCard = editingCardId
    ? client.cards.find((card) => card.id === editingCardId)
    : undefined;

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

  async function fillAddressFromZipCode() {
    const zipCode = addressForm.zipCode.replace(/\D/g, "");
    if (zipCode.length !== 8) return;

    try {
      const result = await customerGateway.lookupAddress(zipCode);
      const streetTypes = ["Rua", "Avenida", "Alameda", "Praça"];
      const streetType = streetTypes.find((type) => result.street.startsWith(`${type} `));
      const street = streetType ? result.street.slice(streetType.length).trim() : result.street;
      setAddressForm((current) => ({
        ...current,
        zipCode: result.zipCode,
        street: street || current.street,
        streetType: streetType || current.streetType,
        neighborhood: result.neighborhood || current.neighborhood,
        city: result.city || current.city,
        state: result.state || current.state,
        country: result.country || current.country,
      }));
    } catch (error) {
      showError(error, "Não foi possível consultar o CEP.");
    }
  }

  function keepCardOrder(updatedClient: ClientDetails): ClientDetails {
    const cardsById = new Map(updatedClient.cards.map((card) => [card.id, card]));
    const currentCardIds = new Set(client.cards.map((card) => card.id));
    const cardsInCurrentOrder = client.cards.flatMap((card) => {
      const updatedCard = cardsById.get(card.id);
      return updatedCard ? [updatedCard] : [];
    });
    const newCards = updatedClient.cards.filter((card) => !currentCardIds.has(card.id));

    return { ...updatedClient, cards: [...cardsInCurrentOrder, ...newCards] };
  }

  async function handleSubmitCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      let updatedClient = editingCardId
        ? await customerGateway.updateCard(client.id, editingCardId, cardForm)
        : await customerGateway.addCard(client.id, cardForm);
      if (editingCardId && isEditingCardPreferred && !editingCard?.preferred) {
        updatedClient = await customerGateway.setPreferredCard(client.id, editingCardId);
      }
      const newCard = updatedClient.cards.at(-1);
      onClientChanged(keepCardOrder(updatedClient));
      if (!editingCardId && newCard) setSelectedCardIds((current) => [...current, newCard.id]);
      setCardForm(emptyCardForm);
      setEditingCardId(null);
      setIsEditingCardPreferred(false);
      setIsAddingCard(false);
      onShowToast({
        variant: "success",
        title: editingCardId ? "Cartão atualizado" : "Cartão salvo",
        message: editingCardId ? "Os dados do cartão foram atualizados." : "O cartão foi associado ao seu perfil.",
      });
    } catch (error) {
      showError(error, "Não foi possível salvar o cartão.");
    }
  }

  function handleEditCard(card: ClientCard) {
    setEditingCardId(card.id);
    setIsEditingCardPreferred(card.preferred);
    setCardForm({ number: "", holder: card.holder, brand: card.brand, securityCode: "" });
    setIsAddingCard(true);
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

  async function handleSubmitAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const addressPayload = {
        ...addressForm,
        complement: isAddressComplementNotApplicable ? undefined : addressForm.complement,
      };
      const updatedClient = editingAddressId
        ? await customerGateway.updateAddress(client.id, editingAddressId, addressPayload)
        : await customerGateway.addAddress(client.id, addressPayload);
      const newAddress = updatedClient.addresses.at(-1);
      onClientChanged(updatedClient);
      if (!editingAddressId && newAddress) setSelectedAddressId(newAddress.id);
      setAddressForm(createEmptyAddress());
      setEditingAddressId(null);
      setIsAddressComplementNotApplicable(false);
      setIsAddingAddress(false);
      onShowToast({
        variant: "success",
        title: editingAddressId ? "Endereço atualizado" : "Endereço salvo",
        message: editingAddressId ? "Os dados do endereço foram atualizados." : "O endereço de entrega foi associado ao perfil.",
      });
    } catch (error) {
      showError(error, "Não foi possível salvar o endereço.");
    }
  }

  function handleEditAddress(address: ClientAddress) {
    setEditingAddressId(address.id);
    setAddressForm({
      label: address.label,
      roles: address.roles,
      residenceType: address.residenceType,
      streetType: address.streetType,
      street: address.street,
      number: address.number,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      country: address.country,
      complement: address.complement ?? "",
      zipCode: address.zipCode,
      notes: address.notes ?? "",
    });
    setIsAddressComplementNotApplicable(!address.complement);
    setIsAddingAddress(true);
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
                onClick={() => {
                  setEditingCardId(null);
                  setIsEditingCardPreferred(false);
                  setCardForm(emptyCardForm);
                  setIsAddingCard((current) => !current);
                }}
              >
                {isAddingCard ? "Cancelar" : "Adicionar cartão +"}
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
                        <small>{card.holder}</small>
                      </span>
                    </label>
                    <div className="checkout-card-actions">
                      <button
                        type="button"
                        className="checkout-icon-button"
                        onClick={() => handleEditCard(card)}
                        aria-label="Editar cartão"
                        title="Editar cartão"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M4 16.5V20h3.5L18.3 9.2l-3.5-3.5L4 16.5Zm16.7-9.7a1 1 0 0 0 0-1.4l-2.1-2.1a1 1 0 0 0-1.4 0l-1.6 1.6 3.5 3.5 1.6-1.6Z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="checkout-icon-button checkout-icon-button--danger"
                        onClick={() => handleRemoveCard(card.id)}
                        aria-label="Remover cartão"
                        title="Remover cartão"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Zm4 3v6h2v-6h-2Zm4 0v6h2v-6h-2Z" />
                        </svg>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="checkout-empty-note">Nenhum cartão cadastrado.</p>
            )}

            {cardSplitAmounts.length > 0 ? (
              <div className="checkout-payment-split">
                <p>
                  Valor dividido entre {cardSplitAmounts.length} cartões
                </p>
                <div className="checkout-payment-split-list">
                  {cardSplitAmounts.map(({ card, amount }) => (
                    <div key={card.id}>
                      <span>{card.brand} final {card.last4}</span>
                      <strong>
                        {amount.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {isAddingCard ? (
              <form
                className="checkout-inline-form"
                onSubmit={handleSubmitCard}
              >
                <p className="checkout-inline-form-label">{editingCardId ? "Editar cartão" : "Novo cartão"}</p>
                {editingCard ? (
                  <p className="checkout-card-edit-note">
                    Cartão atual: final {editingCard.last4}. Informe o número completo somente se desejar alterá-lo.
                  </p>
                ) : null}
                <input
                  required
                  inputMode="numeric"
                  placeholder={editingCard ? "Novo número do cartão" : "Número do cartão"}
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
                    required
                    value={cardForm.brand}
                    onChange={(event) =>
                      setCardForm((current) => ({
                        ...current,
                        brand: event.target.value,
                      }))
                    }
                  >
                    <option value="">Selecione</option>
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
                {editingCardId ? (
                  <label className="checkout-card-preference">
                    <input
                      type="checkbox"
                      checked={isEditingCardPreferred}
                      onChange={(event) => setIsEditingCardPreferred(event.target.checked)}
                    />
                    Tornar este cartão preferencial
                  </label>
                ) : null}
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
                onClick={() => {
                  setEditingAddressId(null);
                  setIsAddressComplementNotApplicable(false);
                  setAddressForm(createEmptyAddress());
                  setIsAddingAddress((current) => !current);
                }}
              >
                {isAddingAddress ? "Cancelar" : "Adicionar endereço +"}
              </button>
            </div>

            {deliveryAddresses.length > 0 ? (
              <div className="checkout-address-list">
                {deliveryAddresses.map((address) => (
                  <article
                    key={address.id}
                    className={`checkout-address-option${selectedAddressId === address.id ? " is-selected" : ""}`}
                  >
                    <label className="checkout-address-main">
                      <input
                        type="radio"
                        name="delivery-address"
                        checked={selectedAddressId === address.id}
                        onChange={() => setSelectedAddressId(address.id)}
                      />
                      <div>
                        <strong>{address.label}</strong>
                        <p>{address.residenceType}</p>
                        <span>{`${address.streetType} ${address.street}, ${address.number}${address.complement ? `, ${address.complement}` : ""} - ${address.neighborhood} - ${address.city}/${address.state} - CEP ${address.zipCode}`}</span>
                        {address.notes ? <span>{address.notes}</span> : null}
                      </div>
                    </label>
                    <div className="checkout-address-actions">
                      <button
                        type="button"
                        className="checkout-icon-button"
                        onClick={() => handleEditAddress(address)}
                        aria-label="Editar endereço"
                        title="Editar endereço"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M4 16.5V20h3.5L18.3 9.2l-3.5-3.5L4 16.5Zm16.7-9.7a1 1 0 0 0 0-1.4l-2.1-2.1a1 1 0 0 0-1.4 0l-1.6 1.6 3.5 3.5 1.6-1.6Z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="checkout-icon-button checkout-icon-button--danger"
                        onClick={() => handleRemoveAddress(address.id)}
                        aria-label="Remover endereço"
                        title="Remover endereço"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Zm4 3v6h2v-6h-2Zm4 0v6h2v-6h-2Z" />
                        </svg>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
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
                <p className="checkout-inline-form-label">{editingAddressId ? "Editar endereço de entrega" : "Novo endereço de entrega"}</p>
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
                    disabled={isAddressComplementNotApplicable}
                    placeholder="Complemento"
                    value={addressForm.complement ?? ""}
                    onChange={(event) =>
                      setAddressForm((current) => ({
                        ...current,
                        complement: event.target.value,
                      }))
                    }
                  />
                  <label className="checkout-complement-not-applicable">
                    <input
                      type="checkbox"
                      checked={isAddressComplementNotApplicable}
                      onChange={(event) => {
                        setIsAddressComplementNotApplicable(event.target.checked);
                        if (event.target.checked) {
                          setAddressForm((current) => ({ ...current, complement: "" }));
                        }
                      }}
                    />
                    N/A
                  </label>
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
                  <select
                    required
                    value={addressForm.state}
                    onChange={(event) => setAddressForm((current) => ({ ...current, state: event.target.value }))}
                  >
                    <option value="">Estado</option>
                    {brazilianStates.map((state) => <option key={state} value={state}>{state}</option>)}
                  </select>
                </div>
                <div className="checkout-inline-form-row">
                  <select
                    required
                    value={addressForm.country}
                    onChange={(event) => setAddressForm((current) => ({ ...current, country: event.target.value }))}
                  >
                    <option value="">País</option>
                    {countries.map((country) => <option key={country.code} value={country.name}>{country.name}</option>)}
                  </select>
                  <input
                    required
                    placeholder="CEP"
                    value={addressForm.zipCode}
                    onBlur={fillAddressFromZipCode}
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
              Cupons aplicáveis{" "}
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
