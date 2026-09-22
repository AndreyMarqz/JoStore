import { type FormEvent, useRef, useState } from "react";
import { CustomerGatewayError } from "../../services/customerGateway";
import { useCustomerGateway } from "../../services/useCustomerGateway";
import { PasswordField } from "../../components/PasswordField/PasswordField";
import type {
  AddressRole,
  CardCreateInput,
  ClientAddressInput,
  ClientDetails,
  ClientPasswordUpdateInput,
  ClientUpdateInput,
  Order,
  ToastState,
} from "../../types/store";
import { brazilianStates, countries, residenceTypes, streetTypes } from "../../utils/addressOptions";
import "./ProfilePage.css";

type Props = {
  client: ClientDetails;
  orders: Order[];
  onClientChanged: (client: ClientDetails) => void;
  onLogout: () => void;
  onCancelOrder: (id: string) => void;
  onConfirmOrderReceived: (id: string) => void;
  onRequestOrderExchange: (id: string) => void;
  onShowToast: (toast: Exclude<ToastState, null>) => void;
};

const blankAddress: ClientAddressInput = {
  label: "",
  roles: ["Entrega"],
  residenceType: "",
  streetType: "",
  street: "",
  number: "",
  neighborhood: "",
  zipCode: "",
  city: "",
  state: "",
  country: "Brasil",
  complement: "",
  notes: "",
};
const blankCard: CardCreateInput = {
  holder: "",
  number: "",
  brand: "Visa",
  securityCode: "",
};
const roles: AddressRole[] = ["Residência", "Cobrança", "Entrega"];
const genders = ["Feminino", "Masculino", "Não binário", "Prefiro não informar"];
const phoneTypes = ["Celular", "Residencial", "Comercial"];
type ProfileSection =
  | "info"
  | "edit"
  | "password"
  | "addresses"
  | "cards"
  | "orders";

const profileSectionTitles: Record<ProfileSection, string> = {
  info: "Minhas informações",
  edit: "Alterar informações",
  password: "Alterar senha",
  addresses: "Meus endereços",
  cards: "Meus cartões",
  orders: "Meus pedidos",
};

function errorMessage(error: unknown) {
  return error instanceof CustomerGatewayError
    ? error.message
    : "Não foi possível concluir a operação.";
}

