import { useEffect, useState, useRef } from "react";
import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import { useUI } from "../lib/ui";
import { LANDING_COPY as COPY, BOT_URL } from "../i18n";
import { LanguageSelect } from "../components/LanguageSelect";

// ── Network Logos ──────────────────────────────────────────────────────────
const NetworkLogos: Record<string, () => ReactElement> = {
  TON: () => (
    <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M28 0C12.536 0 0 12.536 0 28s12.536 28 28 28 28-12.536 28-28S43.464 0 28 0z" fill="#0088CC"/>
      <path d="M37.5 15h-19a2 2 0 00-1.6 3.2L27 32.333V41a1 1 0 001.5.866l4-2.308A1 1 0 0033 38.693V32.333L44.1 18.2A2 2 0 0042.5 15h-5z" fill="white"/>
      <path d="M28 15h9.5L28 28.5 18.5 15H28z" fill="white" opacity="0.6"/>
    </svg>
  ),
  TRON: () => (
    <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="28" fill="#FF0013"/>
      <path d="M40.5 22.5L27 10 8 23.5l7.5 23H40l.5-24z" fill="white" opacity="0.15"/>
      <path d="M27 10L8 23.5l9 2.5L27 10z" fill="white"/>
      <path d="M27 10l12 15-3 1.5L27 10z" fill="white" opacity="0.8"/>
      <path d="M17 26l10 20 10-20H17z" fill="white"/>
      <path d="M17 26l10 20V26H17z" fill="white" opacity="0.7"/>
    </svg>
  ),
  SOLANA: () => (
    <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="28" fill="#131313"/>
      <defs>
        <linearGradient id="sol-a" x1="12" y1="38" x2="44" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9945FF"/>
          <stop offset="50%" stopColor="#14F195"/>
          <stop offset="100%" stopColor="#00C2FF"/>
        </linearGradient>
      </defs>
      <path d="M14 33.5h22.5a1 1 0 00.7-.3l3.8-3.8a1 1 0 00-.7-1.7H17.8a1 1 0 00-.7.3l-3.8 3.8a1 1 0 00.7 1.7z" fill="url(#sol-a)"/>
      <path d="M14 22.3h22.5a1 1 0 00.7-.3l3.8-3.8A1 1 0 0040.3 17H17.8a1 1 0 00-.7.3l-3.8 3.8a1 1 0 00.7 1.7l-.7.5z" fill="url(#sol-a)"/>
      <path d="M14 27.9h22.5a1 1 0 01.7.3l3.8 3.8a1 1 0 01-.7 1.7H17.8a1 1 0 01-.7-.3l-3.8-3.8a1 1 0 01.7-1.7z" fill="url(#sol-a)" opacity="0"/>
      <path d="M37.3 28.3 14 28.3a1 1 0 00-.7 1.7l3.8 3.8a1 1 0 00.7.3h22.5a1 1 0 00.7-1.7L37.3 28.6a1 1 0 00-.7-.3h1z" fill="url(#sol-a)" opacity="0"/>
      <g fill="url(#sol-a)">
        <rect x="13" y="17" width="30" height="4" rx="1"/>
        <rect x="13" y="26" width="30" height="4" rx="1"/>
        <rect x="13" y="35" width="30" height="4" rx="1"/>
      </g>
    </svg>
  ),
  BASE: () => (
    <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="28" fill="#0052FF"/>
      <path d="M28 10C18.06 10 10 18.06 10 28c0 9.94 8.06 18 18 18 9.94 0 18-8.06 18-18 0-9.94-8.06-18-18-18zm0 32.73C19.41 42.73 12.27 35.59 12.27 27S19.41 11.27 28 11.27 43.73 18.41 43.73 27 36.59 42.73 28 42.73z" fill="white"/>
    </svg>
  ),
  ARBITRUM: () => (
    <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="28" fill="#213147"/>
      <path d="M28 8L11 37.5 28 48l17-10.5L28 8z" fill="#12AAFF" opacity="0.2"/>
      <path d="M28 8l-8.5 29.5L28 48V8z" fill="#12AAFF" opacity="0.4"/>
      <path d="M21 25l7-17 7 17-7 4-7-4z" fill="#12AAFF"/>
      <path d="M16 36l5-11 7 4-12 7z" fill="#9DCCED"/>
      <path d="M40 36l-5-11-7 4 12 7z" fill="#9DCCED"/>
    </svg>
  ),
  BSC: () => (
    <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="28" fill="#F3BA2F"/>
      <path d="M28 12l4 4-4 4-4-4 4-4zM17 23l4 4-4 4-4-4 4-4zM28 23l4 4-4 4-4-4 4-4zM39 23l4 4-4 4-4-4 4-4zM22 28l4-4 4 4-4 4-4-4zM28 34l4 4-4 4-4-4 4-4z" fill="white"/>
    </svg>
  ),
};

