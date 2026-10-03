import "./StoreFooter.css";

const columns = [
  {
    title: "Institucional",
    links: [
      "Sobre a JoStore",
      "Nossas lojas",
      "Trabalhe conosco",
      "Sustentabilidade",
    ],
  },
  {
    title: "Ajuda",
    links: [
      "Central de atendimento",
      "Entregas e prazos",
      "Trocas e devoluções",
      "Formas de pagamento",
    ],
  },
  {
    title: "Sua conta",
    links: [
      "Meus pedidos",
      "Meus endereços",
      "Meus cartões",
      "Política de privacidade",
    ],
  },
];

type StoreFooterProps = { compact?: boolean };

export function StoreFooter({ compact = false }: StoreFooterProps) {
  if (compact) {
    return (
      <footer className="store-footer store-footer--compact" id="footer">
        <div className="store-footer-compact-content">
          <span className="store-footer-logo">JOSTORE</span>
          <span>© 2026 JoStore. Todos os direitos reservados.</span>
          <nav aria-label="Links institucionais">
            <a href="#footer">Ajuda</a>
            <a href="#footer">Trocas</a>
            <a href="#footer">Privacidade</a>
          </nav>
        </div>
      </footer>
    );
  }

  return (
    <footer className="store-footer">
      <div className="store-footer-main">
        <section className="store-footer-brand" aria-label="JoStore">
          <p className="store-footer-logo">JOSTORE</p>
          <p>Moda essencial para acompanhar o seu ritmo, todos os dias.</p>
          <a href="mailto:atendimento@jostore.com.br">
            atendimento@jostore.com.br
          </a>
          <span>Segunda a sexta, das 9h às 18h</span>
        </section>

        {columns.map((column) => (
          <section key={column.title} className="store-footer-column">
            <h2>{column.title}</h2>
            <ul>
              {column.links.map((link) => (
                <li key={link}>
                  <a href="#footer">{link}</a>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="store-footer-newsletter" aria-label="Newsletter">
          <h2>Receba novidades</h2>
          <p>Ofertas, lançamentos e inspirações direto no seu e-mail.</p>
          <form onSubmit={(event) => event.preventDefault()}>
            <label className="sr-only" htmlFor="footer-email">
              Seu e-mail
            </label>
            <input
              id="footer-email"
              type="email"
              placeholder="seuemail@exemplo.com"
            />
            <button type="submit">Inscrever</button>
          </form>
        </section>
      </div>

      <div className="store-footer-bottom" id="footer">
        <span>© 2026 JoStore. Todos os direitos reservados.</span>
        <span>CNPJ 00.000.000/0001-00 · São Paulo, SP</span>
        <div className="store-footer-social">
          <a href="#footer">Instagram</a>
          <a href="#footer">TikTok</a>
          <a href="#footer">Pinterest</a>
        </div>
      </div>
    </footer>
  );
}
