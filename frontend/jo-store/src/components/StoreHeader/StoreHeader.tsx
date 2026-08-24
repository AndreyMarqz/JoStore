import './StoreHeader.css'

type StoreHeaderProps = {
  cartItemsCount: number
  onHome: () => void
  onOpenCart: () => void
  onOpenAdmin: () => void
  onOpenProfile: () => void
}

export function StoreHeader({
  cartItemsCount,
  onHome,
  onOpenCart,
  onOpenAdmin,
  onOpenProfile,
}: StoreHeaderProps) {
  return (
    <header className="store-header">
      <button type="button" className="store-brand" aria-label="JoStore home" onClick={onHome}>
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
          placeholder="Buscar roupas, categorias e estilos"
        />
      </form>

      <nav className="store-actions" aria-label="Ações rápidas">
        <button type="button" className="icon-button" aria-label="Carrinho" onClick={onOpenCart}>
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

        <button type="button" className="icon-button" aria-label="Configurações" onClick={onOpenAdmin}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 8.75A3.25 3.25 0 1 0 12 15.25A3.25 3.25 0 0 0 12 8.75Z" />
            <path d="M19.43 12.98a7.96 7.96 0 0 0 .04-.98 7.96 7.96 0 0 0-.04-.98l2.02-1.58a.5.5 0 0 0 .12-.64l-1.91-3.3a.5.5 0 0 0-.6-.22l-2.39.96a7.8 7.8 0 0 0-1.7-.98l-.36-2.54a.5.5 0 0 0-.49-.42h-3.82a.5.5 0 0 0-.49.42l-.36 2.54c-.6.23-1.16.56-1.7.98l-2.39-.96a.5.5 0 0 0-.6.22L2.4 8.8a.5.5 0 0 0 .12.64l2.02 1.58a7.96 7.96 0 0 0-.04.98c0 .33.02.66.04.98L2.52 14.56a.5.5 0 0 0-.12.64l1.91 3.3a.5.5 0 0 0 .6.22l2.39-.96c.53.42 1.1.75 1.7.98l.36 2.54a.5.5 0 0 0 .49.42h3.82a.5.5 0 0 0 .49-.42l.36-2.54c.6-.23 1.16-.56 1.7-.98l2.39.96a.5.5 0 0 0 .6-.22l1.91-3.3a.5.5 0 0 0-.12-.64l-2.02-1.58Z" />
          </svg>
        </button>

        <button type="button" className="icon-button" aria-label="Perfil" onClick={onOpenProfile}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.31 0-6 2.24-6 5v1h12v-1c0-2.76-2.69-5-6-5Z" />
          </svg>
        </button>
      </nav>
    </header>
  )
}
