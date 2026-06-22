export type Network = "TON" | "TON_USDT" | "TRON" | "EVM" | "SOLANA" | "BASE" | "ARBITRUM" | "BSC";
export type PaymentAsset = "GRAM" | "USDT" | "USDC" | "SOL" | "BNB";
export type InvoiceStatus = "draft" | "awaiting_payment" | "paid" | "expired" | "underpaid" | "overpaid" | "manual_review";
export type APIKeyMode = "live" | "test";
export type WebhookDeliveryStatus = "pending" | "delivered" | "failed" | "retrying" | "exhausted" | string;

export type Environment = "test" | "live";

export type User = {
  id: number;
  telegram_id: number;
  username: string;
  email: string;
  created_at: string;
};

export type AuthProvider = "telegram" | "google" | "github";

export type AuthIdentity = {
  id?: number;
  user_id: number;
  provider: AuthProvider | string;
  provider_user_id: string;
  email: string;
  email_verified: boolean;
  display_name: string;
  username: string;
  avatar_url: string;
  linked_at: string;
  last_login_at: string;
};

export type Workspace = {
  id: number;
  owner_telegram_id?: number | null;
  username?: string;
  email?: string;
  name: string;
  slug: string;
  language?: "en" | "ru";
  default_network: Network;
  plan_code: "trial" | "merchant" | "developer" | "business";
  subscription_ends_at: string | null;
  is_blocked: boolean;
  discount_percent?: number;
  discount_plan_code?: string | null;
  created_at: string;
};

export type WorkspaceMember = {
  workspace_id: number;
  user_id: number;
  role: string;
  created_at: string;
};

export type MemberRole = "owner" | "admin" | "member";

export type WorkspaceMemberDetail = {
  user_id: number;
  telegram_id: number;
  username: string;
  email: string;
  role: MemberRole;
  joined_at: string;
};

export type WorkspaceInvite = {
  id: number;
  workspace_id: number;
  invited_username: string;
  role: MemberRole;
  status: string;
  invited_by?: number | null;
  created_at: string;
};

export type TeamResponse = {
  members: WorkspaceMemberDetail[];
  invites: WorkspaceInvite[];
  my_role: MemberRole;
};

export type Wallet = {
  id: number;
  workspace_id: number;
  network: Network;
  address: string;
  environment: Environment;
  is_active: boolean;
  created_at: string;
};

export type Invoice = {
  id: number;
  public_id: string;
  kind?: "merchant" | "subscription";
  subscription_days?: number;
  plan_code?: "trial" | "merchant" | "developer" | "business" | "";
  checkout_badge?: string;
  title: string;
  workspace_id?: number;
  base_amount_usd: string;
  payable_amount: string;
  payable_network: Network;
  payable_asset?: PaymentAsset;
  payment_options?: PaymentOption[];
  destination_address: string;
  payment_comment: string | null;
  status: InvoiceStatus;
  environment: Environment;
  expires_at: string;
  created_at: string;
  tx_hash?: string | null;
  received_amount: string;
  review_reason?: string | null;
  finalized_at?: string | null;
  checkout_url: string;
  payment_uri: string;
};

export type PaymentOption = {
  network: Network;
  asset: PaymentAsset;
  payable_amount: string;
  destination_address: string;
  payment_comment: string | null;
  payment_uri: string;
  is_default: boolean;
};

export type MeResponse = {
  user: User;
  workspaces: Workspace[];
  workspace: Workspace;
  plan: Plan;
  plans: Plan[];
};

export type Plan = {
  code: "trial" | "merchant" | "developer" | "business";
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
  webhook_limit?: number;
  max_workspaces?: number;
  max_seats?: number;
  analytics_level?: string;
  support_level?: string;
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
  workspace_id: number;
  label: string;
  prefix: string;
  environment: Environment;
  scopes: string[];
  last_used_at: string | null;
  created_at: string;
};

export type WebhookDelivery = {
  id: number;
  event_id: string;
  endpoint_id: number;
  workspace_id: number;
  event_type: string;
  payload: unknown;
  status: WebhookDeliveryStatus;
  environment: Environment;
  attempts: number;
  max_attempts: number;
  last_http_status: number | null;
  last_error: string | null;
  created_at: string;
  sent_at: string | null;
};

export type WebhookDeliveryListResponse = {
  items: WebhookDelivery[] | null;
};

export type WebhookEndpoint = {
  id: number;
  workspace_id: number;
  label: string;
  url: string;
  secret?: string;
  environment: Environment;
  is_active: boolean;
  last_delivery_at: string | null;
  last_success_at: string | null;
  created_at: string;
};

export type WebhookEndpointWithSecret = WebhookEndpoint & {
  secret: string;
};

export type WalletListResponse = {
  items: Wallet[] | null;
};

export type InvoiceListResponse = {
  items: Invoice[] | null;
  total: number;
  page: number;
  page_size: number;
};

