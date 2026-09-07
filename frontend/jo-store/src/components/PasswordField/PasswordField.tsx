import { type InputHTMLAttributes, useState } from "react";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import "./PasswordField.css";

type PasswordFieldProps = InputHTMLAttributes<HTMLInputElement>;

export function PasswordField({ className, ...props }: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span className="password-field">
      <input
        {...props}
        className={className}
        type={isVisible ? "text" : "password"}
      />
      <button
        type="button"
        className="password-field-toggle"
        aria-label={isVisible ? "Ocultar senha" : "Mostrar senha"}
        onClick={() => setIsVisible((current) => !current)}
      >
        {isVisible ? (
          <VisibilityOffOutlinedIcon aria-hidden="true" fontSize="small" />
        ) : (
          <VisibilityOutlinedIcon aria-hidden="true" fontSize="small" />
        )}
      </button>
    </span>
  );
}
