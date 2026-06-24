package http

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"recv/backend/internal/store"

	"github.com/shopspring/decimal"
)

// errorAt configures a mockStore to fail at a specific named operation.
const (
	errAtListAdminInvoices          = "ListAdminInvoices"
	errAtListAdminFailedWebhooks    = "ListAdminFailedWebhooks"
	errAtListAdminWatchers          = "ListAdminWatchers"
	errAtGetAdminNotificationHealth = "GetAdminNotificationHealth"

	errAtCountAPIRequestsSinceMinute = "CountAPIRequestsSinceMinute"
	errAtCountActiveAPIKeys          = "CountActiveAPIKeys"
	errAtListWebhookEndpoints        = "ListWebhookEndpoints"

	errAtListWorkspaceMembers = "ListWorkspaceMembers"
	errAtListWorkspaceInvites = "ListWorkspaceInvites"

	errAtGetWorkspaceByID           = "GetWorkspaceByID"
	errAtCountAPIRequestsSinceMonth = "CountAPIRequestsSinceMonth"
	errAtAllowRateLimit             = "AllowRateLimit"

	errAtSetInvoiceStatus          = "SetInvoiceStatus"
	errAtMarkInvoicePaidManual     = "MarkInvoicePaidManual"
	errAtUpdateWorkspaceEmail      = "UpdateWorkspaceEmail"
	errAtUpdateWorkspaceLanguage   = "UpdateWorkspaceLanguage"
	errAtCreateWallet              = "CreateWallet"
	errAtCreateWorkspaceInvite     = "CreateWorkspaceInvite"
	errAtRevokeWorkspaceInvite     = "RevokeWorkspaceInvite"
	errAtCountWorkspaceOwners      = "CountWorkspaceOwners"
	errAtUpdateWorkspaceMemberRole = "UpdateWorkspaceMemberRole"
	errAtRemoveWorkspaceMember     = "RemoveWorkspaceMember"
	errAtSetWorkspaceBlocked       = "SetWorkspaceBlocked"
)

// mockHTTPStore wraps a real *store.Store and injects errors at specific named points.
type mockHTTPStore struct {
	real                         *store.Store
	failAt                       string
	callN                        int // tracks call count for methods used multiple times
	countAPIRequestsReturn       int // if > 0, overrides CountAPIRequestsSince return value on first call
	getWorkspaceMemberRoleCallN  int // tracks calls to GetWorkspaceMemberRole
	failGetWorkspaceMemberRoleAt int // fails on this call number (0 = never)
}

func newMockStore(real *store.Store, failAt string) *mockHTTPStore {
	return &mockHTTPStore{real: real, failAt: failAt}
}

func newMockStoreWithCount(real *store.Store, monthCount int) *mockHTTPStore {
	return &mockHTTPStore{real: real, countAPIRequestsReturn: monthCount}
}

func (m *mockHTTPStore) mockErr(name string) error {
	return fmt.Errorf("mock failure at %s", name)
}

// AllowRateLimit delegates or fails.
func (m *mockHTTPStore) AllowRateLimit(ctx context.Context, key string, limit int, window time.Duration) (int, bool, error) {
	if m.failAt == errAtAllowRateLimit {
		return 0, false, m.mockErr(errAtAllowRateLimit)
	}
	return m.real.AllowRateLimit(ctx, key, limit, window)
}

func (m *mockHTTPStore) CompleteIdempotencyRecord(ctx context.Context, id int64, statusCode int, response json.RawMessage) error {
	return m.real.CompleteIdempotencyRecord(ctx, id, statusCode, response)
}

func (m *mockHTTPStore) CompleteInvoicePayment(ctx context.Context, invoiceID int64, previousStatus store.InvoiceStatus, paymentEventID int64, txHash string, status store.InvoiceStatus, classification string, observedAmount decimal.Decimal, paidAt time.Time) (store.Invoice, error) {
	return m.real.CompleteInvoicePayment(ctx, invoiceID, previousStatus, paymentEventID, txHash, status, classification, observedAmount, paidAt)
}

