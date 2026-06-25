package store

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/shopspring/decimal"
)

type Network string

const (
	NetworkTON      Network = "TON"
	NetworkTON_USDT Network = "TON_USDT"
	NetworkTRON     Network = "TRON"
	NetworkSOLANA   Network = "SOLANA"
	NetworkEVM      Network = "EVM"
	NetworkBASE     Network = "BASE"
	NetworkARBITRUM Network = "ARBITRUM"
	NetworkBSC      Network = "BSC"
)

type PaymentAsset string

const (
	AssetGRAM PaymentAsset = "GRAM"
	AssetUSDT PaymentAsset = "USDT"
	AssetUSDC PaymentAsset = "USDC"
	AssetSOL  PaymentAsset = "SOL"
	AssetBNB  PaymentAsset = "BNB"
)

type PaymentOption struct {
	ID                 int64            `json:"id"`
	InvoiceID          int64            `json:"invoice_id"`
	Network            Network          `json:"network"`
	Asset              PaymentAsset     `json:"asset"`
	PayableAmount      decimal.Decimal  `json:"payable_amount"`
	DestinationAddress string           `json:"destination_address"`
	PaymentComment     *string          `json:"payment_comment"`
	MatchingSuffix     *decimal.Decimal `json:"matching_suffix"`
	PaymentURI         string           `json:"payment_uri"`
	IsDefault          bool             `json:"is_default"`
	CreatedAt          time.Time        `json:"created_at"`
}

func (n Network) WalletBucket() Network {
	switch n {
	case NetworkBASE, NetworkARBITRUM, NetworkBSC, NetworkEVM:
		return NetworkEVM
	case NetworkSOLANA:
		return NetworkSOLANA
	case NetworkTON, NetworkTON_USDT:
		return NetworkTON
	default:
		return n
	}
}

func (n Network) IsSupportedWalletNetwork() bool {
	switch n {
	case NetworkTON, NetworkTRON, NetworkEVM, NetworkSOLANA:
		return true
	default:
		return false
	}
}

func (n Network) IsSupportedPayableNetwork() bool {
	switch n {
	case NetworkTON, NetworkTON_USDT, NetworkTRON, NetworkSOLANA, NetworkBASE, NetworkARBITRUM, NetworkBSC:
		return true
	default:
		return false
	}
}

func NormalizePaymentAsset(value string) PaymentAsset {
	return PaymentAsset(strings.ToUpper(strings.TrimSpace(value)))
}

func DefaultAssetForNetwork(network Network) PaymentAsset {
	switch network {
	case NetworkTON:
		return AssetGRAM
	case NetworkSOLANA:
		return AssetSOL
	case NetworkBSC:
		return AssetUSDT
	default:
		return AssetUSDT
	}
}

func IsSupportedPaymentOption(network Network, asset PaymentAsset) bool {
	switch network {
	case NetworkTON:
		return asset == AssetGRAM
	case NetworkTON_USDT, NetworkTRON:
		return asset == AssetUSDT
	case NetworkSOLANA:
		return asset == AssetSOL || asset == AssetUSDT || asset == AssetUSDC
	case NetworkBASE, NetworkARBITRUM:
		return asset == AssetUSDT || asset == AssetUSDC
	case NetworkBSC:
		return asset == AssetBNB || asset == AssetUSDT
	default:
		return false
	}
}

func IsNativeAsset(asset PaymentAsset) bool {
	return asset == AssetGRAM || asset == AssetSOL || asset == AssetBNB
}

type PaymentOptionSupport struct {
	Network      Network        `json:"network"`
	Assets       []PaymentAsset `json:"assets"`
	DefaultAsset PaymentAsset   `json:"default_asset"`
}

// SupportedPaymentOptions enumerates the payable network/asset matrix in a
// stable order. It is derived from IsSupportedPaymentOption so public
// consumers (MCP server, docs) cannot drift from the actual support checks.
func SupportedPaymentOptions() []PaymentOptionSupport {
	networks := []Network{NetworkTON, NetworkTON_USDT, NetworkTRON, NetworkSOLANA, NetworkBASE, NetworkARBITRUM, NetworkBSC}
	assets := []PaymentAsset{AssetGRAM, AssetUSDT, AssetUSDC, AssetSOL, AssetBNB}
	options := make([]PaymentOptionSupport, 0, len(networks))
	for _, network := range networks {
		supported := make([]PaymentAsset, 0, len(assets))
		for _, asset := range assets {
			if IsSupportedPaymentOption(network, asset) {
				supported = append(supported, asset)
			}
		}
		options = append(options, PaymentOptionSupport{
			Network:      network,
			Assets:       supported,
			DefaultAsset: DefaultAssetForNetwork(network),
		})
	}
	return options
}

