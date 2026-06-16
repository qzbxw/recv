package http

import (
	"context"
	"encoding/json"
	"time"

	"recv/backend/internal/store"

	"github.com/shopspring/decimal"
)

// httpStore defines the subset of store.Store methods used by the HTTP server.
// The real *store.Store satisfies this interface; test doubles can override specific methods.
type httpStore interface {
	AllowRateLimit(ctx context.Context, key string, limit int, window time.Duration) (int, bool, error)
	CompleteIdempotencyRecord(ctx context.Context, id int64, statusCode int, response json.RawMessage) error
	CompleteInvoicePayment(ctx context.Context, invoiceID int64, previousStatus store.InvoiceStatus, paymentEventID int64, txHash string, status store.InvoiceStatus, classification string, observedAmount decimal.Decimal, paidAt time.Time) (store.Invoice, error)
	CountAPIRequestsSince(ctx context.Context, workspaceID int64, keyID *int64, since time.Time) (int, error)
	CountActiveAPIKeys(ctx context.Context, workspaceID int64) (int, error)
	CountWorkspaceOwners(ctx context.Context, workspaceID int64) (int, error)
	CreateAPIKey(ctx context.Context, workspaceID int64, label string, prefix string, tokenHash string, scopes []string, mode string) (store.APIKey, error)
	CreateAdminInternalComment(ctx context.Context, targetType string, targetID string, body string, author string) (store.AdminInternalComment, error)
	CreateBlogPost(ctx context.Context, post store.BlogPost) (store.BlogPost, error)
	CreateMedia(ctx context.Context, m store.Media) (store.Media, error)
	GetMediaByID(ctx context.Context, id int64) (store.Media, error)
	GetMediaByFileNames(ctx context.Context, fileNames []string) (map[string]store.Media, error)
	ListMedia(ctx context.Context, page, pageSize int) ([]store.Media, int, error)
	UpdateMediaAlt(ctx context.Context, id int64, altText string) (store.Media, error)
	DeleteMedia(ctx context.Context, id int64) error
	CountMediaReferences(ctx context.Context, mediaURL string) (int, error)
	CreateIdempotencyRecord(ctx context.Context, workspaceID int64, apiKeyID int64, method string, path string, key string, requestHash string) (store.IdempotencyRecord, error)
	CreateWallet(ctx context.Context, workspaceID int64, network store.Network, address string, env ...store.Environment) (store.Wallet, error)
	CreateWebhookEndpoint(ctx context.Context, workspaceID int64, label string, endpointURL string, secret string, environment string) (store.WebhookEndpoint, error)
	CreateWorkspaceInvite(ctx context.Context, workspaceID int64, username string, role store.MemberRole, invitedBy int64) (store.WorkspaceInvite, error)
	DeactivateWallet(ctx context.Context, workspaceID int64, walletID int64) error
	DeactivateWebhookEndpoint(ctx context.Context, workspaceID int64, endpointID int64) error
	DeleteBlogPost(ctx context.Context, id int64) error
	GetAPIKeyByTokenHash(ctx context.Context, tokenHash string) (store.APIKeyRecord, error)
	GetAdminAnalytics(ctx context.Context, from time.Time, to time.Time, groupBy string) (store.AdminAnalytics, error)
	GetAdminNotificationHealth(ctx context.Context) (store.AdminNotificationHealth, error)
	GetAdminOverview(ctx context.Context) (store.AdminOverview, error)
	GetWebVitalsReport(ctx context.Context, from time.Time, to time.Time) (store.WebVitalsReport, error)
	GetBlogPostBySlug(ctx context.Context, slug string, locale string) (store.BlogPost, error)
	ListPublishedBlogLocalesBySlug(ctx context.Context, slug string) ([]string, error)
	ListPublishedBlogLocalesBySlugs(ctx context.Context, slugs []string) (map[string][]string, error)
	GetIdempotencyRecord(ctx context.Context, workspaceID int64, apiKeyID int64, method string, path string, key string) (store.IdempotencyRecord, error)
	GetInvoiceByID(ctx context.Context, workspaceID int64, invoiceID int64) (store.Invoice, error)
	GetInvoiceByPublicID(ctx context.Context, publicID string) (store.Invoice, error)
	GetSystemConfig(ctx context.Context, key string) (store.SystemConfig, error)
	UpsertSystemConfig(ctx context.Context, key string, value any, isSecret bool, updatedBy string) error
	GetWorkspaceByID(ctx context.Context, workspaceID int64) (store.Workspace, error)
	GetWorkspaceMemberRole(ctx context.Context, workspaceID, userID int64) (store.MemberRole, error)
	GrantPRO(ctx context.Context, workspaceID int64, days int) (store.Workspace, error)
	ListAPIKeys(ctx context.Context, workspaceID int64) ([]store.APIKey, error)
	ListAdminAuditEvents(ctx context.Context, limit int) ([]store.AdminAuditEvent, error)
	ListAdminFailedWebhooks(ctx context.Context, limit int) ([]store.AdminWebhookDeliveryRecord, error)
	ListAdminInvoices(ctx context.Context, filters store.AdminInvoiceFilters) (store.AdminInvoicePage, error)
	ListAdminWatchers(ctx context.Context) ([]store.AdminWatcherRecord, error)
	ListAdminWorkspaces(ctx context.Context, limit int) ([]store.AdminWorkspaceRecord, error)
	ListAuthIdentities(ctx context.Context, userID int64) ([]store.AuthIdentity, error)
	ListBlogPosts(ctx context.Context, page, pageSize int, onlyPublished bool) ([]store.BlogPost, int, error)
	ListPublishedBlogPosts(ctx context.Context, page, pageSize int, locale string) ([]store.BlogPost, int, error)
	ListPublishedBlogSitemapPosts(ctx context.Context, page, pageSize int, locale string) ([]store.BlogPost, int, error)
	ListInvoices(ctx context.Context, workspaceID int64, filter store.ListInvoicesFilter) ([]store.Invoice, int, error)
	ListSEOTargets(ctx context.Context) ([]store.SEOTarget, error)
	ListSEORedirects(ctx context.Context) ([]store.SEORedirect, error)
	ListWallets(ctx context.Context, workspaceID int64) ([]store.Wallet, error)
	ListWebhookDeliveries(ctx context.Context, workspaceID int64, limit int) ([]store.WebhookDelivery, error)
	ListWebhookEndpoints(ctx context.Context, workspaceID int64) ([]store.WebhookEndpoint, error)
	ListWorkspaceInvites(ctx context.Context, workspaceID int64) ([]store.WorkspaceInvite, error)
	ListWorkspaceMembers(ctx context.Context, workspaceID int64) ([]store.WorkspaceMemberDetail, error)
	ListWorkspacesForUser(ctx context.Context, userID int64) ([]store.Workspace, error)
	MarkInvoicePaidManual(ctx context.Context, workspaceID int64, invoiceID int64) (store.Invoice, error)
	RecordAPIRequest(ctx context.Context, workspaceID int64, keyID int64, method string, path string, statusCode int) error
	RecordAdminAuditEvent(ctx context.Context, actor string, action string, targetType string, targetID string, metadata any) error
	RecordProductEvent(ctx context.Context, input store.ProductEventInput) error
	RecordWebVital(ctx context.Context, vital store.WebVital) error
	RecordUTMVisit(ctx context.Context, attr store.AttributionInput) error
	GetUTMReport(ctx context.Context, from time.Time, to time.Time) (store.UTMReport, error)
	ListReferralPartners(ctx context.Context) ([]store.ReferralPartnerStats, error)
	CreateReferralPartner(ctx context.Context, input store.ReferralPartnerInput) (store.ReferralPartner, error)
	UpdateReferralPartner(ctx context.Context, id int64, input store.ReferralPartnerInput) (store.ReferralPartner, error)
	GetReferralPartnerByCode(ctx context.Context, code string) (store.ReferralPartner, error)
	GetReferralPartnerReport(ctx context.Context, partnerID int64) (store.ReferralPartnerReport, error)
	CreateReferralPayout(ctx context.Context, partnerID int64, amountUSD decimal.Decimal, note string, createdBy string) (store.ReferralPayout, error)
	CreateSEORedirect(ctx context.Context, redirect store.SEORedirect) (store.SEORedirect, error)
	UpdateSEORedirect(ctx context.Context, id int64, redirect store.SEORedirect) (store.SEORedirect, error)
	DeleteSEORedirect(ctx context.Context, id int64) error
	ResolveSEORedirect(ctx context.Context, sourcePath string) (store.SEORedirect, error)
	RefreshAdminInvoiceStatus(ctx context.Context, invoiceID int64) (store.Invoice, string, error)
	RemoveWorkspaceMember(ctx context.Context, workspaceID, userID int64) error
	ResendAdminWebhookDelivery(ctx context.Context, deliveryID int64) (store.WebhookDelivery, error)
	ResendWebhookDelivery(ctx context.Context, workspaceID int64, deliveryID int64) (store.WebhookDelivery, error)
	ReviewAdminInvoice(ctx context.Context, invoiceID int64, result string, comment string, actor string) (store.Invoice, string, error)
	RevokeAPIKey(ctx context.Context, workspaceID int64, keyID int64) error
	RevokeWorkspaceInvite(ctx context.Context, workspaceID, inviteID int64) error
	RotateWebhookEndpointSecret(ctx context.Context, workspaceID int64, endpointID int64, secret string) (store.WebhookEndpoint, error)
	SetInvoiceStatus(ctx context.Context, workspaceID int64, invoiceID int64, status store.InvoiceStatus) (store.Invoice, error)
	SetWorkspaceBlocked(ctx context.Context, workspaceID int64, blocked bool) (store.Workspace, error)
	SetWorkspacePlan(ctx context.Context, workspaceID int64, planCode store.PlanCode, days int, subscriptionEndsAt *time.Time) (store.Workspace, error)
	TouchAPIKeyLastUsed(ctx context.Context, keyID int64) error
	UpdateBlogPost(ctx context.Context, id int64, post store.BlogPost) (store.BlogPost, error)
	UpdateWorkspaceEmail(ctx context.Context, workspaceID int64, email string) (store.Workspace, error)
	UpdateWorkspaceLanguage(ctx context.Context, workspaceID int64, language string) (store.Workspace, error)
	UpdateWorkspaceMemberRole(ctx context.Context, workspaceID, userID int64, role store.MemberRole) error
	CreatePromoCode(ctx context.Context, code string, durationDays int, planCode store.PlanCode, expiresAt *time.Time, maxUses *int, discountPercent int, createdBy string) (store.PromoCode, error)
	ListPromoCodes(ctx context.Context) ([]store.PromoCode, error)
	DeletePromoCode(ctx context.Context, id int64) error
	RedeemPromoCode(ctx context.Context, workspaceID int64, code string) (store.Workspace, error)
}