func (m *mockHTTPStore) CountAPIRequestsSince(ctx context.Context, workspaceID int64, keyID *int64, since time.Time) (int, error) {
	m.callN++
	if m.failAt == errAtCountAPIRequestsSinceMonth && m.callN == 1 {
		return 0, m.mockErr(errAtCountAPIRequestsSinceMonth)
	}
	if m.failAt == errAtCountAPIRequestsSinceMinute && m.callN == 2 {
		return 0, m.mockErr(errAtCountAPIRequestsSinceMinute)
	}
	if m.countAPIRequestsReturn > 0 && m.callN == 1 {
		return m.countAPIRequestsReturn, nil
	}
	return m.real.CountAPIRequestsSince(ctx, workspaceID, keyID, since)
}

func (m *mockHTTPStore) CountActiveAPIKeys(ctx context.Context, workspaceID int64) (int, error) {
	if m.failAt == errAtCountActiveAPIKeys {
		return 0, m.mockErr(errAtCountActiveAPIKeys)
	}
	return m.real.CountActiveAPIKeys(ctx, workspaceID)
}

func (m *mockHTTPStore) CountWorkspaceOwners(ctx context.Context, workspaceID int64) (int, error) {
	if m.failAt == errAtCountWorkspaceOwners {
		return 0, m.mockErr(errAtCountWorkspaceOwners)
	}
	return m.real.CountWorkspaceOwners(ctx, workspaceID)
}

func (m *mockHTTPStore) CreateAPIKey(ctx context.Context, workspaceID int64, label string, prefix string, tokenHash string, scopes []string, mode string) (store.APIKey, error) {
	return m.real.CreateAPIKey(ctx, workspaceID, label, prefix, tokenHash, scopes, mode)
}

func (m *mockHTTPStore) CreateAdminInternalComment(ctx context.Context, targetType string, targetID string, body string, author string) (store.AdminInternalComment, error) {
	return m.real.CreateAdminInternalComment(ctx, targetType, targetID, body, author)
}

func (m *mockHTTPStore) CreateBlogPost(ctx context.Context, post store.BlogPost) (store.BlogPost, error) {
	return m.real.CreateBlogPost(ctx, post)
}

func (m *mockHTTPStore) CreateMedia(ctx context.Context, media store.Media) (store.Media, error) {
	return m.real.CreateMedia(ctx, media)
}

func (m *mockHTTPStore) GetMediaByID(ctx context.Context, id int64) (store.Media, error) {
	return m.real.GetMediaByID(ctx, id)
}

func (m *mockHTTPStore) GetMediaByFileNames(ctx context.Context, fileNames []string) (map[string]store.Media, error) {
	return m.real.GetMediaByFileNames(ctx, fileNames)
}

func (m *mockHTTPStore) ListMedia(ctx context.Context, page, pageSize int) ([]store.Media, int, error) {
	return m.real.ListMedia(ctx, page, pageSize)
}

func (m *mockHTTPStore) UpdateMediaAlt(ctx context.Context, id int64, altText string) (store.Media, error) {
	return m.real.UpdateMediaAlt(ctx, id, altText)
}

func (m *mockHTTPStore) DeleteMedia(ctx context.Context, id int64) error {
	return m.real.DeleteMedia(ctx, id)
}

func (m *mockHTTPStore) CountMediaReferences(ctx context.Context, mediaURL string) (int, error) {
	return m.real.CountMediaReferences(ctx, mediaURL)
}

func (m *mockHTTPStore) CreateIdempotencyRecord(ctx context.Context, workspaceID int64, apiKeyID int64, method string, path string, key string, requestHash string) (store.IdempotencyRecord, error) {
	return m.real.CreateIdempotencyRecord(ctx, workspaceID, apiKeyID, method, path, key, requestHash)
}

func (m *mockHTTPStore) CreateWallet(ctx context.Context, workspaceID int64, network store.Network, address string, env ...store.Environment) (store.Wallet, error) {
	if m.failAt == errAtCreateWallet {
		return store.Wallet{}, m.mockErr(errAtCreateWallet)
	}
	return m.real.CreateWallet(ctx, workspaceID, network, address, env...)
}

func (m *mockHTTPStore) CreateWebhookEndpoint(ctx context.Context, workspaceID int64, label string, endpointURL string, secret string, environment string) (store.WebhookEndpoint, error) {
	return m.real.CreateWebhookEndpoint(ctx, workspaceID, label, endpointURL, secret, environment)
}

