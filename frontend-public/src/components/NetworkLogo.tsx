type NetworkLogoProps = {
  network: string;
  className?: string;
};

const normalizedNetwork = (network: string) => network.toLowerCase().replace(/_/g, "-");

export function NetworkLogo({ network, className = "" }: NetworkLogoProps) {
  const slug = normalizedNetwork(network);
  const baseClass = `network-logo network-logo--${slug} ${className}`.trim();

  if (slug === "ton") {
    return (
      <span className={baseClass} aria-hidden="true">
        <svg viewBox="0 0 32 32" role="img" focusable="false">
          <path d="M5 9.5 10.2 23 16 9.5H5Z" />
          <path d="M16 9.5 21.8 23 27 9.5H16Z" />
          <path d="M5 9.5h22L22.2 5h-12.4L5 9.5Z" />
        </svg>
      </span>
    );
  }

  if (slug === "tron") {
    return (
      <span className={baseClass} aria-hidden="true">
        <svg viewBox="0 0 32 32" role="img" focusable="false">
          <path d="M7 5 26 10.4 13.2 27 7 5Z" />
          <path d="M8.6 7.1 13.4 24.4 16.7 13.1 8.6 7.1Z" />
          <path d="M10.2 6.8 25 11 17.2 12.2 10.2 6.8Z" />
        </svg>
      </span>
    );
  }

  if (slug === "solana") {
    return (
      <span className={baseClass} aria-hidden="true">
        <svg viewBox="0 0 32 32" role="img" focusable="false">
          <path d="M9.2 8h16.4l-3 4H6.2l3-4Z" />
          <path d="M6.4 14h16.4l-3 4H3.4l3-4Z" />
          <path d="M9.2 20h16.4l-3 4H6.2l3-4Z" />
        </svg>
      </span>
    );
  }

  if (slug === "base") {
    return (
      <span className={baseClass} aria-hidden="true">
        <svg viewBox="0 0 32 32" role="img" focusable="false">
          <circle cx="16" cy="16" r="11" />
          <path d="M16 9a7 7 0 1 0 6.3 10H16v-6h13v3a13 13 0 1 1-13-13v6Z" />
        </svg>
      </span>
    );
  }

  if (slug === "arbitrum") {
    return (
      <span className={baseClass} aria-hidden="true">
        <svg viewBox="0 0 32 32" role="img" focusable="false">
          <path d="M16 3.5 27 9.8v12.4l-11 6.3-11-6.3V9.8L16 3.5Z" />
          <path d="m11.4 22.8 7.3-15.1h3l-7.3 15.1h-3Z" />
          <path d="m16.8 23.2 5.1-10.7h3l-5.1 10.7h-3Z" />
        </svg>
      </span>
    );
  }

  if (slug === "bsc") {
    return (
      <span className={baseClass} aria-hidden="true">
        <svg viewBox="0 0 32 32" role="img" focusable="false">
          <path d="m16 4 5 5-5 5-5-5 5-5Z" />
          <path d="m8 12 5 5-5 5-5-5 5-5Z" />
          <path d="m24 12 5 5-5 5-5-5 5-5Z" />
          <path d="m16 20 5 5-5 5-5-5 5-5Z" />
          <path d="m16 12 5 5-5 5-5-5 5-5Z" />
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
