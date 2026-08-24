import { useEffect, useState, type FormEvent } from 'react'
import {
  customerCancelableStatuses,
  exchangeRequestStatuses,
} from '../../data/storeData'
import type {
  Order,
  ProfileSection,
  ToastState,
  UserProfile,
} from '../../types/store'
import { formatProfilePhone, getMaskedPassword, normalizeOrderStatus } from '../../utils/store'
import './ProfilePage.css'

type ProfilePageProps = {
  orders: Order[]
  userProfile: UserProfile
  isProfileRegistered: boolean
  activeSection: ProfileSection
  onSelectSection: (section: ProfileSection) => void
  onCancelOrder: (orderId: string) => void
  onConfirmOrderReceived: (orderId: string) => void
  onRequestOrderExchange: (orderId: string) => void
  onRegisterProfile: (profile: UserProfile) => void
  onUpdateProfile: (profile: UserProfile) => void
  onDeactivateProfile: () => void
  onShowToast: (toast: Exclude<ToastState, null>) => void
}

export function ProfilePage({
  orders,
  userProfile,
  isProfileRegistered,
  activeSection,
  onSelectSection,
  onCancelOrder,
  onConfirmOrderReceived,
  onRequestOrderExchange,
  onRegisterProfile,
  onUpdateProfile,
  onDeactivateProfile,
  onShowToast,
}: ProfilePageProps) {
  const [profileForm, setProfileForm] = useState(userProfile)
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    setProfileForm(userProfile)
    setConfirmPassword('')
  }, [userProfile])

  function canManageOrder(status: string) {
    return customerCancelableStatuses.includes(
      normalizeOrderStatus(status) as (typeof customerCancelableStatuses)[number],
    )
  }

  function canRequestExchange(status: string) {
    return exchangeRequestStatuses.includes(
      normalizeOrderStatus(status) as (typeof exchangeRequestStatuses)[number],
    )
  }

  function canConfirmReceipt(status: string) {
    const normalizedStatus = normalizeOrderStatus(status)
    return normalizedStatus === 'ENTREGUE' || normalizedStatus === 'ITEM ENVIADO'
  }

  const requiredFields = [
    { key: 'gender', label: 'Gênero' },
    { key: 'fullName', label: 'Nome completo' },
    { key: 'birthDate', label: 'Data de nascimento' },
    { key: 'cpf', label: 'CPF' },
    { key: 'phoneType', label: 'Tipo de telefone' },
    { key: 'phoneAreaCode', label: 'DDD' },
    { key: 'phoneNumber', label: 'Número do telefone' },
    { key: 'email', label: 'E-mail' },
    { key: 'password', label: 'Senha' },
    { key: 'residenceType', label: 'Tipo de residência' },
    { key: 'streetType', label: 'Tipo de logradouro' },
    { key: 'street', label: 'Logradouro' },
    { key: 'number', label: 'Número' },
    { key: 'neighborhood', label: 'Bairro' },
    { key: 'zipCode', label: 'CEP' },
    { key: 'city', label: 'Cidade' },
    { key: 'state', label: 'Estado' },
    { key: 'country', label: 'País' },
  ] as const

  function handleSubmitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const missingField = requiredFields.find(({ key }) => !profileForm[key].trim())

    if (missingField) {
      onShowToast({
        variant: 'error',
        title: 'Informações não salvas',
        message: `Preencha o campo ${missingField.label}.`,
      })
      return
    }

    onUpdateProfile(profileForm)
    onShowToast({
      variant: 'success',
      title: 'Informações atualizadas',
      message: 'Os dados do seu perfil foram atualizados com sucesso.',
    })
  }

  function handleRegisterProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const missingField = requiredFields.find(({ key }) => !profileForm[key].trim())

    if (missingField) {
      onShowToast({
        variant: 'error',
        title: 'Cadastro não concluído',
        message: `Preencha o campo ${missingField.label}.`,
      })
      return
    }

    if (profileForm.password !== confirmPassword) {
      onShowToast({
        variant: 'error',
        title: 'Cadastro não concluído',
        message: 'Os campos de senha e confirmar senha devem ser iguais.',
      })
      return
    }

    onRegisterProfile({
      ...profileForm,
      status: 'Ativo',
    })
    onShowToast({
      variant: 'success',
      title: 'Perfil cadastrado',
      message: 'Seu perfil foi criado com sucesso.',
    })
  }

  function handleDeactivateProfile() {
    onDeactivateProfile()
    onShowToast({
      variant: 'success',
      title: 'Perfil inativado',
      message: 'O perfil foi marcado como inativo.',
    })
  }

  const genderOptions = ['Feminino', 'Masculino', 'Não binário', 'Prefiro não informar']
  const phoneTypeOptions = ['Celular', 'Residencial', 'Comercial']
  const residenceOptions = ['Casa', 'Apartamento', 'Condomínio', 'Comercial', 'Outro']
  const streetOptions = ['Rua', 'Avenida', 'Praça', 'Alameda']

  const personalFields = (
    <>
      <div className="profile-form-section">
        <h3 className="profile-form-section-title">Informações pessoais</h3>
      </div>
      <label className="profile-field">
        <span>Nome completo</span>
        <input type="text" value={profileForm.fullName} onChange={(event) => setProfileForm((current) => ({ ...current, fullName: event.target.value }))} />
      </label>
      <label className="profile-field">
        <span>CPF</span>
        <input type="text" value={profileForm.cpf} onChange={(event) => setProfileForm((current) => ({ ...current, cpf: event.target.value }))} />
      </label>
      <label className="profile-field">
        <span>Data de nascimento</span>
        <input type="date" value={profileForm.birthDate} onChange={(event) => setProfileForm((current) => ({ ...current, birthDate: event.target.value }))} />
      </label>
      <label className="profile-field">
        <span>Gênero</span>
        <select value={profileForm.gender} onChange={(event) => setProfileForm((current) => ({ ...current, gender: event.target.value }))}>
          <option value="">Selecione</option>
          {genderOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
      <div className="profile-phone-row">
        <label className="profile-field">
          <span>Tipo de telefone</span>
          <select value={profileForm.phoneType} onChange={(event) => setProfileForm((current) => ({ ...current, phoneType: event.target.value }))}>
            <option value="">Selecione</option>
            {phoneTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="profile-field">
          <span>DDD</span>
          <input type="text" maxLength={2} value={profileForm.phoneAreaCode} onChange={(event) => setProfileForm((current) => ({ ...current, phoneAreaCode: event.target.value.replace(/\D/g, '') }))} />
        </label>
        <label className="profile-field">
          <span>Número</span>
          <input type="text" value={profileForm.phoneNumber} onChange={(event) => setProfileForm((current) => ({ ...current, phoneNumber: event.target.value.replace(/\D/g, '') }))} />
        </label>
      </div>
    </>
  )

  const loginFields = (
    <>
      <div className="profile-form-section">
        <h3 className="profile-form-section-title">Informações de login</h3>
      </div>
      <label className="profile-field">
        <span>E-mail</span>
        <input type="email" value={profileForm.email} onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))} />
      </label>
      <label className="profile-field">
        <span>Senha</span>
        <input type="password" value={profileForm.password} onChange={(event) => setProfileForm((current) => ({ ...current, password: event.target.value }))} />
      </label>
    </>
  )

  const registerLoginFields = (
    <>
      {loginFields}
      <label className="profile-field">
        <span>Confirmar senha</span>
        <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
      </label>
    </>
  )

  const addressFields = (
    <>
      <div className="profile-form-section">
        <h3 className="profile-form-section-title">Endereço</h3>
      </div>
      <label className="profile-field">
        <span>Tipo de residência</span>
        <select value={profileForm.residenceType} onChange={(event) => setProfileForm((current) => ({ ...current, residenceType: event.target.value }))}>
          <option value="">Selecione</option>
          {residenceOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
      <label className="profile-field">
        <span>Tipo de logradouro</span>
        <select value={profileForm.streetType} onChange={(event) => setProfileForm((current) => ({ ...current, streetType: event.target.value }))}>
          <option value="">Selecione</option>
          {streetOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
      <label className="profile-field">
        <span>Logradouro</span>
        <input type="text" value={profileForm.street} onChange={(event) => setProfileForm((current) => ({ ...current, street: event.target.value }))} />
      </label>
      <label className="profile-field">
        <span>Número</span>
        <input type="text" value={profileForm.number} onChange={(event) => setProfileForm((current) => ({ ...current, number: event.target.value }))} />
      </label>
      <label className="profile-field">
        <span>Bairro</span>
        <input type="text" value={profileForm.neighborhood} onChange={(event) => setProfileForm((current) => ({ ...current, neighborhood: event.target.value }))} />
      </label>
      <label className="profile-field">
        <span>Cidade</span>
        <input type="text" value={profileForm.city} onChange={(event) => setProfileForm((current) => ({ ...current, city: event.target.value }))} />
      </label>
      <label className="profile-field">
        <span>Estado</span>
        <input type="text" value={profileForm.state} onChange={(event) => setProfileForm((current) => ({ ...current, state: event.target.value }))} />
      </label>
      <label className="profile-field">
        <span>País</span>
        <input type="text" value={profileForm.country} onChange={(event) => setProfileForm((current) => ({ ...current, country: event.target.value }))} />
      </label>
      <label className="profile-field">
        <span>CEP</span>
        <input type="text" value={profileForm.zipCode} onChange={(event) => setProfileForm((current) => ({ ...current, zipCode: event.target.value }))} />
      </label>
      <label className="profile-field profile-field-full">
        <span>Observações</span>
        <input type="text" value={profileForm.addressNotes} onChange={(event) => setProfileForm((current) => ({ ...current, addressNotes: event.target.value }))} />
      </label>
    </>
  )

  if (!isProfileRegistered) {
    return (
      <section className="profile-page" aria-labelledby="profile-page-title">
        <div className="profile-page-header">
          <div>
            <h1 id="profile-page-title" className="profile-page-title">Meu perfil</h1>
            <p className="profile-page-subtitle">
              Faça o cadastro do seu perfil para acompanhar seus pedidos e futuras opções da sua conta.
            </p>
          </div>
        </div>

        <section className="profile-panel profile-register-panel" aria-labelledby="profile-register-title">
          <div className="profile-panel-header">
            <h2 id="profile-register-title" className="profile-panel-title">Cadastrar perfil</h2>
          </div>

          <form className="profile-info-form" onSubmit={handleRegisterProfile}>
            <div className="profile-info-grid">
              {personalFields}
              {registerLoginFields}
              {addressFields}
            </div>

            <div className="profile-info-actions">
              <button type="submit" className="order-card-action order-card-action-primary">
                Cadastrar perfil
              </button>
            </div>
          </form>
        </section>
      </section>
    )
  }

  return (
    <section className="profile-page" aria-labelledby="profile-page-title">
      <div className="profile-page-header">
        <div>
          <h1 id="profile-page-title" className="profile-page-title">Meu perfil</h1>
          <p className="profile-page-subtitle">Acompanhe seus pedidos e futuras opções da sua conta.</p>
        </div>
      </div>

      <div className="profile-layout">
        <aside className="profile-sidebar" aria-label="Opções do perfil">
          <button type="button" className={`profile-nav-button${activeSection === 'info' ? ' is-active' : ''}`} onClick={() => onSelectSection('info')}>
            Minhas informações
          </button>
          <button type="button" className={`profile-nav-button${activeSection === 'edit-info' ? ' is-active' : ''}`} onClick={() => onSelectSection('edit-info')}>
            Alterar informações
          </button>
          <button type="button" className={`profile-nav-button${activeSection === 'orders' ? ' is-active' : ''}`} onClick={() => onSelectSection('orders')}>
            Meus pedidos
          </button>
        </aside>

        <div className="profile-content">
          {activeSection === 'info' ? (
            <section className="profile-panel" aria-labelledby="profile-info-title">
              <div className="profile-panel-header">
                <h2 id="profile-info-title" className="profile-panel-title">Minhas informações</h2>
                <span className={`profile-status-badge${userProfile.status === 'Inativo' ? ' is-inactive' : ''}`}>
                  Perfil {userProfile.status.toLowerCase()}
                </span>
              </div>

              <div className="profile-info-grid profile-info-grid-readonly">
                <div className="profile-field"><span>Gênero</span><strong className="profile-field-value">{userProfile.gender}</strong></div>
                <div className="profile-field"><span>Nome completo</span><strong className="profile-field-value">{userProfile.fullName}</strong></div>
                <div className="profile-field"><span>Data de nascimento</span><strong className="profile-field-value">{new Date(`${userProfile.birthDate}T12:00:00`).toLocaleDateString('pt-BR')}</strong></div>
                <div className="profile-field"><span>E-mail</span><strong className="profile-field-value">{userProfile.email}</strong></div>
                <div className="profile-field"><span>Telefone</span><strong className="profile-field-value">{formatProfilePhone(userProfile)}</strong></div>
                <div className="profile-field"><span>CPF</span><strong className="profile-field-value">{userProfile.cpf}</strong></div>
                <div className="profile-field"><span>Senha</span><strong className="profile-field-value">{getMaskedPassword(userProfile.password)}</strong></div>
                <div className="profile-field"><span>Tipo de residência</span><strong className="profile-field-value">{userProfile.residenceType}</strong></div>
                <div className="profile-field"><span>Tipo de logradouro</span><strong className="profile-field-value">{userProfile.streetType}</strong></div>
                <div className="profile-field"><span>Logradouro</span><strong className="profile-field-value">{userProfile.street}</strong></div>
                <div className="profile-field"><span>Número</span><strong className="profile-field-value">{userProfile.number}</strong></div>
                <div className="profile-field"><span>Bairro</span><strong className="profile-field-value">{userProfile.neighborhood}</strong></div>
                <div className="profile-field"><span>CEP</span><strong className="profile-field-value">{userProfile.zipCode}</strong></div>
                <div className="profile-field"><span>Cidade</span><strong className="profile-field-value">{userProfile.city}</strong></div>
                <div className="profile-field"><span>Estado</span><strong className="profile-field-value">{userProfile.state}</strong></div>
                <div className="profile-field"><span>País</span><strong className="profile-field-value">{userProfile.country}</strong></div>
                <div className="profile-field profile-field-full"><span>Observações</span><strong className="profile-field-value">{userProfile.addressNotes || 'Não informado'}</strong></div>
              </div>
            </section>
          ) : null}

          {activeSection === 'orders' ? (
            <section className="profile-panel" aria-labelledby="profile-orders-title">
              <div className="profile-panel-header">
                <h2 id="profile-orders-title" className="profile-panel-title">Meus pedidos</h2>
                <span className="profile-panel-meta">{orders.length} pedido(s)</span>
              </div>

              {orders.length > 0 ? (
                <div className="orders-list">
                  {orders.map((order) => (
                    <article key={order.id} className="order-card">
                      <div className="order-card-header">
                        <div>
                          <strong className="order-card-number">Pedido {order.number}</strong>
                          <p className="order-card-date">{order.createdAt}</p>
                        </div>
                        <span className="order-card-status">{order.status}</span>
                      </div>

                      {canManageOrder(order.status) || canConfirmReceipt(order.status) ? (
                        <div className="order-card-actions">
                          {canManageOrder(order.status) ? (
                            <button type="button" className="order-card-action order-card-action-secondary" onClick={() => onCancelOrder(order.id)}>
                              Cancelar pedido
                            </button>
                          ) : null}
                          {canConfirmReceipt(order.status) ? (
                            <button type="button" className="order-card-action order-card-action-primary" onClick={() => onConfirmOrderReceived(order.id)}>
                              Confirmar recebimento
                            </button>
                          ) : null}
                        </div>
                      ) : null}

                      {canRequestExchange(order.status) ? (
                        <div className="order-card-actions">
                          <button type="button" className="order-card-action order-card-action-secondary" onClick={() => onRequestOrderExchange(order.id)}>
                            Solicitar troca
                          </button>
                        </div>
                      ) : null}

                      <div className="order-card-items">
                        {order.items.map((item) => (
                          <div key={`${order.id}-${item.id}`} className="order-item-row">
                            <div className={`order-item-media ${item.accent}`} aria-hidden="true">
                              {item.image ? <img src={item.image} alt={item.name} className="order-item-image" /> : <div className="product-card-placeholder" />}
                            </div>
                            <div className="order-item-copy">
                              <strong>{item.name}</strong>
                              <span>Quantidade: {item.quantity}</span>
                              <span>{item.shipping}</span>
                            </div>
                            <strong className="order-item-price">{item.totalPrice}</strong>
                          </div>
                        ))}
                      </div>

                      <div className="order-card-summary">
                        <div className="order-card-summary-row">
                          <span>Pagamento</span>
                          <strong>{order.paymentCards.map((card) => `${card.brand} final ${card.last4}`).join(' + ')}</strong>
                        </div>
                        <div className="order-card-summary-row">
                          <span>Entrega</span>
                          <strong>{order.address.label}</strong>
                        </div>
                        <div className="order-card-summary-row">
                          <span>Total</span>
                          <strong>{order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="profile-empty-state">
                  <h3>Nenhum pedido realizado ainda</h3>
                  <p>Assim que uma compra for concluída, ela aparecerá aqui.</p>
                </div>
              )}
            </section>
          ) : null}

          {activeSection === 'edit-info' ? (
            <section className="profile-panel" aria-labelledby="profile-edit-info-title">
              <div className="profile-panel-header">
                <h2 id="profile-edit-info-title" className="profile-panel-title">Alterar informações</h2>
                <span className={`profile-status-badge${userProfile.status === 'Inativo' ? ' is-inactive' : ''}`}>
                  Perfil {userProfile.status.toLowerCase()}
                </span>
              </div>

              <form className="profile-info-form" onSubmit={handleSubmitProfile}>
                <div className="profile-info-grid">
                  {personalFields}
                  {loginFields}
                  {addressFields}
                </div>

                <div className="profile-info-actions">
                  <button type="submit" className="order-card-action order-card-action-primary">
                    Salvar alterações
                  </button>
                  <button type="button" className="order-card-action order-card-action-secondary" onClick={handleDeactivateProfile}>
                    Inativar perfil
                  </button>
                </div>
              </form>
            </section>
          ) : null}
        </div>
      </div>
    </section>
  )
}