func (m *mockHTTPStore) CreateWorkspaceInvite(ctx context.Context, workspaceID int64, username string, role store.MemberRole, invitedBy int64) (store.WorkspaceInvite, error) {
	if m.failAt == errAtCreateWorkspaceInvite {
		return store.WorkspaceInvite{}, m.mockErr(errAtCreateWorkspaceInvite)
	}
	return m.real.CreateWorkspaceInvite(ctx, workspaceID, username, role, invitedBy)
}

func (m *mockHTTPStore) DeactivateWallet(ctx context.Context, workspaceID int64, walletID int64) error {
	return m.real.DeactivateWallet(ctx, workspaceID, walletID)
}

func (m *mockHTTPStore) DeactivateWebhookEndpoint(ctx context.Context, workspaceID int64, endpointID int64) error {
	return m.real.DeactivateWebhookEndpoint(ctx, workspaceID, endpointID)
}

func (m *mockHTTPStore) DeleteBlogPost(ctx context.Context, id int64) error {
	return m.real.DeleteBlogPost(ctx, id)
}

func (m *mockHTTPStore) GetAPIKeyByTokenHash(ctx context.Context, tokenHash string) (store.APIKeyRecord, error) {
	return m.real.GetAPIKeyByTokenHash(ctx, tokenHash)
}

func (m *mockHTTPStore) GetWebVitalsReport(ctx context.Context, from time.Time, to time.Time) (store.WebVitalsReport, error) {
	return m.real.GetWebVitalsReport(ctx, from, to)
}

func (m *mockHTTPStore) GetAdminAnalytics(ctx context.Context, from time.Time, to time.Time, groupBy string) (store.AdminAnalytics, error) {
	return m.real.GetAdminAnalytics(ctx, from, to, groupBy)
}

func (m *mockHTTPStore) GetAdminNotificationHealth(ctx context.Context) (store.AdminNotificationHealth, error) {
	if m.failAt == errAtGetAdminNotificationHealth {
		return store.AdminNotificationHealth{}, m.mockErr(errAtGetAdminNotificationHealth)
	}
	return m.real.GetAdminNotificationHealth(ctx)
}

func (m *mockHTTPStore) GetAdminOverview(ctx context.Context) (store.AdminOverview, error) {
	return m.real.GetAdminOverview(ctx)
}

func (m *mockHTTPStore) GetBlogPostBySlug(ctx context.Context, slug string, locale string) (store.BlogPost, error) {
	return m.real.GetBlogPostBySlug(ctx, slug, locale)
}

func (m *mockHTTPStore) ListPublishedBlogLocalesBySlug(ctx context.Context, slug string) ([]string, error) {
	return m.real.ListPublishedBlogLocalesBySlug(ctx, slug)
}

func (m *mockHTTPStore) ListPublishedBlogLocalesBySlugs(ctx context.Context, slugs []string) (map[string][]string, error) {
	return m.real.ListPublishedBlogLocalesBySlugs(ctx, slugs)
}

func (m *mockHTTPStore) ListPublishedBlogSitemapPosts(ctx context.Context, page, pageSize int, locale string) ([]store.BlogPost, int, error) {
	return m.real.ListPublishedBlogSitemapPosts(ctx, page, pageSize, locale)
}

func (m *mockHTTPStore) GetIdempotencyRecord(ctx context.Context, workspaceID int64, apiKeyID int64, method string, path string, key string) (store.IdempotencyRecord, error) {
	return m.real.GetIdempotencyRecord(ctx, workspaceID, apiKeyID, method, path, key)
}

func (m *mockHTTPStore) GetInvoiceByID(ctx context.Context, workspaceID int64, invoiceID int64) (store.Invoice, error) {
	return m.real.GetInvoiceByID(ctx, workspaceID, invoiceID)
}

func (m *mockHTTPStore) GetInvoiceByPublicID(ctx context.Context, publicID string) (store.Invoice, error) {
	return m.real.GetInvoiceByPublicID(ctx, publicID)
}

func (m *mockHTTPStore) GetSystemConfig(ctx context.Context, key string) (store.SystemConfig, error) {
	return m.real.GetSystemConfig(ctx, key)
}