export type APIKeyListResponse = {
  items: APIKey[] | null;
};

export type WebhookListResponse = {
  items: WebhookEndpoint[] | null;
};

export type AdminInvoice = {
  id: number;
  public_id: string;
  workspace_id: number;
  workspace_name: string;
  user_email: string;
  kind: "merchant" | "subscription";
  plan_code: string;
  title: string;
  base_amount_usd: string;
  payable_amount: string;
  payable_network: Network;
  payable_asset?: PaymentAsset;
  destination_address: string;
  payment_comment: string;
  status: string;
  classification: string;
  tx_hash: string;
  expires_at: string;
  paid_at: string | null;
  created_at: string;
  checkout_url: string;
};

export type AdminOverviewResponse = {
  generated_at: string;
  totals: {
    invoices_total: number;
    paid_total: number;
    awaiting_total: number;
    underpaid_total: number;
    manual_review_total: number;
    expired_total: number;
    merchant_paid_total: number;
    subscription_paid_total: number;
    gross_paid_usd: string;
    merchant_paid_usd: string;
    subscription_paid_usd: string;
    open_invoice_usd: string;
    workspaces_total: number;
    active_subscribers: number;
    blocked_workspaces: number;
    wallets_total: number;
    api_keys_active: number;
    webhook_endpoints: number;
  };
  daily_sales: Array<{
    date: string;
    paid_usd: string;
    merchant_paid_usd: string;
    subscription_paid_usd: string;
    paid_count: number;
    created_count: number;
    underpaid_count: number;
    manual_review_count: number;
  }>;
  network_breakdown: Array<{
    network: Network;
    paid_usd: string;
    paid_count: number;
    total_count: number;
  }>;
  status_breakdown: Array<{
    status: string;
    count: number;
    usd: string;
  }>;
  plan_breakdown: Array<{
    plan_code: string;
    paid_usd: string;
    paid_count: number;
  }>;
  recent_sales: AdminInvoice[];
};

export type AdminOpsOverviewResponse = {
  generated_at: string;
  revenue: {
    gross_paid_usd: string;
    open_invoice_usd: string;
    subscription_paid_usd: string;
  };
  workspaces: {
    total: number;
    active_subscribers: number;
    blocked: number;
  };
  invoices: {
    total: number;
    paid: number;
    manual_review: number;
    underpaid: number;
  };
  subscriptions: {
    active: number;
    paid_invoices: number;
  };
  manual_review_queue: AdminInvoice[];
  failed_webhook_queue: AdminWebhookDelivery[];
  watcher_health: AdminWatcher[];
  notification_health: AdminNotificationHealth;
  daily_sales: AdminOverviewResponse["daily_sales"];
  network_breakdown: AdminOverviewResponse["network_breakdown"];
  status_breakdown: AdminOverviewResponse["status_breakdown"];
  plan_breakdown: AdminOverviewResponse["plan_breakdown"];
};

export type AdminWorkspace = {
  workspace: Workspace;
  invoices_total: number;
  paid_invoices: number;
  gross_paid_usd: string;
  last_invoice_at: string | null;
  webhook_endpoints: number;
  active_api_keys: number;
  manual_review_invoices: number;
};

export type AdminWebhookDelivery = WebhookDelivery & {
  endpoint_label: string;
  endpoint_url: string;
  target_url?: string;
  workspace_name: string;
  user_email: string;
};

export type AdminWatcher = {
  poll_network: Network;
  payable_network: Network;
  destination_address: string;
  last_block: number;
  last_observed_at: string | null;
  updated_at: string;
  freshness_seconds: number;
};

export type AdminNotificationHealth = {
  pending_total: number;
  processing_total: number;
  failed_total: number;
  sent_24h: number;
  oldest_pending_age_seconds: number;
};

export type AdminAnalyticsResponse = {
  from: string;
  to: string;
  group_by: "date" | "network" | "plan" | "mode";
  mrr_usd: string;
  arr_usd: string;
  paid_volume_usd: string;
  active_merchants: number;
  created_invoices: number;
  paid_invoices: number;
  failed_webhook_rate: string;
  manual_review_rate: string;
  underpaid_share: string;
  breakdown: Array<{
    bucket: string;
    created_invoices: number;
    paid_invoices: number;
    manual_review_invoices: number;
    underpaid_invoices: number;
    paid_volume_usd: string;
  }>;
};