export function ClientProfilePage({
  client,
  orders,
  onClientChanged,
  onLogout,
  onCancelOrder,
  onConfirmOrderReceived,
  onRequestOrderExchange,
  onShowToast,
}: Props) {
  const gateway = useCustomerGateway();
  const [addressForm, setAddressForm] =
    useState<ClientAddressInput>(blankAddress);
  const [cardForm, setCardForm] = useState<CardCreateInput>(blankCard);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [isLookingUpZipCode, setIsLookingUpZipCode] = useState(false);
  const zipCodeLookupRequest = useRef(0);
  const [isCardFormOpen, setIsCardFormOpen] = useState(false);
  const [personalForm, setPersonalForm] = useState<ClientUpdateInput>(() => ({
    gender: client.gender,
    fullName: client.fullName,
    birthDate: client.birthDate,
    cpf: client.cpf,
    email: client.email,
    phone: { ...client.phone },
  }));
  const [passwordForm, setPasswordForm] = useState<ClientPasswordUpdateInput>({
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [activeSection, setActiveSection] = useState<ProfileSection>("info");
  const pageTitle = profileSectionTitles[activeSection];
  const address = client.addresses[0];

  function openSection(section: ProfileSection) {
    setActiveSection(section);
  }

  function setFeedback(toast: Exclude<ToastState, null>) {
    onShowToast(toast);
  }

  async function updateAddressZipCode(value: string) {
    const requestId = ++zipCodeLookupRequest.current;
    const zipCode = value.replace(/\D/g, "");
    setAddressForm((current) => ({ ...current, zipCode: value }));

    if (zipCode.length !== 8) {
      setIsLookingUpZipCode(false);
      return;
    }

    try {
      setIsLookingUpZipCode(true);
      const lookup = await gateway.lookupAddress(zipCode);
      if (requestId !== zipCodeLookupRequest.current) return;

      setAddressForm((current) => ({
        ...current,
        zipCode: lookup.zipCode,
        street: lookup.street,
        neighborhood: lookup.neighborhood,
        city: lookup.city,
        state: lookup.state,
        country: lookup.country,
      }));
    } catch (error) {
      if (requestId !== zipCodeLookupRequest.current) return;
      setFeedback({
        variant: "error",
        title: "Não foi possível consultar o CEP",
        message: errorMessage(error),
      });
    } finally {
      if (requestId === zipCodeLookupRequest.current) {
        setIsLookingUpZipCode(false);
      }
    }
  }

  async function saveAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const updated = editingId
        ? await gateway.updateAddress(client.id, editingId, addressForm)
        : await gateway.addAddress(client.id, addressForm);
      onClientChanged(updated);
      setAddressForm(blankAddress);
      setEditingId(null);
      setIsAddressFormOpen(false);
      setFeedback({
        variant: "success",
        title: "Endereço salvo",
        message: "Os dados do endereço foram atualizados.",
      });
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "Não foi possível salvar",
        message: errorMessage(error),
      });
    }
  }

  async function removeAddress(id: string) {
    try {
      onClientChanged(await gateway.removeAddress(client.id, id));
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "Endereço obrigatório",
        message: errorMessage(error),
      });
    }
  }

  async function saveCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      onClientChanged(await gateway.addCard(client.id, cardForm));
      setCardForm(blankCard);
      setIsCardFormOpen(false);
      setFeedback({
        variant: "success",
        title: "Cartão salvo",
        message: "O cartão foi adicionado com segurança.",
      });
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "Não foi possível salvar",
        message: errorMessage(error),
      });
    }
  }

  async function updateCard(action: () => Promise<ClientDetails>) {
    try {
      onClientChanged(await action());
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "Não foi possível atualizar",
        message: errorMessage(error),
      });
    }
  }

  async function savePersonalData(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      onClientChanged(await gateway.updateClient(client.id, personalForm));
      setFeedback({
        variant: "success",
        title: "Dados atualizados",
        message: "Os dados pessoais foram atualizados.",
      });
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "Não foi possível atualizar",
        message: errorMessage(error),
      });
    }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submittedPassword = {
      currentPassword: String(formData.get("currentPassword") ?? ""),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    };

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/.test(submittedPassword.password)) {
      setFeedback({
        variant: "error",
        title: "Não foi possível alterar a senha",
        message:
          "A senha deve ter ao menos 8 caracteres, letra maiúscula, minúscula e caractere especial.",
      });
      return;
    }
    if (submittedPassword.password !== submittedPassword.confirmPassword) {
      setFeedback({
        variant: "error",
        title: "Não foi possível alterar a senha",
        message: "Os campos de nova senha e confirmação devem ser iguais.",
      });
      return;
    }
    try {
      await gateway.updatePassword(client.id, submittedPassword);
      setPasswordForm({
        currentPassword: "",
        password: "",
        confirmPassword: "",
      });
      setFeedback({
        variant: "success",
        title: "Senha atualizada",
        message: "Sua senha foi alterada com segurança.",
      });
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "Não foi possível alterar a senha",
        message: errorMessage(error),
      });
    }
  }

  return (
    <section
      className={`profile-page profile-page-with-navigation profile-page--${activeSection}`}
      aria-labelledby="client-profile-title"
    >
      <div className="profile-page-header">
        <h1 id="client-profile-title" className="profile-page-title">
          {pageTitle}
        </h1>
        <p className="profile-page-subtitle">Dados cadastrados na JoStore.</p>
      </div>
      <aside
        className="profile-sidebar profile-account-navigation"
        aria-label="Opções da conta"
      >
        <button
          type="button"
          className={`profile-nav-button${activeSection === "info" ? " is-active" : ""}`}
          onClick={() => openSection("info")}
        >
          Minhas informações
        </button>
        <button
          type="button"
          className={`profile-nav-button${activeSection === "edit" ? " is-active" : ""}`}
          onClick={() => openSection("edit")}
        >
          Alterar informações
        </button>
        <button
          type="button"
          className={`profile-nav-button${activeSection === "password" ? " is-active" : ""}`}
          onClick={() => openSection("password")}
        >
          Alterar senha
        </button>
        <button
          type="button"
          className={`profile-nav-button${activeSection === "addresses" ? " is-active" : ""}`}
          onClick={() => openSection("addresses")}
        >
          Meus endereços
        </button>
        <button
          type="button"
          className={`profile-nav-button${activeSection === "cards" ? " is-active" : ""}`}
          onClick={() => openSection("cards")}
        >
          Meus cartões
        </button>
        <button
          type="button"
          className={`profile-nav-button${activeSection === "orders" ? " is-active" : ""}`}
          onClick={() => openSection("orders")}
        >
          Meus pedidos
        </button>
        <button type="button" className="profile-nav-button" onClick={onLogout}>
          Sair
        </button>
      </aside>

      <section className="profile-panel">
        <div className="profile-panel-header">
          <div>
            <h2 className="profile-panel-title">{client.fullName}</h2>
            <p className="profile-page-subtitle">
              Código do cliente: {client.code}
            </p>
          </div>
          <span className="profile-status-badge">{client.status}</span>
        </div>
        <div className="profile-info-grid profile-info-grid-readonly">
          <div className="profile-field">
            <span>Gênero</span>
            <strong className="profile-field-value">{client.gender}</strong>
          </div>
          <div className="profile-field">
            <span>CPF</span>
            <strong className="profile-field-value">{client.cpf}</strong>
          </div>
          <div className="profile-field">
            <span>Data de nascimento</span>
            <strong className="profile-field-value">
              {new Date(`${client.birthDate}T12:00:00`).toLocaleDateString(
                "pt-BR",
              )}
            </strong>
          </div>
          <div className="profile-field">
            <span>E-mail</span>
            <strong className="profile-field-value">{client.email}</strong>
          </div>
          <div className="profile-field">
            <span>Telefone</span>
            <strong className="profile-field-value">{`${client.phone.type}: (${client.phone.areaCode}) ${client.phone.number}`}</strong>
          </div>
          {address ? (
            <>
              <div className="profile-field">
                <span>Endereço principal</span>
                <strong className="profile-field-value">{`${address.streetType} ${address.street}, ${address.number}`}</strong>
              </div>
              <div className="profile-field">
                <span>Cidade / Estado</span>
                <strong className="profile-field-value">{`${address.city} - ${address.state}`}</strong>
              </div>
            </>
          ) : null}
        </div>
      </section>

      <section className="profile-panel profile-management-panel">
        <div className="profile-panel-header">
          <div>
            <h2 className="profile-panel-title">Dados pessoais</h2>
            <p className="profile-page-subtitle">
              Altere seus dados cadastrais quando necessário.
            </p>
          </div>
        </div>
        <form className="profile-info-form" onSubmit={savePersonalData}>
          <div className="profile-info-grid">
            <label className="profile-field">
              <span>Nome completo</span>
              <input
                required
                value={personalForm.fullName}
                onChange={(event) =>
                  setPersonalForm({
                    ...personalForm,
                    fullName: event.target.value,
                  })
                }
              />
            </label>
            <label className="profile-field">
              <span>CPF</span>
              <input
                required
                inputMode="numeric"
                value={personalForm.cpf}
                onChange={(event) =>
                  setPersonalForm({ ...personalForm, cpf: event.target.value })
                }
              />
            </label>
            <label className="profile-field">
              <span>Data de nascimento</span>
              <input
                required
                type="date"
                value={personalForm.birthDate}
                onChange={(event) =>
                  setPersonalForm({
                    ...personalForm,
                    birthDate: event.target.value,
                  })
                }
              />
            </label>
            <label className="profile-field">
              <span>Gênero</span>
              <select
                required
                value={personalForm.gender}
                onChange={(event) =>
                  setPersonalForm({
                    ...personalForm,
                    gender: event.target.value,
                  })
                }
              >
                {genders.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender}
                  </option>
                ))}
              </select>
            </label>
            <label className="profile-field">
              <span>E-mail</span>
              <input
                required
                type="email"
                value={personalForm.email}
                onChange={(event) =>
                  setPersonalForm({
                    ...personalForm,
                    email: event.target.value,
                  })
                }
              />
            </label>
            <label className="profile-field">
              <span>Tipo de telefone</span>
              <select
                required
                value={personalForm.phone.type}
                onChange={(event) =>
                  setPersonalForm({
                    ...personalForm,
                    phone: { ...personalForm.phone, type: event.target.value },
                  })
                }
              >
                {phoneTypes.map((phoneType) => (
                  <option key={phoneType} value={phoneType}>
                    {phoneType}
                  </option>
                ))}
              </select>
            </label>
            <label className="profile-field">
              <span>DDD</span>
              <input
                required
                inputMode="numeric"
                value={personalForm.phone.areaCode}
                onChange={(event) =>
                  setPersonalForm({
                    ...personalForm,
                    phone: {
                      ...personalForm.phone,
                      areaCode: event.target.value.replace(/\D/g, ""),
                    },
                  })
                }
              />
            </label>
            <label className="profile-field">
              <span>Número</span>
              <input
                required
                inputMode="numeric"
                value={personalForm.phone.number}
                onChange={(event) =>
                  setPersonalForm({
                    ...personalForm,
                    phone: {
                      ...personalForm.phone,
                      number: event.target.value.replace(/\D/g, ""),
                    },
                  })
                }
              />
            </label>
          </div>
          <div className="profile-info-actions">
            <button
              type="submit"
              className="order-card-action order-card-action-primary"
            >
              Salvar dados pessoais
            </button>
          </div>
        </form>
      </section>

      <section className="profile-panel profile-management-panel">
        <div className="profile-panel-header">
          <div>
            <h2 className="profile-panel-title">Alterar senha</h2>
            <p className="profile-page-subtitle">
              Use ao menos 8 caracteres, com maiúscula, minúscula e caractere
              especial.
            </p>
          </div>
        </div>
        <form className="profile-info-form" onSubmit={savePassword}>
          <div className="profile-info-grid">
            <label className="profile-field password">
              <span>Senha atual</span>
              <PasswordField
                required
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    currentPassword: event.target.value,
                  }))
                }
              />
            </label>
            <label className="profile-field password">
              <span>Nova senha</span>
              <PasswordField
                required
                name="password"
                value={passwordForm.password}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
              />
            </label>
            <label className="profile-field password">
              <span>Confirmar nova senha</span>
              <PasswordField
                required
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    confirmPassword: event.target.value,
                  }))
                }
              />
            </label>
          </div>
          <div className="profile-info-actions">
            <button
              type="submit"
              className="order-card-action order-card-action-primary"
            >
              Alterar senha
            </button>
          </div>
        </form>
      </section>

      <section className="profile-panel profile-management-panel">
        <div className="profile-panel-header">
          <div>
            <h2 className="profile-panel-title">Meus endereços</h2>
            <p className="profile-page-subtitle">
              Mantenha endereço residencial, de cobrança e de entrega.
            </p>
          </div>
        </div>
        <div className="profile-management-list">
          {client.addresses.map((item) => (
            <article className="profile-management-item" key={item.id}>
              <div>
                <strong>{item.label || "Endereço sem apelido"}</strong>
                <p>{`${item.streetType} ${item.street}, ${item.number} — ${item.neighborhood}, ${item.city}/${item.state}`}</p>
                <small>{item.roles.join(" • ")}</small>
              </div>
              <div className="profile-info-actions">
                <button
                  type="button"
                  className="profile-icon-button"
                  onClick={() => {
                    setEditingId(item.id);
                    setAddressForm({ ...item });
                    setIsAddressFormOpen(true);
                  }}
                  aria-label="Editar endereço"
                  title="Editar endereço"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 16.5V20h3.5L18.3 9.2l-3.5-3.5L4 16.5Zm16.7-9.7a1 1 0 0 0 0-1.4l-2.1-2.1a1 1 0 0 0-1.4 0l-1.6 1.6 3.5 3.5 1.6-1.6Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="profile-icon-button profile-icon-button--danger"
                  onClick={() => removeAddress(item.id)}
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
        {!isAddressFormOpen ? (
          <div className="profile-info-actions">
            <button
              data-cy="open-address-form"
              type="button"
              className="order-card-action order-card-action-primary"
              onClick={() => {
                setEditingId(null);
                setAddressForm(blankAddress);
                setIsAddressFormOpen(true);
              }}
            >
              Adicionar novo endereço
            </button>
          </div>
        ) : null}
        {isAddressFormOpen ? (
          <form className="profile-info-form" onSubmit={saveAddress}>
            <h3 className="profile-form-section-title">
              {editingId ? "Editar endereço" : "Adicionar endereço"}
            </h3>
            <div className="profile-info-grid">
              <label className="profile-field">
                <span>Apelido</span>
                <input
                  value={addressForm.label}
                  onChange={(event) =>
                    setAddressForm({
                      ...addressForm,
                      label: event.target.value,
                    })
                  }
                />
              </label>
              <label className="profile-field">
                <span>Tipo de residência</span>
                <select
                  required
                  value={addressForm.residenceType}
                  onChange={(event) =>
                    setAddressForm({
                      ...addressForm,
                      residenceType: event.target.value,
                    })
                  }
                >
                  <option value="" disabled>
                    Selecione
                  </option>
                  {residenceTypes.map((residenceType) => (
                    <option key={residenceType} value={residenceType}>{residenceType}</option>
                  ))}
                </select>
              </label>
              <label className="profile-field">
                <span>Tipo de logradouro</span>
                <select
                  required
                  value={addressForm.streetType}
                  onChange={(event) =>
                    setAddressForm({
                      ...addressForm,
                      streetType: event.target.value,
                    })
                  }
                >
                  <option value="" disabled>
                    Selecione
                  </option>
                  {streetTypes.map((streetType) => (
                    <option key={streetType} value={streetType}>{streetType}</option>
                  ))}
                </select>
              </label>
              <label className="profile-field">
                <span>Logradouro</span>
                <input
                  required
                  value={addressForm.street}
                  onChange={(event) =>
                    setAddressForm({
                      ...addressForm,
                      street: event.target.value,
                    })
                  }
                />
              </label>
              <label className="profile-field">
                <span>Número</span>
                <input
                  required
                  value={addressForm.number}
                  onChange={(event) =>
                    setAddressForm({
                      ...addressForm,
                      number: event.target.value,
                    })
                  }
                />
              </label>
              <label className="profile-field">
                <span>Bairro</span>
                <input
                  required
                  value={addressForm.neighborhood}
                  onChange={(event) =>
                    setAddressForm({
                      ...addressForm,
                      neighborhood: event.target.value,
                    })
                  }
                />
              </label>
              <label className="profile-field">
                <span>CEP</span>
                <input
                  required
                  value={addressForm.zipCode}
                  onChange={(event) => void updateAddressZipCode(event.target.value)}
                  aria-busy={isLookingUpZipCode}
                />
              </label>
              <label className="profile-field">
                <span>Cidade</span>
                <input
                  required
                  value={addressForm.city}
                  onChange={(event) =>
                    setAddressForm({ ...addressForm, city: event.target.value })
                  }
                />
              </label>
              <label className="profile-field">
                <span>Estado</span>
                <select
                  required
                  value={addressForm.state}
                  onChange={(event) =>
                    setAddressForm({
                      ...addressForm,
                      state: event.target.value,
                    })
                  }
                >
                  <option value="" disabled>Selecione</option>
                  {brazilianStates.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </label>
              <label className="profile-field">
                <span>País</span>
                <select
                  required
                  value={addressForm.country}
                  onChange={(event) =>
                    setAddressForm({
                      ...addressForm,
                      country: event.target.value,
                    })
                  }
                >
                  <option value="" disabled>Selecione</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.name}>{country.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="profile-role-options">
              {roles.map((role) => (
                <label key={role}>
                  <input
                    type="checkbox"
                    checked={addressForm.roles.includes(role)}
                    onChange={(event) =>
                      setAddressForm({
                        ...addressForm,
                        roles: event.target.checked
                          ? [...addressForm.roles, role]
                          : addressForm.roles.filter((item) => item !== role),
                      })
                    }
                  />{" "}
                  {role}
                </label>
              ))}
            </div>
            <div className="profile-info-actions">
              <button
                type="submit"
                className="order-card-action order-card-action-primary"
              >
                {editingId ? "Salvar alterações" : "Adicionar endereço"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  className="order-card-action order-card-action-secondary"
                  onClick={() => {
                    setEditingId(null);
                    setAddressForm(blankAddress);
                    setIsAddressFormOpen(false);
                  }}
                >
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>
        ) : null}
      </section>

      <section className="profile-panel profile-management-panel">
        <div className="profile-panel-header">
          <div>
            <h2 className="profile-panel-title">Meus cartões</h2>
            <p className="profile-page-subtitle">
              Apenas os quatro últimos dígitos são exibidos.
            </p>
          </div>
        </div>
        <div className="profile-management-list">
          {client.cards.map((card) => (
            <article className="profile-management-item" key={card.id}>
              <div>
                <strong>
                  {card.brand} •••• {card.last4}
                </strong>
                <p>{card.holder}</p>
                <small>{card.preferred ? "Cartão preferencial" : ""}</small>
              </div>
              <div className="profile-info-actions">
                {!card.preferred ? (
                  <button
                    type="button"
                    className="order-card-action order-card-action-secondary"
                    onClick={() =>
                      updateCard(() =>
                        gateway.setPreferredCard(client.id, card.id),
                      )
                    }
                  >
                    Tornar preferencial
                  </button>
                ) : null}
                <button
                  type="button"
                  className="profile-icon-button profile-icon-button--danger"
                  onClick={() =>
                    updateCard(() => gateway.removeCard(client.id, card.id))
                  }
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
        {client.cards.length === 0 ? (
          <p className="profile-empty-state">
            Não existem cartões cadastrados.
          </p>
        ) : null}
        {!isCardFormOpen ? (
          <div className="profile-info-actions">
            <button
              data-cy="open-card-form"
              type="button"
              className="order-card-action order-card-action-primary"
              onClick={() => {
                setCardForm(blankCard);
                setIsCardFormOpen(true);
              }}
            >
              Adicionar novo cartão
            </button>
          </div>
        ) : null}
        {isCardFormOpen ? (
          <form className="profile-info-form" onSubmit={saveCard}>
            <h3 className="profile-form-section-title">Adicionar cartão</h3>
            <div className="profile-info-grid">
              <label className="profile-field">
                <span>Titular</span>
                <input
                  required
                  value={cardForm.holder}
                  onChange={(event) =>
                    setCardForm({ ...cardForm, holder: event.target.value })
                  }
                />
              </label>
              <label className="profile-field">
                <span>Número</span>
                <input
                  required
                  inputMode="numeric"
                  maxLength={19}
                  placeholder="13 a 19 dígitos"
                  value={cardForm.number}
                  onChange={(event) =>
                    setCardForm({ ...cardForm, number: event.target.value })
                  }
                />
              </label>
              <label className="profile-field">
                <span>Bandeira</span>
                <select
                  value={cardForm.brand}
                  onChange={(event) =>
                    setCardForm({ ...cardForm, brand: event.target.value })
                  }
                >
                  <option>Visa</option>
                  <option>Mastercard</option>
                  <option>Elo</option>
                  <option>American Express</option>
                </select>
              </label>
              <label className="profile-field">
                <span>CVV</span>
                <input
                  required
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="3 ou 4 dígitos"
                  value={cardForm.securityCode}
                  onChange={(event) =>
                    setCardForm({
                      ...cardForm,
                      securityCode: event.target.value,
                    })
                  }
                />
              </label>
            </div>
            <div className="profile-info-actions">
              <button
                type="submit"
                className="order-card-action order-card-action-primary"
              >
                Adicionar cartão
              </button>
              <button
                type="button"
                className="order-card-action order-card-action-secondary"
                onClick={() => {
                  setCardForm(blankCard);
                  setIsCardFormOpen(false);
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : null}
      </section>

      <section className="profile-panel" aria-labelledby="client-orders-title">
        <div className="profile-panel-header">
          <h2 id="client-orders-title" className="profile-panel-title">
            Meus pedidos
          </h2>
          <span className="profile-panel-meta">{orders.length} pedido(s)</span>
        </div>
        {orders.length ? (
          <div className="orders-list">
            {orders.map((order) => (
              <article key={order.id} className="order-card">
                <div className="order-card-header">
                  <div>
                    <strong className="order-card-number">
                      Pedido {order.number}
                    </strong>
                    <p className="order-card-date">{order.createdAt}</p>
                  </div>
                  <span className="order-card-status">{order.status}</span>
                </div>
                <div className="order-card-actions">
                  {["EM ABERTO", "EM PROCESSAMENTO"].includes(order.status) ? (
                    <button
                      type="button"
                      className="order-card-action order-card-action-secondary"
                      onClick={() => onCancelOrder(order.id)}
                    >
                      Cancelar pedido
                    </button>
                  ) : null}
                  {["ENTREGUE", "ITEM ENVIADO"].includes(order.status) ? (
                    <button
                      type="button"
                      className="order-card-action order-card-action-primary"
                      onClick={() => onConfirmOrderReceived(order.id)}
                    >
                      Confirmar recebimento
                    </button>
                  ) : null}
                  {order.status === "PEDIDO RECEBIDO" ? (
                    <button
                      type="button"
                      className="order-card-action order-card-action-secondary"
                      onClick={() => onRequestOrderExchange(order.id)}
                    >
                      Solicitar troca
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="profile-empty-state">
            <h3>Nenhum pedido realizado</h3>
            <p>Quando existirem transações, elas aparecerão aqui.</p>
          </div>
        )}
      </section>
    </section>
  );
}