func (m *mockHTTPStore) UpsertSystemConfig(ctx context.Context, key string, value any, isSecret bool, updatedBy string) error {
	return m.real.UpsertSystemConfig(ctx, key, value, isSecret, updatedBy)
}

func (m *mockHTTPStore) ListSEORedirects(ctx context.Context) ([]store.SEORedirect, error) {
	return m.real.ListSEORedirects(ctx)
}

func (m *mockHTTPStore) CreateSEORedirect(ctx context.Context, redirect store.SEORedirect) (store.SEORedirect, error) {
	return m.real.CreateSEORedirect(ctx, redirect)
}

func (m *mockHTTPStore) UpdateSEORedirect(ctx context.Context, id int64, redirect store.SEORedirect) (store.SEORedirect, error) {
	return m.real.UpdateSEORedirect(ctx, id, redirect)
}

func (m *mockHTTPStore) DeleteSEORedirect(ctx context.Context, id int64) error {
	return m.real.DeleteSEORedirect(ctx, id)
}

func (m *mockHTTPStore) ResolveSEORedirect(ctx context.Context, sourcePath string) (store.SEORedirect, error) {
	return m.real.ResolveSEORedirect(ctx, sourcePath)
}

func (m *mockHTTPStore) GetWorkspaceByID(ctx context.Context, workspaceID int64) (store.Workspace, error) {
	if m.failAt == errAtGetWorkspaceByID {
		return store.Workspace{}, m.mockErr(errAtGetWorkspaceByID)
	}
	return m.real.GetWorkspaceByID(ctx, workspaceID)
}

func (m *mockHTTPStore) GetWorkspaceMemberRole(ctx context.Context, workspaceID, userID int64) (store.MemberRole, error) {
	m.getWorkspaceMemberRoleCallN++
	if m.failGetWorkspaceMemberRoleAt > 0 && m.getWorkspaceMemberRoleCallN == m.failGetWorkspaceMemberRoleAt {
		return "", m.mockErr("GetWorkspaceMemberRole")
	}
	if m.real == nil {
		return store.RoleOwner, nil
	}
	return m.real.GetWorkspaceMemberRole(ctx, workspaceID, userID)
}

func (m *mockHTTPStore) GrantPRO(ctx context.Context, workspaceID int64, days int) (store.Workspace, error) {
	return m.real.GrantPRO(ctx, workspaceID, days)
}

func (m *mockHTTPStore) ListAPIKeys(ctx context.Context, workspaceID int64) ([]store.APIKey, error) {
	return m.real.ListAPIKeys(ctx, workspaceID)
}

func (m *mockHTTPStore) ListAdminAuditEvents(ctx context.Context, limit int) ([]store.AdminAuditEvent, error) {
	return m.real.ListAdminAuditEvents(ctx, limit)
}

func (m *mockHTTPStore) ListAdminFailedWebhooks(ctx context.Context, limit int) ([]store.AdminWebhookDeliveryRecord, error) {
	if m.failAt == errAtListAdminFailedWebhooks {
		return nil, m.mockErr(errAtListAdminFailedWebhooks)
	}
	return m.real.ListAdminFailedWebhooks(ctx, limit)
}

func (m *mockHTTPStore) ListAdminInvoices(ctx context.Context, filters store.AdminInvoiceFilters) (store.AdminInvoicePage, error) {
	if m.failAt == errAtListAdminInvoices {
		return store.AdminInvoicePage{}, m.mockErr(errAtListAdminInvoices)
	}
	return m.real.ListAdminInvoices(ctx, filters)
}

func (m *mockHTTPStore) ListAdminWallets(ctx context.Context, filters store.AdminWalletFilters) (store.AdminWalletPage, error) {
	return m.real.ListAdminWallets(ctx, filters)
}


func (m *mockHTTPStore) ListAdminWatchers(ctx context.Context) ([]store.AdminWatcherRecord, error) {
	if m.failAt == errAtListAdminWatchers {
		return nil, m.mockErr(errAtListAdminWatchers)
	}
	return m.real.ListAdminWatchers(ctx)
}

func (m *mockHTTPStore) ListAdminWorkspaces(ctx context.Context, limit int) ([]store.AdminWorkspaceRecord, error) {
	return m.real.ListAdminWorkspaces(ctx, limit)
}

