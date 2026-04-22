import type { Environment, Wallet, WalletListResponse } from "../types";
import { request } from "./core";

export async function fetchWallets(token: string) {
  return request<WalletListResponse>("/api/wallets", {}, token);
}

export async function createWallet(token: string, payload: { network: string; address: string; environment?: Environment }) {
  return request<Wallet>("/api/wallets", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function deleteWallet(token: string, walletId: number) {
  return request<void>(`/api/wallets/${walletId}`, { method: "DELETE" }, token);
}

