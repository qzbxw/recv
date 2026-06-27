import type { ReactNode } from "react";
import type { Network, PaymentAsset } from "../lib/types";

export type DisplayNetwork = Network;

type CryptoLogoProps =
  | { type: "network"; value: DisplayNetwork | Network | string; className?: string }
  | { type: "asset"; value: PaymentAsset | string | undefined; className?: string };

function normalizeNetwork(value: string) {
  const slug = value.toUpperCase().replace(/[\s-]+/g, "_");
  if (slug === "TON_USDT" || slug === "USDT_ON_TON" || slug === "GRAM") return "TON";
  if (slug === "TRON_USDT" || slug === "TRC20" || slug === "TRC_20") return "TRON";
  if (slug === "BNB" || slug === "BNB_CHAIN" || slug === "BINANCE_SMART_CHAIN") return "BSC";
  return slug;
}

function normalizeAsset(value: string | undefined) {
  return (value || "GRAM").toUpperCase();
}

export function CryptoLogo(props: CryptoLogoProps) {
  const rawValue = String(props.value || "");
  const value = props.type === "network" ? normalizeNetwork(rawValue) : normalizeAsset(rawValue);
  const className = `crypto-logo co-logo crypto-logo--${props.type} crypto-logo--${value.toLowerCase()} ${props.className || ""}`.trim();

  if (props.type === "asset") {
    return (
      <span className={className} aria-hidden="true" title={value}>
        {value === "USDT" ? (
          <svg viewBox="0 0 32 32" role="img" focusable="false"><circle cx="16" cy="16" r="16" fill="#26A17B" /><path fill="#fff" d="M17.8 17.3v-.1c-.1 0-.9.1-1.8.1s-1.7 0-1.8-.1v.1c.1.1.8.2 1.8.2s1.7-.1 1.8-.2Zm6.6-8.6v3.1h-6.2v2.1c4.2.2 7.3 1.1 7.3 2.2s-3.1 2-7.3 2.2v6.7h-4.4v-6.7c-4.2-.2-7.3-1.1-7.3-2.2s3.1-2 7.3-2.2v-2.1H7.6V8.7h16.8Zm-8.4 8.1c3.6 0 6.5-.5 6.5-1.1 0-.4-1.7-.8-4.3-1v2.1h-4.4v-2.1c-2.6.2-4.3.6-4.3 1 0 .6 2.9 1.1 6.5 1.1Z" /></svg>
        ) : value === "USDC" ? (
          <svg viewBox="0 0 32 32" role="img" focusable="false"><circle cx="16" cy="16" r="16" fill="#2775CA" /><path fill="#fff" d="M15.1 25.8a10 10 0 0 1 0-19.6v2.2a7.8 7.8 0 0 0 0 15.2v2.2Zm1.8 0v-2.2a7.8 7.8 0 0 0 0-15.2V6.2a10 10 0 0 1 0 19.6Zm-1.1-4.2v-1.5c-1.7-.2-2.8-1-3.5-1.9l1.3-1.4c.6.8 1.5 1.4 2.7 1.4.9 0 1.6-.4 1.6-1.1 0-.8-.8-1-2.1-1.3-1.6-.4-3.1-1-3.1-2.9 0-1.6 1.2-2.7 3.1-3v-1.5h1.4v1.5c1.2.2 2.2.7 2.9 1.5l-1.3 1.4c-.5-.6-1.3-1-2.3-1-.9 0-1.5.4-1.5 1 0 .7.7.9 2 1.2 1.8.4 3.3 1 3.3 3 0 1.7-1.2 2.8-3.1 3.1v1.5h-1.4Z" /></svg>
        ) : value === "SOL" ? (
          <svg viewBox="0 0 32 32" role="img" focusable="false"><circle cx="16" cy="16" r="16" fill="#101010" /><path fill="#14F195" d="M9.4 10.3h14.2l-2.9 3H6.5l2.9-3Zm0 8.4h14.2l-2.9 3H6.5l2.9-3Zm16.1-4.2-2.9 3H8.4l2.9-3h14.2Z" /></svg>
        ) : value === "BNB" ? (
          <svg viewBox="0 0 32 32" role="img" focusable="false"><circle cx="16" cy="16" r="16" fill="#F3BA2F" /><path fill="#181A20" d="m16 7 3.3 3.3-2 2L16 11l-1.3 1.3-2-2L16 7Zm-5.7 5.7 2 2L11 16l1.3 1.3-2 2L7 16l3.3-3.3Zm11.4 0L25 16l-3.3 3.3-2-2L21 16l-1.3-1.3 2-2ZM16 14l2 2-2 2-2-2 2-2Zm1.3 5.7 2 2L16 25l-3.3-3.3 2-2L16 21l1.3-1.3Z" /></svg>
        ) : (
          <svg viewBox="0 0 32 32" role="img" focusable="false"><circle cx="16" cy="16" r="16" fill="#0098EA" /><path fill="#fff" d="M16 6 6.5 12.2 16 26l9.5-13.8L16 6Zm0 3.2 6.1 3.9L16 22.1 9.9 13.1 16 9.2Z" /></svg>
        )}
      </span>
    );
  }

  return (
    <span className={className} aria-hidden="true" title={value}>
      {value === "TON" ? (
        <svg viewBox="0 0 32 32" role="img" focusable="false"><circle cx="16" cy="16" r="16" fill="#0098EA" /><path fill="#fff" d="M16 6.2 6.6 11.8 16 26l9.4-14.2L16 6.2Zm-6 7h4.7v7.1L10 13.2Zm7.3 7.1v-7.1H22l-4.7 7.1Z" /></svg>
      ) : value === "TRON" ? (
        <svg viewBox="0 0 32 32" role="img" focusable="false"><circle cx="16" cy="16" r="16" fill="#EF0027" /><path fill="#fff" d="M7.2 7.4 24.8 11 14.6 25.1 7.2 7.4Zm3.1 3.1 4.7 11.2 1.4-8.2-6.1-3Zm7.8 3.2-1.2 7.4 5.5-7.6-4.3.2Zm-.5-2 4.8-.2-10.2-2.1 5.4 2.3Z" /></svg>
      ) : value === "SOLANA" ? (
        <svg viewBox="0 0 32 32" role="img" focusable="false"><circle cx="16" cy="16" r="16" fill="#101010" /><path fill="#14F195" d="M9.4 10.3h14.2l-2.9 3H6.5l2.9-3Zm0 8.4h14.2l-2.9 3H6.5l2.9-3Zm16.1-4.2-2.9 3H8.4l2.9-3h14.2Z" /></svg>
      ) : value === "BASE" ? (
        <svg viewBox="0 0 32 32" role="img" focusable="false"><circle cx="16" cy="16" r="16" fill="#0052FF" /><circle cx="16" cy="16" r="8.3" fill="#fff" /></svg>
      ) : value === "ARBITRUM" ? (
        <svg viewBox="0 0 32 32" role="img" focusable="false"><circle cx="16" cy="16" r="16" fill="#213147" /><path fill="#12AAFF" d="m10 22 5.8-15.2h3.1L13.1 22H10Z" /><path fill="#28A0F0" d="m15.7 25 6.8-18.2h3.1L18.8 25h-3.1Z" /><path fill="#fff" d="m8 20.8 2.3-6.1 2.1 3.5-1.3 3.6L8 20.8Zm5 3.1 2.1-5.7 2.2 3.4-1.1 3-3.2-.7Z" /></svg>
      ) : value === "BSC" ? (
        <svg viewBox="0 0 32 32" role="img" focusable="false"><circle cx="16" cy="16" r="16" fill="#F3BA2F" /><path fill="#181A20" d="m16 7 3.3 3.3-2 2L16 11l-1.3 1.3-2-2L16 7Zm-5.7 5.7 2 2L11 16l1.3 1.3-2 2L7 16l3.3-3.3Zm11.4 0L25 16l-3.3 3.3-2-2L21 16l-1.3-1.3 2-2ZM16 14l2 2-2 2-2-2 2-2Zm1.3 5.7 2 2L16 25l-3.3-3.3 2-2L16 21l1.3-1.3Z" /></svg>
      ) : (
        <svg viewBox="0 0 32 32" role="img" focusable="false"><circle cx="16" cy="16" r="16" fill="#627EEA" /><path fill="#fff" d="m16 5 6.6 11.2L16 20l-6.6-3.8L16 5Zm0 21.8-6.6-9.2 6.6 3.8 6.6-3.8-6.6 9.2Z" /></svg>
      )}
    </span>
  );
}

export function NetworkLabel({ network, children, className = "" }: { network: Network | string; children: ReactNode; className?: string }) {
  return <span className={`crypto-label ${className}`.trim()}><CryptoLogo type="network" value={network} />{children}</span>;
}

export function AssetLabel({ asset, children, className = "" }: { asset: PaymentAsset | string | undefined; children: ReactNode; className?: string }) {
  return <span className={`crypto-label ${className}`.trim()}><CryptoLogo type="asset" value={asset} />{children}</span>;
}
