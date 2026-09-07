import { useEffect, useState } from "react";
import "./StoreHeader.css";

type StoreHeaderProps = {
  cartItemsCount: number;
  isOverlay?: boolean;
  onHome: () => void;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  onOpenProfile: () => void;
};

export function StoreHeader({
  cartItemsCount,
  isOverlay = false,
  onHome,
  onOpenCart,
  onOpenAdmin,
  onOpenProfile,
}: StoreHeaderProps) {
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia("(max-width: 520px)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(max-width: 520px)");
    const update = () => setIsMobile(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return (
    <header
      className={`store-header${isOverlay ? " store-header-overlay" : ""}`}
    >
      <button
        type="button"
        className="store-brand"
        aria-label="JoStore home"
        onClick={onHome}
      >
        JoStore
      </button>
      <form className="store-search" role="search">
        <label className="sr-only" htmlFor="store-search-input">
          Buscar produtos
        </label>
        <svg className="search-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M10.5 4a6.5 6.5 0 1 0 4.03 11.6l4.43 4.43 1.4-1.4-4.43-4.43A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z" />
        </svg>
        <input
          id="store-search-input"
          type="search"
          placeholder={isMobile ? "Buscar" : "O que deseja procurar hoje?"}
        />
      </form>
      <nav className="store-actions" aria-label="Ações rápidas">
        <button
          data-cy="header-cart"
          type="button"
          className="icon-button"
          aria-label="Carrinho"
          onClick={onOpenCart}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 5h2.2l1.1 5.2A2 2 0 0 0 8.26 12H17a2 2 0 0 0 1.95-1.55L20 6H7.1" />
            <circle cx="9" cy="19" r="1.6" />
            <circle cx="17" cy="19" r="1.6" />
          </svg>
          {cartItemsCount > 0 ? (
            <span className="cart-count-badge" aria-hidden="true">
              {cartItemsCount}
            </span>
          ) : null}
        </button>
        <button
          data-cy="header-admin"
          type="button"
          className="icon-button"
          aria-label="Configurações"
          onClick={onOpenAdmin}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2m0-14-2 2M7 17l-2 2" />
          </svg>
        </button>
        <button
          data-cy="header-profile"
          type="button"
          className="icon-button"
          aria-label="Perfil"
          onClick={onOpenProfile}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.31 0-6 2.24-6 5v1h12v-1c0-2.76-2.69-5-6-5Z" />
          </svg>
        </button>
      </nav>
    </header>
  );
}