func (m *mockHTTPStore) ListAuthIdentities(ctx context.Context, userID int64) ([]store.AuthIdentity, error) {
	if m.real == nil {
		return nil, nil
	}
	return m.real.ListAuthIdentities(ctx, userID)
}

func (m *mockHTTPStore) CreateTelegramBroadcast(ctx context.Context, message string) (int64, error) {
	if m.failAt == "CreateTelegramBroadcast" {
		return 0, errors.New("injected error")
	}
	return m.real.CreateTelegramBroadcast(ctx, message)
}

func (m *mockHTTPStore) GetEligibleTelegramBroadcastUsersCount(ctx context.Context) (int64, error) {
	if m.failAt == "GetEligibleTelegramBroadcastUsersCount" {
		return 0, errors.New("injected error")
	}
	return m.real.GetEligibleTelegramBroadcastUsersCount(ctx)
}

func (m *mockHTTPStore) ListBlogPosts(ctx context.Context, page, pageSize int, onlyPublished bool) ([]store.BlogPost, int, error) {
	return m.real.ListBlogPosts(ctx, page, pageSize, onlyPublished)
}

func (m *mockHTTPStore) ListPublishedBlogPosts(ctx context.Context, page, pageSize int, locale string) ([]store.BlogPost, int, error) {
	return m.real.ListPublishedBlogPosts(ctx, page, pageSize, locale)
}

func (m *mockHTTPStore) ListInvoices(ctx context.Context, workspaceID int64, filter store.ListInvoicesFilter) ([]store.Invoice, int, error) {
	return m.real.ListInvoices(ctx, workspaceID, filter)
}

func (m *mockHTTPStore) ListSEOTargets(ctx context.Context) ([]store.SEOTarget, error) {
	return m.real.ListSEOTargets(ctx)
}

func (m *mockHTTPStore) ListWallets(ctx context.Context, workspaceID int64) ([]store.Wallet, error) {
	return m.real.ListWallets(ctx, workspaceID)
}

func (m *mockHTTPStore) ListWebhookDeliveries(ctx context.Context, workspaceID int64, limit int) ([]store.WebhookDelivery, error) {
	return m.real.ListWebhookDeliveries(ctx, workspaceID, limit)
}

func (m *mockHTTPStore) ListWebhookEndpoints(ctx context.Context, workspaceID int64) ([]store.WebhookEndpoint, error) {
	if m.failAt == errAtListWebhookEndpoints {
		return nil, m.mockErr(errAtListWebhookEndpoints)
	}
	return m.real.ListWebhookEndpoints(ctx, workspaceID)
}

func (m *mockHTTPStore) ListWorkspaceInvites(ctx context.Context, workspaceID int64) ([]store.WorkspaceInvite, error) {
	if m.failAt == errAtListWorkspaceInvites {
		return nil, m.mockErr(errAtListWorkspaceInvites)
	}
	return m.real.ListWorkspaceInvites(ctx, workspaceID)
}

func (m *mockHTTPStore) ListWorkspaceMembers(ctx context.Context, workspaceID int64) ([]store.WorkspaceMemberDetail, error) {
	if m.failAt == errAtListWorkspaceMembers {
		return nil, m.mockErr(errAtListWorkspaceMembers)
	}
	return m.real.ListWorkspaceMembers(ctx, workspaceID)
}

func (m *mockHTTPStore) ListWorkspacesForUser(ctx context.Context, userID int64) ([]store.Workspace, error) {
	return m.real.ListWorkspacesForUser(ctx, userID)
}

func (m *mockHTTPStore) MarkInvoicePaidManual(ctx context.Context, workspaceID int64, invoiceID int64) (store.Invoice, error) {
	if m.failAt == errAtMarkInvoicePaidManual {
		return store.Invoice{}, m.mockErr(errAtMarkInvoicePaidManual)
	}
	return m.real.MarkInvoicePaidManual(ctx, workspaceID, invoiceID)
}

func (m *mockHTTPStore) RecordAPIRequest(ctx context.Context, workspaceID int64, keyID int64, method string, path string, statusCode int) error {
	return m.real.RecordAPIRequest(ctx, workspaceID, keyID, method, path, statusCode)
}