func ValidateWalletAddress(network Network, address string) error {
	address = strings.TrimSpace(address)
	switch network {
	case NetworkTON, NetworkTON_USDT:
		if len(address) < 32 {
			return fmt.Errorf("TON address looks too short")
		}
	case NetworkTRON:
		if !strings.HasPrefix(address, "T") || len(address) < 20 {
			return fmt.Errorf("TRON address looks invalid")
		}
	case NetworkEVM:
		if !strings.HasPrefix(strings.ToLower(address), "0x") || len(address) != 42 {
			return fmt.Errorf("EVM address looks invalid")
		}
	case NetworkSOLANA:
		if len(address) < 32 || len(address) > 44 {
			return fmt.Errorf("Solana address looks invalid")
		}
		const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
		for _, char := range address {
			if !strings.ContainsRune(alphabet, char) {
				return fmt.Errorf("Solana address looks invalid")
			}
		}
	default:
		return fmt.Errorf("unsupported network")
	}
	return nil
}

type InvoiceStatus string

type InvoiceKind string

const (
	InvoiceStatusDraft           InvoiceStatus = "draft"
	InvoiceStatusAwaitingPayment InvoiceStatus = "awaiting_payment"
	InvoiceStatusPaid            InvoiceStatus = "paid"
	InvoiceStatusExpired         InvoiceStatus = "expired"
	InvoiceStatusUnderpaid       InvoiceStatus = "underpaid"
	InvoiceStatusOverpaid        InvoiceStatus = "overpaid"
	InvoiceStatusManualReview    InvoiceStatus = "manual_review"
)

const (
	InvoiceKindMerchant     InvoiceKind = "merchant"
	InvoiceKindSubscription InvoiceKind = "subscription"
)

type Environment string

const (
	EnvironmentTest Environment = "test"
	EnvironmentLive Environment = "live"
)

type MemberRole string

const (
	RoleOwner  MemberRole = "owner"
	RoleAdmin  MemberRole = "admin"
	RoleMember MemberRole = "member"
)

type User struct {
	ID         int64     `json:"id"`
	TelegramID int64     `json:"telegram_id"`
	Username   string    `json:"username"`
	Email      string    `json:"email"`
	CreatedAt  time.Time `json:"created_at"`
}

type AuthIdentity struct {
	ID             int64     `json:"id"`
	UserID         int64     `json:"user_id"`
	Provider       string    `json:"provider"`
	ProviderUserID string    `json:"provider_user_id"`
	Email          string    `json:"email"`
	EmailVerified  bool      `json:"email_verified"`
	DisplayName    string    `json:"display_name"`
	Username       string    `json:"username"`
	AvatarURL      string    `json:"avatar_url"`
	LinkedAt       time.Time `json:"linked_at"`
	LastLoginAt    time.Time `json:"last_login_at"`
}

type OAuthIdentityInput struct {
	Provider       string
	ProviderUserID string
	Email          string
	EmailVerified  bool
	DisplayName    string
	Username       string
	AvatarURL      string
}

type OAuthState struct {
	StateHash    string
	Provider     string
	Mode         string
	UserID       *int64
	RedirectPath string
	RefCode      string
	Attribution  *AttributionInput
	ExpiresAt    time.Time
}

type AdminUser struct {
	ID           int64      `json:"id"`
	Email        string     `json:"email"`
	DisplayName  string     `json:"display_name"`
	PasswordHash string     `json:"-"`
	IsActive     bool       `json:"is_active"`
	Roles        []string   `json:"roles"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	LastLoginAt  *time.Time `json:"last_login_at"`
}

type AdminSession struct {
	ID          int64      `json:"id"`
	AdminUserID int64      `json:"admin_user_id"`
	UserAgent   string     `json:"user_agent"`
	IPAddress   string     `json:"ip_address"`
	ExpiresAt   time.Time  `json:"expires_at"`
	RevokedAt   *time.Time `json:"revoked_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	LastUsedAt  time.Time  `json:"last_used_at"`
}

type AttributionInput struct {
	AttributionID string `json:"attribution_id"`
	TouchType     string `json:"touch_type"`
	Source        string `json:"source"`
	Medium        string `json:"medium"`
	Campaign      string `json:"campaign"`
	Term          string `json:"term"`
	Content       string `json:"content"`
	Country       string `json:"country"`
	LandingPath   string `json:"landing_path"`
	Referrer      string `json:"referrer"`
}

