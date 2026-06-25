type NetworkLogoProps = {
  network: string;
  className?: string;
};

const normalizedNetwork = (network: string) => {
  const slug = network.toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
  if (slug === "gram" || slug === "ton-usdt" || slug === "usdt-on-ton") return "ton";
  if (slug === "tron-usdt" || slug === "trc20" || slug === "trc-20") return "tron";
  if (slug === "bnb" || slug === "bnb-chain" || slug === "binance-smart-chain") return "bsc";
  return slug;
};

export function NetworkLogo({ network, className = "" }: NetworkLogoProps) {
  const slug = normalizedNetwork(network);
  const baseClass = `network-logo network-logo--${slug} ${className}`.trim();

  if (slug === "ton") {
    return (
      <span className={baseClass} aria-hidden="true">
        <svg viewBox="0 0 32 32" role="img" focusable="false">
          <path fill="#0098ea" d="M16 2.7C8.7 2.7 2.7 8.7 2.7 16S8.7 29.3 16 29.3 29.3 23.3 29.3 16 23.3 2.7 16 2.7Z" />
          <path fill="#fff" d="M22.9 9.8H9.1c-1.2 0-2 .8-1.6 1.9l6.8 12.1c.3.5.8.8 1.4.8s1.1-.3 1.4-.8l6.8-12.1c.6-1.1.2-1.9-1-1.9ZM14.7 20.9l-4.5-8h4.5v8Zm2.6 0v-8h4.5l-4.5 8Z" />
        </svg>
      </span>
    );
  }

  if (slug === "tron") {
    return (
      <span className={baseClass} aria-hidden="true">
        <svg viewBox="0 0 32 32" role="img" focusable="false">
          <path fill="#ff060a" d="M25.8 9.4 6.6 5.2l10.1 21.5 10.7-13.1-1.6-4.2ZM22.7 10.6l-6.2 1.1-5.1-4.2 11.3 3.1Zm-13.5-3 6.3 5.3-1 8.8L9.2 7.6Zm7.1 15.2 1-8.4 6.8-1.2-7.8 9.6Z" />
        </svg>
      </span>
    );
  }

  if (slug === "solana") {
    return (
      <span className={baseClass} aria-hidden="true">
        <svg viewBox="0 0 32 32" role="img" focusable="false">
          <defs>
            <linearGradient id="solana-a" x1="6" x2="26" y1="24" y2="8" gradientUnits="userSpaceOnUse">
              <stop stopColor="#9945ff" />
              <stop offset="0.55" stopColor="#14f195" />
              <stop offset="1" stopColor="#00d4ff" />
            </linearGradient>
          </defs>
          <path fill="url(#solana-a)" d="M9.1 7.2h17.3l-3.5 3.6H5.6l3.5-3.6Z" />
          <path fill="url(#solana-a)" d="M5.6 14.2h17.3l-3.5 3.6H2.1l3.5-3.6Z" />
          <path fill="url(#solana-a)" d="M9.1 21.2h17.3l-3.5 3.6H5.6l3.5-3.6Z" />
        </svg>
      </span>
    );
  }

  if (slug === "base") {
    return (
      <span className={baseClass} aria-hidden="true">
        <svg viewBox="0 0 32 32" role="img" focusable="false">
          <circle cx="16" cy="16" r="13" fill="#0052ff" />
          <path fill="#fff" d="M16.1 24.4a8.4 8.4 0 1 0 0-16.8 8.4 8.4 0 0 0-8.2 6.6h11.2v3.6H7.9a8.4 8.4 0 0 0 8.2 6.6Z" />
        </svg>
      </span>
    );
  }

  if (slug === "arbitrum") {
    return (
      <span className={baseClass} aria-hidden="true">
        <svg viewBox="0 0 32 32" role="img" focusable="false">
          <path fill="#213147" d="M16 2.8 27.4 9.4v13.2L16 29.2 4.6 22.6V9.4L16 2.8Z" />
          <path fill="#12aaff" d="m9.5 21.6 5.7-15.2h3.2l-5.7 15.2H9.5Z" />
          <path fill="#28a0f0" d="m15.3 25.1 6.9-18.7h3.2l-7 18.7h-3.1Z" />
          <path fill="#fff" d="m12.9 24.8 2.4-6.4 2.4 3.8-1.1 3-1 .6-2.7-1Zm-4.7-2.7 2.1-5.7 2.3 3.7-1.4 3.7-3-1.7Z" />
        </svg>
      </span>
    );
  }

  if (slug === "bsc") {
    return (
      <span className={baseClass} aria-hidden="true">
        <svg viewBox="0 0 32 32" role="img" focusable="false">
          <path fill="#f0b90b" d="m16 3.9 4.4 4.4-4.4 4.4-4.4-4.4L16 3.9Zm-7.5 7.5 4.4 4.4-4.4 4.4-4.4-4.4 4.4-4.4Zm15 0 4.4 4.4-4.4 4.4-4.4-4.4 4.4-4.4ZM16 18.9l4.4 4.4-4.4 4.4-4.4-4.4 4.4-4.4Zm0-7.5 4.4 4.4-4.4 4.4-4.4-4.4 4.4-4.4Z" />
        </svg>
      </span>
    );
  }

  return (
    <span className={baseClass} aria-hidden="true">
      <svg viewBox="0 0 32 32" role="img" focusable="false">
        <circle cx="16" cy="16" r="11" />
      </svg>
    </span>
  );
}
