export type Network = "TON" | "TRON" | "SOLANA" | "EVM" | "BASE" | "ARBITRUM" | "BSC";

export type Seller = {
  id: number;
  telegram_id: number | null;
  username: string;
  email: string;
  default_network: Network;
  plan_code: "trial" | "pro" | "dev" | "enterprise";
  subscription_ends_at: string | null;
  free_invoices_used: number;
  is_blocked: boolean;
  telegram_linked_at: string | null;
  created_at: string;
};

export type Wallet = {
  id: number;
  seller_id: number;
  network: Network;
  address: string;
  is_active: boolean;
  created_at: string;
};

export type Invoice = {
  id: number;
  public_id: string;
  kind?: "merchant" | "subscription";
  subscription_days?: number;
  plan_code?: "trial" | "pro" | "dev" | "enterprise" | "";
  checkout_badge?: string;
  title: string;
  base_amount_usd: string;
  payable_amount: string;
  payable_network: Network;
  destination_address: string;
  payment_comment: string | null;
  status: string;
  expires_at: string;
  tx_hash?: string | null;
  checkout_url: string;
  payment_uri: string;
};

export type MeResponse = {
  seller: Seller;
  plan: {
    code: "trial" | "pro" | "dev" | "enterprise";
    name: string;
    is_pro: boolean;
    has_api: boolean;
    has_webhooks: boolean;
    trial_limit: number;
    trial_remaining: number;
    price_usd: string;
    billing_days: number;
    api_key_limit: number;
    monthly_cap: number;
    rpm_limit: number;
    webhook_retries: number;
  };
  plans: Plan[];
};

export type Plan = {
  code: "trial" | "pro" | "dev" | "enterprise";
  name: string;
  checkout_title: string;
  checkout_badge: string;
  marketing_label: string;
  price_usd: string;
  billing_days: number;
  has_unlimited_sales: boolean;
  has_api: boolean;
  has_webhooks: boolean;
  api_key_limit: number;
  monthly_request_cap: number;
  requests_per_minute: number;
  webhook_retries: number;
  priority_support: boolean;
};

export type DeveloperUsageResponse = {
  plan: Plan;
  usage: {
    monthly_requests: number;
    monthly_limit: number;
    requests_this_min: number;
    minute_limit: number;
    active_api_keys: number;
    api_key_limit: number;
    webhook_endpoints: number;
    webhook_retry_limit: number;
  };
};

export type APIKey = {
  id: number;
  seller_id: number;
  label: string;
  prefix: string;
  scopes: string[];
  last_used_at: string | null;
  created_at: string;
};

export type WebhookEndpoint = {
  id: number;
  seller_id: number;
  label: string;
  url: string;
  secret: string;
  is_active: boolean;
  last_delivery_at: string | null;
  last_success_at: string | null;
  created_at: string;
};

export type WalletListResponse = {
  items: Wallet[] | null;
};

export type InvoiceListResponse = {
  items: Invoice[] | null;
  page: number;
  page_size: number;
};

export type APIKeyListResponse = {
  items: APIKey[] | null;
};

export type WebhookListResponse = {
  items: WebhookEndpoint[] | null;
};