func (m *mockHTTPStore) RecordAdminAuditEvent(ctx context.Context, actor string, action string, targetType string, targetID string, metadata any) error {
	return m.real.RecordAdminAuditEvent(ctx, actor, action, targetType, targetID, metadata)
}

func (m *mockHTTPStore) RecordProductEvent(ctx context.Context, input store.ProductEventInput) error {
	return m.real.RecordProductEvent(ctx, input)
}

func (m *mockHTTPStore) RecordUTMEvent(ctx context.Context, event store.UTMEventInput) error {
	return m.real.RecordUTMEvent(ctx, event)
}

func (m *mockHTTPStore) RecordWebVital(ctx context.Context, vital store.WebVital) error {
	return m.real.RecordWebVital(ctx, vital)
}

func (m *mockHTTPStore) RecordUTMVisit(ctx context.Context, attr store.AttributionInput) error {
	return m.real.RecordUTMVisit(ctx, attr)
}

func (m *mockHTTPStore) GetUTMReport(ctx context.Context, from time.Time, to time.Time) (store.UTMReport, error) {
	return m.real.GetUTMReport(ctx, from, to)
}

func (m *mockHTTPStore) ListReferralPartners(ctx context.Context) ([]store.ReferralPartnerStats, error) {
	return m.real.ListReferralPartners(ctx)
}

func (m *mockHTTPStore) CreateReferralPartner(ctx context.Context, input store.ReferralPartnerInput) (store.ReferralPartner, error) {
	return m.real.CreateReferralPartner(ctx, input)
}

func (m *mockHTTPStore) UpdateReferralPartner(ctx context.Context, id int64, input store.ReferralPartnerInput) (store.ReferralPartner, error) {
	return m.real.UpdateReferralPartner(ctx, id, input)
}

func (m *mockHTTPStore) GetReferralPartnerByCode(ctx context.Context, code string) (store.ReferralPartner, error) {
	return m.real.GetReferralPartnerByCode(ctx, code)
}

func (m *mockHTTPStore) GetReferralPartnerReport(ctx context.Context, partnerID int64) (store.ReferralPartnerReport, error) {
	return m.real.GetReferralPartnerReport(ctx, partnerID)
}

func (m *mockHTTPStore) CreateReferralPayout(ctx context.Context, partnerID int64, amountUSD decimal.Decimal, note string, createdBy string) (store.ReferralPayout, error) {
	return m.real.CreateReferralPayout(ctx, partnerID, amountUSD, note, createdBy)
}

func (m *mockHTTPStore) RefreshAdminInvoiceStatus(ctx context.Context, invoiceID int64) (store.Invoice, string, error) {
	return m.real.RefreshAdminInvoiceStatus(ctx, invoiceID)
}

func (m *mockHTTPStore) RemoveWorkspaceMember(ctx context.Context, workspaceID, userID int64) error {
	if m.failAt == errAtRemoveWorkspaceMember {
		return m.mockErr(errAtRemoveWorkspaceMember)
	}
	return m.real.RemoveWorkspaceMember(ctx, workspaceID, userID)
}

func (m *mockHTTPStore) ResendAdminWebhookDelivery(ctx context.Context, deliveryID int64) (store.WebhookDelivery, error) {
	return m.real.ResendAdminWebhookDelivery(ctx, deliveryID)
}

func (m *mockHTTPStore) ResendWebhookDelivery(ctx context.Context, workspaceID int64, deliveryID int64) (store.WebhookDelivery, error) {
	return m.real.ResendWebhookDelivery(ctx, workspaceID, deliveryID)
}

func (m *mockHTTPStore) ReviewAdminInvoice(ctx context.Context, invoiceID int64, result string, comment string, actor string) (store.Invoice, string, error) {
	return m.real.ReviewAdminInvoice(ctx, invoiceID, result, comment, actor)
}

func (m *mockHTTPStore) RevokeAPIKey(ctx context.Context, workspaceID int64, keyID int64) error {
	return m.real.RevokeAPIKey(ctx, workspaceID, keyID)
}

