import type { ToastState } from "../../types/store";
import "./Toast.css";

type ToastProps = {
  toast: ToastState;
};

export function Toast({ toast }: ToastProps) {
  if (!toast) {
    return null;
  }

  return (
    <div
      className={`cart-toast cart-toast-${toast.variant}`}
      role="status"
      aria-live="polite"
    >
      <strong className="cart-toast-title">{toast.title}</strong>
      <span className="cart-toast-message">{toast.message}</span>
    </div>
  );
}
