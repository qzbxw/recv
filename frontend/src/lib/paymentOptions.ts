import type { Network, PaymentAsset } from "./types";

export type PayablePaymentOption = {
  key: string;
  network: Network;
  asset: PaymentAsset;
  label: string;
};

export const PAYABLE_PAYMENT_OPTIONS: PayablePaymentOption[] = [
  { key: "TON:GRAM", network: "TON", asset: "GRAM", label: "GRAM" },
  { key: "TON_USDT:USDT", network: "TON_USDT", asset: "USDT", label: "USDT on TON" },
  { key: "TRON:USDT", network: "TRON", asset: "USDT", label: "TRON USDT" },
  { key: "SOLANA:SOL", network: "SOLANA", asset: "SOL", label: "SOL" },
  { key: "SOLANA:USDT", network: "SOLANA", asset: "USDT", label: "Solana USDT" },
  { key: "SOLANA:USDC", network: "SOLANA", asset: "USDC", label: "Solana USDC" },
  { key: "BASE:USDT", network: "BASE", asset: "USDT", label: "Base USDT" },
  { key: "BASE:USDC", network: "BASE", asset: "USDC", label: "Base USDC" },
  { key: "ARBITRUM:USDT", network: "ARBITRUM", asset: "USDT", label: "Arbitrum USDT" },
  { key: "ARBITRUM:USDC", network: "ARBITRUM", asset: "USDC", label: "Arbitrum USDC" },
  { key: "BSC:BNB", network: "BSC", asset: "BNB", label: "BNB" },
  { key: "BSC:USDT", network: "BSC", asset: "USDT", label: "BSC USDT" },
];

export function walletBucket(network: Network) {
  return network === "BASE" || network === "BSC" || network === "ARBITRUM" ? "EVM" : network === "TON_USDT" ? "TON" : network;
}