export type UTMReport = {
  from: string;
  to: string;
  campaigns: Array<{
    source: string;
    medium: string;
    campaign: string;
    visits: number;
    unique_visitors: number;
    events: number;
    docs_opened: number;
    app_opens: number;
    bot_opens: number;
    signup_starts: number;
    signups: number;
    paying_workspaces: number;
    paid_usd: string;
  }>;
  top_landings: Array<{
    path: string;
    title: string;
    visitors: number;
    events: number;
    signup_visitors: number;
  }>;
  top_pages: Array<{
    path: string;
    title: string;
    visitors: number;
    events: number;
    signup_visitors: number;
  }>;
  top_docs: Array<{
    path: string;
    title: string;
    visitors: number;
    events: number;
    signup_visitors: number;
  }>;
  leads: Array<{
    attribution_id: string;
    source: string;
    medium: string;
    campaign: string;
    term: string;
    content: string;
    landing_path: string;
    referrer: string;
    first_seen_at: string;
    last_seen_at: string;
    event_count: number;
    docs_opened: number;
    app_opens: number;
    signup_started: boolean;
    workspace_id?: number;
    workspace_name?: string;
    workspace_email?: string;
    signed_up_at?: string;
    timeline: Array<{
      event_name: string;
      path: string;
      title: string;
      created_at: string;
    }>;
  }>;
};

export type WebVitalsReport = {
  from: string;
  to: string;
  metrics: Array<{
    metric_name: "LCP" | "INP" | "CLS";
    p75: number;
    samples: number;
    good: boolean;
  }>;
};

export type ReferralPartner = {
  id: number;
  code: string;
  name: string;
  contact: string;
  commission_pct: string;
  launch_commission_pct?: string | null;
  launch_ends_at?: string | null;
  payout_address: string;
  notes: string;
  is_archived: boolean;
  created_at: string;
};

export type ReferralPartnerStats = ReferralPartner & {
  clicks: number;
  signups: number;
  active_referrals: number;
  revenue_usd: string;
  accrued_usd: string;
  paid_usd: string;
  owed_usd: string;
};

export type ReferralPartnerReport = {
  partner: ReferralPartner;
  months: Array<{
    month: string;
    revenue_usd: string;
    active_referrals: number;
    rate_pct: string;
    accrued_usd: string;
  }>;
  payouts: Array<{
    id: number;
    partner_id: number;
    amount_usd: string;
    note: string;
    created_by: string;
    paid_at: string;
  }>;
  referrals: Array<{
    workspace_id: number;
    username: string;
    signed_up_at: string;
    revenue_usd: string;
  }>;
};

export type ReferralPartnerPayload = {
  code?: string;
  name: string;
  contact?: string;
  commission_pct?: string;
  launch_commission_pct?: string;
  launch_months?: number;
  launch_ends_at?: string;
  payout_address?: string;
  notes?: string;
  is_archived?: boolean;
};

export type AdminActionResponse<T> = {
  result: string;
} & T;

export type AdminInternalComment = {
  id: number;
  target_type: string;
  target_id: string;
  body: string;
  author: string;
  created_at: string;
};

export type AdminAuditEvent = {
  id: number;
  actor: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type SEOTarget = {
  id: number;
  keyword_cluster: string;
  target_page: string;
  publish_status: string;
  index_status: string;
  internal_links_count: number;
  video_attached: boolean;
  comparison_page_status: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type SEORedirect = {
  id: number;
  source_path: string;
  target_url: string;
  status_code: 301 | 302 | 308;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type AdminInvoiceListResponse = {
  items: AdminInvoice[];
  total: number;
  page: number;
  page_size: number;
};

export type AdminBillingCheckoutResponse = {
  workspace: {
    id: number;
    name: string;
  };
  user: {
    id: number;
    username: string;
    email: string;
  };
  plan: {
    code: "merchant" | "developer" | "business";
    name: string;
    price_usd: string;
    billing_days: number;
    generated_at: string;
  };
  invoice: Invoice;
};

export type AdminBlogPost = {
  id: number;
  slug: string;
  title: string;
  h1: string | null;
  content_md: string;
  content_json: Record<string, unknown> | null;
  content_version: number;
  excerpt: string;
  cover_image_url: string;
  author: string;
  is_published: boolean;
  status: "draft" | "published";
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  cover_image_alt: string | null;
  robots_index: boolean;
  robots_follow: boolean;
  include_in_sitemap: boolean;
  author_slug: string;
  tags: string[];
  locale: string;
  preview_token: string | null;
  internal_links_count: number;
  internal_linking_status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminBlogPostListResponse = {
  items: AdminBlogPost[];
  total?: number;
  page?: number;
  size?: number;
};

export type AdminMedia = {
  id: number;
  file_name: string;
  original_name: string;
  mime_type: string;
  byte_size: number;
  width: number;
  height: number;
  alt_text: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  url: string;
};

export type AdminMediaListResponse = {
  items: AdminMedia[];
  total: number;
  page: number;
  page_size: number;
};

export type PromoCode = {
  id: number;
  code: string;
  duration_days: number;
  plan_code: string;
  expires_at: string | null;
  max_uses: number | null;
  uses_count: number;
  discount_percent: number;
  created_by: string;
  created_at: string;
};
