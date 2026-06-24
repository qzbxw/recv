import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useUI } from "../lib/ui";
import { PLAN_COPY as COPY } from "../i18n";
import { LanguageSelect } from "../components/LanguageSelect";

type Variant = "dev" | "business";


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

export function PlanPage({ variant }: { variant: Variant }) {
  const { language, setLanguage } = useUI();
  const text = COPY[language];
  const product = text[variant];
  const reveal = useReveal();

  useEffect(() => {
    document.documentElement.dataset.theme = "dark";
    window.scrollTo(0, 0);
  }, [variant]);

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
              <Link className="lend-primary" to="/auth">{text.auth}</Link>
            </div>
          </div>
        </header>

        <section className={`lend-hero ${variant === "dev" || variant === "business" ? "lend-hero--centered" : ""}`} ref={reveal}>
          <div className="lend-hero-copy">
            <span className="lend-section-kicker lend-reveal--1">{product.badge}</span>
            <h1 className="lend-reveal--2">{product.title}</h1>
            <p className="lend-reveal--3">{product.body}</p>

            <div className="lend-cta-row lend-reveal--4">
              {variant === "dev" ? (
                <>
                  <Link className="lend-primary" to="/auth">
                    {text.activate}
                  </Link>
                  <Link className="lend-secondary" to="/auth">
                    {text.auth}
                  </Link>
                </>
              ) : variant === "business" ? (
                <>
                  <a className="lend-primary" href="https://t.me/kynexq" target="_blank" rel="noopener noreferrer">
                    {text.discuss}
                  </a>
                  <Link className="lend-secondary" to="/auth">
                    {text.auth}
                  </Link>
                </>
              ) : (
                <>
                  <a className="lend-primary" href="https://t.me/kynexq" target="_blank" rel="noopener noreferrer">
                    {text.discuss}
                  </a>
                  <Link className="lend-secondary" to="/auth">
                    {text.auth}
                  </Link>
                </>
              )}
            </div>
          </div>

          {variant !== "dev" && variant !== "business" && (
            <aside className="lend-hero-side lend-reveal--3">
              <div className="lend-stats-grid">
                {product.stats.map((stat, i) => (
                  <article key={i} className={`lend-card lend-stat-card lend-reveal--${4 + i}`}>
                    <span className="lend-stat-label">{stat.label}</span>
                    <h3 className="lend-stat-value">{stat.value}</h3>
                  </article>
                ))}
              </div>
            </aside>
          )}
        </section>

        <section className="lend-split-section lend-plan-features" ref={reveal}>
          <div className="lend-section-copy lend-reveal--1">
            <span className="lend-section-kicker">{text.compareTitle}</span>
            <h2>{text.compareSectionTitle}</h2>
            <p>{text.compareSectionBody}</p>
          </div>

          <div className="lend-overview-grid lend-reveal--2">
            {product.features.map((feat, i) => (
              <article key={i} className={`lend-card lend-plan-feature-card lend-reveal--${2 + i}`}>
                <h3>{feat.title}</h3>
                <p>{feat.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lend-stacked-section lend-code-section" ref={reveal}>
           <div className="lend-card lend-code-card lend-reveal--1">
              <div className="lend-code-grid">
                <div className="lend-reveal--2">
                  <span className="lend-section-kicker">{text.codeTitle}</span>
                  <h2>{text.codeSubtitle}</h2>
                  <p>
                    {text.codeBody}
                  </p>
                </div>
                <div className="lend-reveal--3 lend-code-block">
                  <pre>
                    <code>{product.code}</code>
                  </pre>
                </div>
              </div>
           </div>
        </section>

        <section className="lend-stacked-section lend-flow-section" ref={reveal}>
          <div className="lend-section-copy lend-reveal--1">
            <span className="lend-section-kicker">{text.flowTitle}</span>
            <h2>{text.integrationFlow}</h2>
          </div>

          <div className="lend-flow-container">
            {product.flow.map((step, i) => (
              <article key={i} className={`lend-card lend-flow-card lend-reveal--${2 + i}`}>
                <div className="lend-flow-step-number">
                  {i + 1}
                </div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
                
                {i < 2 && (
                  <div className="lend-flow-arrow">
                    →
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="lend-final lend-plan-final" ref={reveal}>
          <div className="lend-reveal--1">
            <span className="lend-section-kicker">{text.priceTitle}</span>
          </div>
          
          <div className="lend-reveal--2">
            <h2 className="lend-price-value">
              {product.priceLabel}
            </h2>
          </div>
          
          <div className="lend-reveal--3">
            <p className="lend-price-period">
              {product.period}
            </p>
            <p className="lend-price-subtitle">
              {text.priceSubtitle}
            </p>
          </div>

          <div className="lend-cta-row lend-reveal--4">
            {variant === "dev" ? (
              <Link className="lend-primary lend-price-btn" to="/auth">
                {text.activateDev}
              </Link>
            ) : (
              <a className="lend-primary lend-price-btn" href="https://t.me/kynexq" target="_blank" rel="noopener noreferrer">
                {text.discuss}
              </a>
            )}
          </div>
        </section>

        <footer className="lend-footer">
          <div className="lend-footer-links">
            <Link to="/privacy">{text.footerPrivacy}</Link>
            <Link to="/terms">{text.footerTerms}</Link>
            <Link to="/developers">{text.footerDocs}</Link>
            <Link to="/dev">{text.footerApi}</Link>
            <Link to="/business">{text.footerB2B}</Link>
            <Link to="/auth">{text.auth}</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