type Workspace struct {
	ID                 int64      `json:"id"`
	OwnerTelegramID    *int64     `json:"owner_telegram_id"`
	Username           string     `json:"username"`
	Email              string     `json:"email"`
	DefaultNetwork     Network    `json:"default_network"`
	Language           string     `json:"language"`
	PlanCode           PlanCode   `json:"plan_code"`
	SubscriptionEndsAt *time.Time `json:"subscription_ends_at"`
	FreeInvoicesUsed   int        `json:"free_invoices_used"`
	IsBlocked          bool       `json:"is_blocked"`
	TelegramLinkedAt   *time.Time `json:"telegram_linked_at"`
	DiscountPercent    int        `json:"discount_percent"`
	DiscountPlanCode   *string    `json:"discount_plan_code"`
	BotBlocked         bool       `json:"bot_blocked"`
	LastRetentionReminderAt *time.Time `json:"last_retention_reminder_at"`
	RetentionStage     *string    `json:"retention_stage"`
	CreatedAt          time.Time  `json:"created_at"`
}

// SupportedLanguages lists the interface languages shared by the web app and bot.
var SupportedLanguages = []string{"en", "ru", "uk", "uz", "de"}

// NormalizeLanguage maps arbitrary input to a supported language code, defaulting to English.
func NormalizeLanguage(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "ru", "ru-ru", "ru_ru", "russian":
		return "ru"
	case "uk", "uk-ua", "uk_ua", "ua", "ukrainian":
		return "uk"
	case "uz", "uz-uz", "uz_uz", "uzbek":
		return "uz"
	case "de", "de-de", "de_de", "de-at", "de_at", "de-ch", "de_ch", "german":
		return "de"
	default:
		return "en"
	}
}

func (w Workspace) HasActiveSubscription(now time.Time) bool {
	if w.SubscriptionEndsAt == nil {
		return false
	}
	if w.SubscriptionEndsAt.After(now) {
		return true
	}
	planCode := NormalizePlanCode(string(w.PlanCode))
	if planCode == PlanCodeDeveloper || planCode == PlanCodeBusiness {
		return w.SubscriptionEndsAt.Add(7 * 24 * time.Hour).After(now)
	}
	return false
}

func (w Workspace) EffectivePlanCode(now time.Time) PlanCode {
	if !w.HasActiveSubscription(now) {
		return PlanCodeTrial
	}
	planCode := NormalizePlanCode(string(w.PlanCode))
	if planCode == PlanCodeTrial {
		return PlanCodeMerchant
	}
	return planCode
}

func (w Workspace) EffectivePlan(now time.Time) PlanDefinition {
	return ResolvePlan(w.EffectivePlanCode(now))
}

type WorkspaceMember struct {
	WorkspaceID int64      `json:"workspace_id"`
	UserID      int64      `json:"user_id"`
	Role        MemberRole `json:"role"`
	CreatedAt   time.Time  `json:"created_at"`
}

type Wallet struct {
	ID          int64       `json:"id"`
	WorkspaceID int64       `json:"workspace_id"`
	Network     Network     `json:"network"`
	Address     string      `json:"address"`
	Environment Environment `json:"environment"`
	IsActive    bool        `json:"is_active"`
	CreatedAt   time.Time   `json:"created_at"`
}

type Invoice struct {
	ID                 int64            `json:"id"`
	PublicID           string           `json:"public_id"`
	WorkspaceID        int64            `json:"workspace_id"`
	Kind               InvoiceKind      `json:"kind"`
	SubscriptionDays   int              `json:"subscription_days"`
	PlanCode           PlanCode         `json:"plan_code"`
	Title              string           `json:"title"`
	BaseAmountUSD      decimal.Decimal  `json:"base_amount_usd"`
	PayableAmount      decimal.Decimal  `json:"payable_amount"`
	PayableNetwork     Network          `json:"payable_network"`
	DestinationAddress string           `json:"destination_address"`
	PaymentComment     *string          `json:"payment_comment"`
	MatchingSuffix     *decimal.Decimal `json:"matching_suffix"`
	PayableAsset       PaymentAsset     `json:"payable_asset"`
	PaymentOptions     []PaymentOption  `json:"payment_options,omitempty"`
	Status             InvoiceStatus    `json:"status"`
	Environment        Environment      `json:"environment"`
	ExpiresAt          time.Time        `json:"expires_at"`
	TxHash             *string          `json:"tx_hash"`
	PaidAt             *time.Time       `json:"paid_at"`
	ReceivedAmount     decimal.Decimal  `json:"received_amount"`
	LastPaymentEventID *int64           `json:"last_payment_event_id,omitempty"`
	ReviewReason       *string          `json:"review_reason,omitempty"`
	FinalizedAt        *time.Time       `json:"finalized_at,omitempty"`
	Mode               string           `json:"mode"`
	CreatedAt          time.Time        `json:"created_at"`
}

func (i Invoice) IsExpired(now time.Time) bool {
	return now.After(i.ExpiresAt) && i.Status == InvoiceStatusAwaitingPayment
}

