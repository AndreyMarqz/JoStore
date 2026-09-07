import { useState } from "react";
import "./ChatbotWidget.css";

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`chatbot-shell${isOpen ? " is-open" : ""}`}>
      {isOpen ? (
        <section className="chatbot-panel" aria-labelledby="chatbot-title">
          <div className="chatbot-header">
            <div>
              <h2 id="chatbot-title" className="chatbot-title">
                JoStore AI
              </h2>
            </div>
            <button
              type="button"
              className="chatbot-close"
              aria-label="Fechar chatbot"
              onClick={() => setIsOpen(false)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6 18 18" />
                <path d="M18 6 6 18" />
              </svg>
            </button>
          </div>

          <div className="chatbot-messages" />

          <div className="chatbot-input-row">
            <input
              type="text"
              className="chatbot-input"
              placeholder="Digite sua mensagem"
            />
            <button
              type="button"
              className="chatbot-send"
              aria-label="Enviar mensagem"
              disabled
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 3 10 14" />
                <path d="m21 3-7 18-4-7-7-4 18-7Z" />
              </svg>
            </button>
          </div>
        </section>
      ) : null}

      <button
        type="button"
        className="chatbot-toggle"
        aria-label="Abrir chatbot"
        onClick={() => setIsOpen((value) => !value)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3v3" />
          <path d="M9 3h6" />
          <rect x="5" y="6.5" width="14" height="11" rx="3.2" />
          <circle cx="9.5" cy="11.5" r="1" />
          <circle cx="14.5" cy="11.5" r="1" />
          <path d="M9 15h6" />
          <path d="M7 20v-2.5" />
          <path d="M17 20v-2.5" />
          <path d="M5 10H3.5" />
          <path d="M20.5 10H19" />
        </svg>
      </button>
    </div>
  );
}