function useReveal() {
  const refs = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
          }
        });
      },
      { threshold: 0.1 }
    );
    refs.current.forEach((ref) => ref && observer.observe(ref));
    return () => observer.disconnect();
  }, []);
  return (el: HTMLElement | null) => {
    if (el && !refs.current.includes(el)) refs.current.push(el);
  };
}

export function LandingPage() {
  const { language, setLanguage } = useUI();
  const copy = COPY[language];
  const [openFaq, setOpenFaq] = useState(0);
  const reveal = useReveal();

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

  useEffect(() => {
    document.documentElement.dataset.theme = "dark";
  }, []);

  return (
    <main className="lend-page">
      <div className="lend-backdrop lend-backdrop--grid" />
      <div className="lend-backdrop lend-backdrop--glow lend-backdrop--left" />
      <div className="lend-backdrop lend-backdrop--glow lend-backdrop--right" />

      <div className="lend-shell">
        <header className="lend-topbar">
          <div className="lend-topbar-main">
            <Link className="lend-brand" to="/">
              <strong>recv</strong>
            </Link>

            <div className="lend-topbar-actions">
              <LanguageSelect value={language} onChange={setLanguage} ariaLabel="language switcher" compact className="lend-language" />
            </div>
          </div>
        </header>

        <section className="lend-hero" ref={reveal}>
          <div className="lend-hero-copy">
            <h1 className="lend-reveal--1">{copy.hero.title}</h1>
            <p className="lend-reveal--2">{copy.hero.body}</p>
            <p className="lend-hero-subcopy lend-reveal--2">{copy.hero.subcopy}</p>

            <div className="lend-cta-row lend-reveal--3">
              <Link className="lend-primary" to="/auth">
                {copy.hero.primary}
              </Link>
              <a className="lend-secondary" href={BOT_URL} target="_blank" rel="noreferrer">
                {copy.hero.secondary}
              </a>
            </div>

          </div>

          <aside className="lend-hero-side lend-reveal--3" aria-label={copy.heroPanel.title}>
            <div className="lend-hero-panel">
              <div className="lend-panel-heading">
                <h2>{copy.heroPanel.title}</h2>
                <p>{copy.heroPanel.body}</p>
              </div>

              <div className="lend-panel-actions">
                <Link className="lend-primary" to="/checkout/demo">
                  {copy.heroPanel.primary}
                </Link>
                <Link className="lend-secondary" to="/auth">
                  {copy.heroPanel.secondary}
                </Link>
              </div>
            </div>
          </aside>
        </section>

        <section id="overview" className="lend-split-section" ref={reveal}>
          <div className="lend-section-copy lend-reveal--1">
            <span className="lend-section-kicker">{copy.overview.kicker}</span>
            <h2>{copy.overview.title}</h2>
            <p>{copy.overview.body}</p>
          </div>

          <div className="lend-overview-grid lend-reveal--2">
            {copy.overview.cards.map((card) => (
              <article key={card.title} className="lend-card lend-card--overview lend-spotlight-card" onMouseMove={handleMouseMove}>
                <div className="lend-card-spotlight" />
                <div className="lend-dogfood-glow" />
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="capabilities" className="lend-stacked-section" ref={reveal}>
          <div className="lend-section-copy lend-reveal--1">
            <span className="lend-section-kicker">{copy.capabilities.kicker}</span>
            <h2>{copy.capabilities.title}</h2>
            <p>{copy.capabilities.body}</p>
          </div>

          <div className="lend-feature-grid lend-feature-grid--expanded lend-reveal--2">
            {copy.capabilities.items.map((feature, index) => (
              <article key={feature.title} className="lend-card lend-card--feature lend-spotlight-card" onMouseMove={handleMouseMove}>
                <div className="lend-card-spotlight" />
                <div className="lend-dogfood-glow" />
                <span>{feature.kicker}</span>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lend-compare" ref={reveal}>
          <div className="lend-section-copy lend-reveal--1">
            <span className="lend-section-kicker">{copy.compare.kicker}</span>
            <h2>{copy.compare.title}</h2>
            <p>{copy.compare.body}</p>
          </div>

          <div className="lend-compare-board lend-reveal--2">
            {copy.compare.rows.map((row) => (
              <article key={row.legacy} className="lend-compare-row">
                <div className="lend-compare-legacy">
                  <span>BEFORE RECV</span>
                  <p>{row.legacy}</p>
                </div>
                <div className="lend-compare-separator" />
                <div className="lend-compare-recv">
                  <span>WITH RECV</span>
                  <p>{row.recv}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="networks" className="lend-stacked-section" ref={reveal}>
          <div className="lend-section-copy lend-reveal--1">
            <span className="lend-section-kicker">{copy.networks.kicker}</span>
            <h2>{copy.networks.title}</h2>
            <p>{copy.networks.body}</p>
          </div>

          <div className="lend-network-grid lend-reveal--2">
            {copy.networks.rails.map((rail) => {
              const Logo = NetworkLogos[(rail as { logo?: string }).logo ?? rail.name];
              return (
                <article key={rail.title} className="lend-network-card lend-spotlight-card" onMouseMove={handleMouseMove}>
                  <div className="lend-card-spotlight" />
                  <div className="lend-dogfood-glow" />
                  <div className="lend-network-badge">
                    {Logo ? <span className="lend-network-badge__logo"><Logo /></span> : null}
                    <span className="lend-network-badge__name">{rail.name}</span>
                  </div>
                  <h3>{rail.title}</h3>
                  <p>{rail.body}</p>
                </article>
              );
            })}
          </div>
        </section>
<section className="lend-stacked-section lend-dogfood-section" ref={reveal}>
  <div className="lend-section-copy lend-reveal--1">
    <span className="lend-section-kicker">{copy.dogfooding.kicker}</span>
    <h2>{copy.dogfooding.title}</h2>
  </div>

  <div className="lend-dogfood-grid lend-reveal--2">
    {copy.dogfooding.cards.map((card, idx) => (
      <div 
        key={card.title} 
        className="lend-dogfood-item lend-spotlight-card" 
        onMouseMove={handleMouseMove}
      >
        <div className="lend-card-spotlight" />
        <div className="lend-dogfood-glow" />
        <div className="lend-dogfood-content">
          <span className="lend-section-kicker">0{idx + 1}</span>
          <h3>{card.title}</h3>
          <p>{card.body}</p>
        </div>
      </div>
    ))}
  </div>
      </section>

      <section id="pricing" className="lend-stacked-section" ref={reveal}>
        <div className="lend-section-copy lend-reveal--1">
          <span className="lend-section-kicker">{copy.pricing.kicker}</span>
          <h2>{copy.pricing.title}</h2>
        </div>

        <div className="lend-pricing-grid lend-reveal--2">
          <div className="lend-pricing-card lend-pricing-card--pro lend-spotlight-card" onMouseMove={handleMouseMove}>
            <div className="lend-card-spotlight" />
            <div className="lend-dogfood-glow" />
            <div className="lend-pricing-badge">{copy.pricing.pro.trial}</div>
            <h3>{copy.pricing.pro.name}</h3>
            <div className="lend-price">
              <span>$</span>
              {copy.pricing.pro.price}
              <span>/mo</span>
            </div>
            <ul>
              {copy.pricing.pro.features.map(f => <li key={f}>{f}</li>)}
            </ul>
            <Link className="lend-primary" to="/auth">{copy.pricing.pro.cta}</Link>
          </div>

          <div className="lend-pricing-card lend-spotlight-card" onMouseMove={handleMouseMove}>
            <div className="lend-card-spotlight" />
            <div className="lend-dogfood-glow" />
            <h3>{copy.pricing.api.name}</h3>
            <div className="lend-price">
              <span>$</span>{copy.pricing.api.price}<span>/mo</span>
            </div>
            <ul>
              {copy.pricing.api.features.map(f => <li key={f}>{f}</li>)}
            </ul>
            <Link className="lend-secondary" to="/dev">{copy.pricing.api.cta}</Link>
          </div>

          <div className="lend-pricing-card lend-spotlight-card" onMouseMove={handleMouseMove}>
            <div className="lend-card-spotlight" />
            <div className="lend-dogfood-glow" />
            <h3>{copy.pricing.business.name}</h3>
            <div className="lend-price">
              {copy.pricing.business.price}
            </div>
            <ul>
              {copy.pricing.business.features.map(f => <li key={f}>{f}</li>)}
            </ul>
            <Link className="lend-secondary" to="/auth">{copy.pricing.business.cta}</Link>
          </div>
        </div>
      </section>

      <section id="faq" className="lend-faq-section" ref={reveal}>
          <div className="lend-section-copy lend-faq-copy lend-reveal--1">
            <span className="lend-section-kicker">{copy.faq.kicker}</span>
            <h2>{copy.faq.title}</h2>
            <p>{copy.faq.body}</p>
          </div>

          <div className="lend-faq-stack lend-reveal--2">
            {copy.faq.items.map((item, index) => {
              const isOpen = index === openFaq;
              const answerId = `landing-faq-answer-${index}`;
              return (
                <article key={item.question} className={`lend-faq-item${isOpen ? " is-open" : ""}`}>
                  <button
                    type="button"
                    className="lend-faq-trigger"
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                  >
                    <div className="lend-faq-trigger-copy">
                      <span className="lend-faq-kicker">Protocol Detail 0{index + 1}</span>
                      <span className="lend-faq-question-text">{item.question}</span>
                    </div>
                    <div className="lend-faq-icon">
                      <div className="lend-faq-icon-line" />
                      <div className="lend-faq-icon-line" />
                    </div>
                  </button>
                  <div
                    id={answerId}
                    className={`lend-faq-answer-wrapper${isOpen ? " is-open" : ""}`}
                    aria-hidden={!isOpen}
                  >
                    <div className="lend-faq-answer">
                      <p>{item.answer}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="lend-final" ref={reveal}>
          <div className="lend-reveal--1">
            <span className="lend-section-kicker">{copy.final.kicker}</span>
            <h2>{copy.final.title}</h2>
            <p>{copy.final.body}</p>

            <div className="lend-cta-row">
              <Link className="lend-primary" to="/auth">
                {copy.final.primary}
              </Link>
              <div className="lend-inline-links">
                <Link className="lend-secondary" to="/dev">
                  {copy.footer.api}
                </Link>
                <Link className="lend-secondary" to="/auth">
                  {copy.footer.b2b}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="lend-footer">
          <div className="lend-footer-links">
            <Link to="/privacy">{copy.footer.privacy}</Link>
            <Link to="/terms">{copy.footer.terms}</Link>
            <Link to="/developers">Docs</Link>
            <Link to="/dev">{copy.footer.api}</Link>
            <Link to="/auth">{copy.footer.b2b}</Link>
            <Link to="/auth">{copy.footer.console}</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