type PaymentEvent struct {
	ID                 int64           `json:"id"`
	TxHash             string          `json:"tx_hash"`
	Network            Network         `json:"network"`
	Asset              PaymentAsset    `json:"asset"`
	DestinationAddress string          `json:"destination_address"`
	Amount             decimal.Decimal `json:"amount"`
	PaymentComment     *string         `json:"payment_comment"`
	Environment        Environment     `json:"environment"`
	ObservedAt         time.Time       `json:"observed_at"`
	RawPayload         json.RawMessage `json:"raw_payload"`
	MatchedInvoiceID   *int64          `json:"matched_invoice_id"`
	Classification     string          `json:"classification"`
	ExternalEventID    string          `json:"external_event_id"`
	AllocatedAmount    decimal.Decimal `json:"allocated_amount"`
	CreatedAt          time.Time       `json:"created_at"`
}

type ObservedTransfer struct {
	TxHash             string
	ExternalEventID    string
	Network            Network
	Asset              PaymentAsset
	DestinationAddress string
	Amount             decimal.Decimal
	PaymentComment     string
	ObservedAt         time.Time
	RawPayload         json.RawMessage
}

type WatchedWallet struct {
	PollNetwork    Network
	PayableNetwork Network
	Asset          PaymentAsset
	Address        string
	Environment    Environment
}

type NotificationJob struct {
	ID                  int64
	WorkspaceID         int64
	RecipientTelegramID int64
	Message             string
	Payload             json.RawMessage
	Attempts            int
}

type BlogPost struct {
	ID                    int64           `json:"id"`
	Slug                  string          `json:"slug"`
	Title                 string          `json:"title"`
	H1                    *string         `json:"h1"`
	ContentMD             string          `json:"content_md"`
	ContentJSON           json.RawMessage `json:"content_json,omitempty"`
	ContentVersion        int             `json:"content_version"`
	Excerpt               *string         `json:"excerpt"`
	CoverImageURL         *string         `json:"cover_image_url"`
	Author                *string         `json:"author"`
	IsPublished           bool            `json:"is_published"`
	Status                string          `json:"status"`
	MetaTitle             *string         `json:"meta_title"`
	MetaDescription       *string         `json:"meta_description"`
	CanonicalURL          *string         `json:"canonical_url"`
	OGTitle               *string         `json:"og_title"`
	OGDescription         *string         `json:"og_description"`
	OGImageURL            *string         `json:"og_image_url"`
	CoverImageAlt         *string         `json:"cover_image_alt"`
	RobotsIndex           bool            `json:"robots_index"`
	RobotsFollow          bool            `json:"robots_follow"`
	IncludeInSitemap      bool            `json:"include_in_sitemap"`
	AuthorSlug            string          `json:"author_slug"`
	Tags                  []string        `json:"tags"`
	Locale                string          `json:"locale"`
	PreviewToken          *string         `json:"preview_token"`
	InternalLinksCount    int             `json:"internal_links_count"`
	InternalLinkingStatus string          `json:"internal_linking_status"`
	PublishedAt           *time.Time      `json:"published_at"`
	CreatedAt             time.Time       `json:"created_at"`
	UpdatedAt             time.Time       `json:"updated_at"`
	// AvailableLocales is not persisted; it is populated on read to expose which
	// locale translations of this slug are published.
	AvailableLocales []string `json:"available_locales,omitempty"`
}

type PromoCode struct {
	ID              int64      `json:"id"`
	Code            string     `json:"code"`
	DurationDays    int        `json:"duration_days"`
	PlanCode        PlanCode   `json:"plan_code"`
	ExpiresAt       *time.Time `json:"expires_at"`
	MaxUses         *int       `json:"max_uses"`
	UsesCount       int        `json:"uses_count"`
	DiscountPercent int        `json:"discount_percent"`
	CreatedBy       string     `json:"created_by"`
	CreatedAt       time.Time  `json:"created_at"`
}

type PromoCodeRedemption struct {
	ID          int64     `json:"id"`
	PromoCodeID int64     `json:"promo_code_id"`
	WorkspaceID int64     `json:"workspace_id"`
	RedeemedAt  time.Time `json:"redeemed_at"`
}

type WorkspaceRetentionCandidate struct {
	ID                      int64
	OwnerTelegramID         int64
	Language                string
	CreatedAt               time.Time
	LastRetentionReminderAt *time.Time
	RetentionStage          *string
	WalletCount             int
	InvoiceCount            int
	PaidInvoiceCount        int
	LastInvoiceCreatedAt    *time.Time
	FreeInvoicesUsed        int
	PlanCode                string
}

type ScheduledBroadcast struct {
	ID          int64      `json:"id"`
	Message     string     `json:"message"`
	ScheduledAt time.Time  `json:"scheduled_at"`
	Status      string     `json:"status"` // "pending", "sent"
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	SentAt      *time.Time `json:"sent_at,omitempty"`
}
