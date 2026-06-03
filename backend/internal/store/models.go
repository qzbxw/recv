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
	case NetworkTON, NetworkTRON, NetworkEVM:
		return true
	default:
		return false
	}
}

func (n Network) IsSupportedPayableNetwork() bool {
	switch n {
	case NetworkTON, NetworkTON_USDT, NetworkTRON, NetworkBASE, NetworkBSC:
		return true
	default:
		return false
	}
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

type AdminUser struct {
	ID           int64      `json:"id"`
	Email        string     `json:"email"`
	DisplayName  string     `json:"display_name"`
	PasswordHash string     `json:"-"`
	TOTPSecret   string     `json:"-"`
	TOTPEnabled  bool       `json:"totp_enabled"`
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
	LandingPath   string `json:"landing_path"`
	Referrer      string `json:"referrer"`
}

type Workspace struct {
	ID                 int64      `json:"id"`
	OwnerTelegramID    *int64     `json:"owner_telegram_id"`
	Username           string     `json:"username"`
	Email              string     `json:"email"`
	DefaultNetwork     Network    `json:"default_network"`
	PlanCode           PlanCode   `json:"plan_code"`
	SubscriptionEndsAt *time.Time `json:"subscription_ends_at"`
	FreeInvoicesUsed   int        `json:"free_invoices_used"`
	IsBlocked          bool       `json:"is_blocked"`
	TelegramLinkedAt   *time.Time `json:"telegram_linked_at"`
	CreatedAt          time.Time  `json:"created_at"`
}

func (w Workspace) HasActiveSubscription(now time.Time) bool {
	return w.SubscriptionEndsAt != nil && w.SubscriptionEndsAt.After(now)
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
	DestinationAddress string
	Amount             decimal.Decimal
	PaymentComment     string
	ObservedAt         time.Time
	RawPayload         json.RawMessage
}

type WatchedWallet struct {
	PollNetwork    Network
	PayableNetwork Network
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
	ID                    int64      `json:"id"`
	Slug                  string     `json:"slug"`
	Title                 string     `json:"title"`
	ContentMD             string     `json:"content_md"`
	Excerpt               *string    `json:"excerpt"`
	CoverImageURL         *string    `json:"cover_image_url"`
	Author                *string    `json:"author"`
	IsPublished           bool       `json:"is_published"`
	Status                string     `json:"status"`
	MetaTitle             *string    `json:"meta_title"`
	MetaDescription       *string    `json:"meta_description"`
	CanonicalURL          *string    `json:"canonical_url"`
	Tags                  []string   `json:"tags"`
	Locale                string     `json:"locale"`
	PreviewToken          *string    `json:"preview_token"`
	InternalLinksCount    int        `json:"internal_links_count"`
	InternalLinkingStatus string     `json:"internal_linking_status"`
	PublishedAt           *time.Time `json:"published_at"`
	CreatedAt             time.Time  `json:"created_at"`
	UpdatedAt             time.Time  `json:"updated_at"`
}
