import { type FormEvent, useState } from "react";
import { CustomerGatewayError } from "../../services/customerGateway";
import { useCustomerGateway } from "../../services/useCustomerGateway";
import { PasswordField } from "../../components/PasswordField/PasswordField";
import type { ClientDetails, ToastState } from "../../types/store";
import "./LoginPage.css";

type Props = {
  onAuthenticated: (client: ClientDetails) => void;
  onCreateAccount: () => void;
  onShowToast: (toast: Exclude<ToastState, null>) => void;
};

export function LoginPage({
  onAuthenticated,
  onCreateAccount,
  onShowToast,
}: Props) {
  const gateway = useCustomerGateway();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      onAuthenticated(await gateway.authenticate(email, password));
    } catch (error) {
      onShowToast({
        variant: "error",
        title: "Não foi possível entrar",
        message:
          error instanceof CustomerGatewayError
            ? error.message
            : "Tente novamente em instantes.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="login-page" aria-labelledby="login-title">
      <form className="login-panel" onSubmit={submit}>
        <p className="login-eyebrow">JoStore</p>
        <h1 id="login-title">Entrar na sua conta</h1>
        <p>Use o e-mail e a senha cadastrados para acessar seu perfil.</p>
        <label>
          <span>E-mail</span>
          <input
            data-cy="login-email"
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          <span>Senha</span>
          <PasswordField
            data-cy="login-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button
          data-cy="login-submit"
          type="submit"
          className="login-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>
        <p className="login-register-copy">
          Ainda não possui uma conta?{" "}
          <button
            data-cy="login-create-account"
            type="button"
            onClick={onCreateAccount}
          >
            Cadastrar perfil
          </button>
        </p>
      </form>
    </section>
  );
}