func (m *mockHTTPStore) RevokeWorkspaceInvite(ctx context.Context, workspaceID, inviteID int64) error {
	if m.failAt == errAtRevokeWorkspaceInvite {
		return m.mockErr(errAtRevokeWorkspaceInvite)
	}
	return m.real.RevokeWorkspaceInvite(ctx, workspaceID, inviteID)
}

func (m *mockHTTPStore) RotateWebhookEndpointSecret(ctx context.Context, workspaceID int64, endpointID int64, secret string) (store.WebhookEndpoint, error) {
	return m.real.RotateWebhookEndpointSecret(ctx, workspaceID, endpointID, secret)
}

func (m *mockHTTPStore) SetInvoiceStatus(ctx context.Context, workspaceID int64, invoiceID int64, status store.InvoiceStatus) (store.Invoice, error) {
	if m.failAt == errAtSetInvoiceStatus {
		return store.Invoice{}, m.mockErr(errAtSetInvoiceStatus)
	}
	return m.real.SetInvoiceStatus(ctx, workspaceID, invoiceID, status)
}

func (m *mockHTTPStore) SetWorkspaceBlocked(ctx context.Context, workspaceID int64, blocked bool) (store.Workspace, error) {
	if m.failAt == errAtSetWorkspaceBlocked {
		return store.Workspace{}, m.mockErr(errAtSetWorkspaceBlocked)
	}
	return m.real.SetWorkspaceBlocked(ctx, workspaceID, blocked)
}

func (m *mockHTTPStore) SetWorkspacePlan(ctx context.Context, workspaceID int64, planCode store.PlanCode, days int, subscriptionEndsAt *time.Time) (store.Workspace, error) {
	return m.real.SetWorkspacePlan(ctx, workspaceID, planCode, days, subscriptionEndsAt)
}

func (m *mockHTTPStore) TouchAPIKeyLastUsed(ctx context.Context, keyID int64) error {
	return m.real.TouchAPIKeyLastUsed(ctx, keyID)
}

func (m *mockHTTPStore) UpdateBlogPost(ctx context.Context, id int64, post store.BlogPost) (store.BlogPost, error) {
	return m.real.UpdateBlogPost(ctx, id, post)
}

func (m *mockHTTPStore) UpdateWorkspaceEmail(ctx context.Context, workspaceID int64, email string) (store.Workspace, error) {
	if m.failAt == errAtUpdateWorkspaceEmail {
		return store.Workspace{}, m.mockErr(errAtUpdateWorkspaceEmail)
	}
	return m.real.UpdateWorkspaceEmail(ctx, workspaceID, email)
}

func (m *mockHTTPStore) UpdateWorkspaceLanguage(ctx context.Context, workspaceID int64, language string) (store.Workspace, error) {
	if m.failAt == errAtUpdateWorkspaceLanguage {
		return store.Workspace{}, m.mockErr(errAtUpdateWorkspaceLanguage)
	}
	return m.real.UpdateWorkspaceLanguage(ctx, workspaceID, language)
}

func (m *mockHTTPStore) UpdateWorkspaceMemberRole(ctx context.Context, workspaceID, userID int64, role store.MemberRole) error {
	if m.failAt == errAtUpdateWorkspaceMemberRole {
		return m.mockErr(errAtUpdateWorkspaceMemberRole)
	}
	return m.real.UpdateWorkspaceMemberRole(ctx, workspaceID, userID, role)
}

func (m *mockHTTPStore) CreatePromoCode(ctx context.Context, code string, durationDays int, planCode store.PlanCode, expiresAt *time.Time, maxUses *int, discountPercent int, createdBy string) (store.PromoCode, error) {
	return m.real.CreatePromoCode(ctx, code, durationDays, planCode, expiresAt, maxUses, discountPercent, createdBy)
}

func (m *mockHTTPStore) ListPromoCodes(ctx context.Context) ([]store.PromoCode, error) {
	return m.real.ListPromoCodes(ctx)
}

func (m *mockHTTPStore) DeletePromoCode(ctx context.Context, id int64) error {
	return m.real.DeletePromoCode(ctx, id)
}

func (m *mockHTTPStore) RedeemPromoCode(ctx context.Context, workspaceID int64, code string) (store.Workspace, error) {
	return m.real.RedeemPromoCode(ctx, workspaceID, code)
}
