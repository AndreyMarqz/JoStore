import { type FormEvent, useState } from "react";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import { PasswordField } from "../../components/PasswordField/PasswordField";
import { CustomerGatewayError } from "../../services/customerGateway";
import { useCustomerGateway } from "../../services/useCustomerGateway";
import type { AddressRole, ClientDetails, ToastState } from "../../types/store";
import {
  createEmptyClientRegistration,
  validateClientRegistration,
} from "../../utils/clientRegistration";
import "./ProfilePage.css";

type Props = {
  onRegistered: (client: ClientDetails) => void;
  onBackToLogin: () => void;
  onShowToast: (toast: Exclude<ToastState, null>) => void;
};
const steps = [
  "Informações pessoais",
  "Acesso e segurança",
  "Endereço principal",
];
const genders = [
  "Feminino",
  "Masculino",
  "Não binário",
  "Prefiro não informar",
];
const phoneTypes = ["Celular", "Residencial", "Comercial"];
const residences = ["Casa", "Apartamento", "Condomínio", "Comercial", "Outro"];
const streets = ["Rua", "Avenida", "Praça", "Alameda"];
const addressRoles: AddressRole[] = ["Residência", "Cobrança", "Entrega"];

export function ClientRegistrationPage({
  onRegistered,
  onBackToLogin,
  onShowToast,
}: Props) {
  const gateway = useCustomerGateway();
  const [form, setForm] = useState(createEmptyClientRegistration);
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const address = form.addresses[0];

  function report(message: string) {
    onShowToast({ variant: "error", title: "Cadastro não concluído", message });
  }
  function updateAddress(field: keyof typeof address, value: string) {
    setForm((current) => ({
      ...current,
      addresses: [{ ...current.addresses[0], [field]: value }],
    }));
  }
  function toggleAddressRole(role: AddressRole, checked: boolean) {
    setForm((current) => {
      const currentAddress = current.addresses[0];
      const roles = checked
        ? [...currentAddress.roles, role]
        : currentAddress.roles.filter((item) => item !== role);

      return { ...current, addresses: [{ ...currentAddress, roles }] };
    });
  }

  function validateCurrentStep() {
    if (activeStep === 0) {
      if (!form.fullName.trim()) return "Preencha o nome completo.";
      if (!form.gender.trim()) return "Selecione o gênero.";
      if (!form.birthDate) return "Preencha a data de nascimento.";
      if (!form.cpf.trim()) return "Preencha o CPF.";
      if (!form.phone.type || !form.phone.areaCode || !form.phone.number)
        return "Preencha todos os dados de telefone.";
    }
    if (activeStep === 1) {
      if (!form.email.trim()) return "Preencha o e-mail.";
      if (
        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/.test(form.password)
      )
        return "A senha deve ter ao menos 8 caracteres, letra maiúscula, minúscula e caractere especial.";
      if (form.password !== form.confirmPassword)
        return "Os campos de senha e confirmação devem ser iguais.";
    }
    if (activeStep === 2) return validateClientRegistration(form);
    return null;
  }

  function nextStep() {
    const error = validateCurrentStep();
    if (error) {
      report(error);
      return;
    }
    setActiveStep((step) => step + 1);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateCurrentStep();
    if (error) {
      report(error);
      return;
    }
    try {
      setIsSubmitting(true);
      const client = await gateway.createClient(form);
      onRegistered(client);
      onShowToast({
        variant: "success",
        title: "Cliente cadastrado",
        message: `Cadastro concluído. Seu código é ${client.code}.`,
      });
    } catch (error) {
      report(
        error instanceof CustomerGatewayError
          ? error.message
          : "Não foi possível concluir o cadastro. Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      className="profile-page"
      aria-labelledby="client-registration-title"
    >
      <div className="profile-page-header">
        <h1 id="client-registration-title" className="profile-page-title">
          Cadastrar perfil
        </h1>
        <p className="profile-page-subtitle">
          Conclua as três etapas para criar sua conta.
        </p>
      </div>
      <section className="profile-panel profile-register-panel">
        <Stepper
          activeStep={activeStep}
          alternativeLabel
          className="registration-stepper"
        >
          {steps.map((step) => (
            <Step key={step}>
              <StepLabel
                slotProps={{
                  stepIcon: {
                    sx: {
                      "&.Mui-active .MuiStepIcon-text, &.Mui-completed .MuiStepIcon-text":
                        { fill: "#ffffff !important" },
                    },
                  },
                }}
              >
                {step}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
        <form className="profile-info-form" onSubmit={submit} noValidate>
          <div key={activeStep} className="registration-step-content">
            {activeStep === 0 ? (
              <div className="profile-info-grid">
                <div className="profile-form-section">
                  <h2 className="profile-form-section-title">
                    Informações pessoais
                  </h2>
                </div>
                <label className="profile-field">
                  <span>Nome completo</span>
                  <input
                    data-cy="client-full-name"
                    value={form.fullName}
                    onChange={(event) =>
                      setForm({ ...form, fullName: event.target.value })
                    }
                  />
                </label>
                <label className="profile-field">
                  <span>CPF</span>
                  <input
                    data-cy="client-cpf"
                    inputMode="numeric"
                    value={form.cpf}
                    onChange={(event) =>
                      setForm({ ...form, cpf: event.target.value })
                    }
                  />
                </label>
                <label className="profile-field">
                  <span>Data de nascimento</span>
                  <input
                    data-cy="client-birth-date"
                    type="date"
                    value={form.birthDate}
                    onChange={(event) =>
                      setForm({ ...form, birthDate: event.target.value })
                    }
                  />
                </label>
                <label className="profile-field">
                  <span>Gênero</span>
                  <select
                    data-cy="client-gender"
                    value={form.gender}
                    onChange={(event) =>
                      setForm({ ...form, gender: event.target.value })
                    }
                  >
                    <option value="">Selecione</option>
                    {genders.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <div className="profile-phone-row">
                  <label className="profile-field">
                    <span>Tipo de telefone</span>
                    <select
                      data-cy="client-phone-type"
                      value={form.phone.type}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          phone: { ...form.phone, type: event.target.value },
                        })
                      }
                    >
                      <option value="">Selecione</option>
                      {phoneTypes.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <label className="profile-field">
                    <span>DDD</span>
                    <input
                      data-cy="client-phone-ddd"
                      maxLength={2}
                      value={form.phone.areaCode}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          phone: {
                            ...form.phone,
                            areaCode: event.target.value.replace(/\D/g, ""),
                          },
                        })
                      }
                    />
                  </label>
                  <label className="profile-field">
                    <span>Número</span>
                    <input
                      data-cy="client-phone-number"
                      value={form.phone.number}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          phone: {
                            ...form.phone,
                            number: event.target.value.replace(/\D/g, ""),
                          },
                        })
                      }
                    />
                  </label>
                </div>
              </div>
            ) : null}
            {activeStep === 1 ? (
              <div className="profile-info-grid">
                <div className="profile-form-section">
                  <h2 className="profile-form-section-title">
                    Acesso e segurança
                  </h2>
                </div>
                <label className="profile-field">
                  <span>E-mail</span>
                  <input
                    data-cy="client-email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm({ ...form, email: event.target.value })
                    }
                  />
                </label>
                <label className="profile-field">
                  <span>Senha</span>
                  <PasswordField
                    data-cy="client-password"
                    value={form.password}
                    onChange={(event) =>
                      setForm({ ...form, password: event.target.value })
                    }
                  />
                </label>
                <label className="profile-field">
                  <span>Confirmar senha</span>
                  <PasswordField
                    data-cy="client-confirm-password"
                    value={form.confirmPassword}
                    onChange={(event) =>
                      setForm({ ...form, confirmPassword: event.target.value })
                    }
                  />
                </label>
              </div>
            ) : null}
            {activeStep === 2 ? (
              <>
                <div className="profile-info-grid">
                  <div className="profile-form-section">
                    <h2 className="profile-form-section-title">
                      Endereço principal
                    </h2>
                  </div>
                  <label className="profile-field">
                    <span>Nome do endereço</span>
                    <input
                      data-cy="client-address-label"
                      value={address.label ?? ""}
                      onChange={(event) =>
                        updateAddress("label", event.target.value)
                      }
                    />
                  </label>
                  <label className="profile-field">
                    <span>Tipo de residência</span>
                    <select
                      data-cy="client-address-residence-type"
                      value={address.residenceType}
                      onChange={(event) =>
                        updateAddress("residenceType", event.target.value)
                      }
                    >
                      <option value="">Selecione</option>
                      {residences.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <label className="profile-field">
                    <span>Tipo de logradouro</span>
                    <select
                      data-cy="client-address-street-type"
                      value={address.streetType}
                      onChange={(event) =>
                        updateAddress("streetType", event.target.value)
                      }
                    >
                      <option value="">Selecione</option>
                      {streets.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <label className="profile-field">
                    <span>Logradouro</span>
                    <input
                      data-cy="client-address-street"
                      value={address.street}
                      onChange={(event) =>
                        updateAddress("street", event.target.value)
                      }
                    />
                  </label>
                  <label className="profile-field">
                    <span>Número</span>
                    <input
                      data-cy="client-address-number"
                      value={address.number}
                      onChange={(event) =>
                        updateAddress("number", event.target.value)
                      }
                    />
                  </label>
                  <label className="profile-field">
                    <span>Bairro</span>
                    <input
                      data-cy="client-address-neighborhood"
                      value={address.neighborhood}
                      onChange={(event) =>
                        updateAddress("neighborhood", event.target.value)
                      }
                    />
                  </label>
                  <label className="profile-field">
                    <span>CEP</span>
                    <input
                      data-cy="client-address-zip-code"
                      value={address.zipCode}
                      onChange={(event) =>
                        updateAddress("zipCode", event.target.value)
                      }
                    />
                  </label>
                  <label className="profile-field">
                    <span>Cidade</span>
                    <input
                      data-cy="client-address-city"
                      value={address.city}
                      onChange={(event) =>
                        updateAddress("city", event.target.value)
                      }
                    />
                  </label>
                  <label className="profile-field">
                    <span>Estado</span>
                    <input
                      data-cy="client-address-state"
                      value={address.state}
                      onChange={(event) =>
                        updateAddress("state", event.target.value)
                      }
                    />
                  </label>
                  <label className="profile-field">
                    <span>País</span>
                    <input
                      data-cy="client-address-country"
                      value={address.country}
                      onChange={(event) =>
                        updateAddress("country", event.target.value)
                      }
                    />
                  </label>
                  <label className="profile-field profile-field-full">
                    <span>Observações</span>
                    <input
                      data-cy="client-address-notes"
                      value={address.notes ?? ""}
                      onChange={(event) =>
                        updateAddress("notes", event.target.value)
                      }
                    />
                  </label>
                </div>
                <fieldset className="profile-role-options">
                  <legend>Este endereço será usado para</legend>
                  {addressRoles.map((role) => (
                    <label key={role}>
                      <input
                        data-cy={`client-address-role-${role}`}
                        type="checkbox"
                        checked={address.roles.includes(role)}
                        onChange={(event) =>
                          toggleAddressRole(role, event.target.checked)
                        }
                      />{" "}
                      {role}
                    </label>
                  ))}
                </fieldset>
              </>
            ) : null}
          </div>
          <div className="profile-info-actions">
            {activeStep > 0 ? (
              <button
                type="button"
                className="order-card-action order-card-action-secondary"
                onClick={() => setActiveStep((step) => step - 1)}
              >
                Voltar
              </button>
            ) : null}
            {activeStep < steps.length - 1 ? (
              <button
                data-cy="client-registration-next"
                type="button"
                className="order-card-action order-card-action-primary"
                onClick={nextStep}
              >
                Continuar
              </button>
            ) : (
              <button
                data-cy="client-register-submit"
                type="submit"
                className="order-card-action order-card-action-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Cadastrando..." : "Cadastrar perfil"}
              </button>
            )}
          </div>
          <p className="registration-login-copy">
            Já tem conta?{" "}
            <button
              data-cy="registration-back-to-login"
              type="button"
              onClick={onBackToLogin}
            >
              Entrar na sua conta
            </button>
          </p>
        </form>
      </section>
    </section>
  );
}
