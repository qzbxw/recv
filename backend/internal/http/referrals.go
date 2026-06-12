package http

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"recv/backend/internal/store"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

var referralCodePattern = regexp.MustCompile(`^[a-z0-9][a-z0-9_-]{2,39}$`)

type referralPartnerPayload struct {
	Code                string  `json:"code"`
	Name                string  `json:"name"`
	Contact             string  `json:"contact"`
	CommissionPct       string  `json:"commission_pct"`
	LaunchCommissionPct string  `json:"launch_commission_pct"`
	LaunchEndsAt        string  `json:"launch_ends_at"`
	PayoutAddress       string  `json:"payout_address"`
	Notes               string  `json:"notes"`
	IsArchived          bool    `json:"is_archived"`
	LaunchMonths        float64 `json:"launch_months"`
}

func normalizeReferralCode(code string) (string, error) {
	code = strings.ToLower(strings.TrimSpace(code))
	if code == "" {
		return "", nil
	}
	if !referralCodePattern.MatchString(code) {
		return "", errors.New("referral code must be 3-40 chars: lowercase letters, digits, '-' or '_'")
	}
	return code, nil
}

// generateReferralCode derives a readable default code from the partner name
// plus a short random suffix, e.g. "ivan-shops-3f2a".
func generateReferralCode(name string) string {
	var builder strings.Builder
	for _, ch := range strings.ToLower(strings.TrimSpace(name)) {
		switch {
		case ch >= 'a' && ch <= 'z' || ch >= '0' && ch <= '9':
			builder.WriteRune(ch)
		case ch == ' ' || ch == '-' || ch == '_' || ch == '.':
			builder.WriteByte('-')
		}
	}
	slug := strings.Trim(builder.String(), "-")
	if len(slug) > 24 {
		slug = strings.Trim(slug[:24], "-")
	}
	var buf [2]byte
	suffix := strconv.FormatInt(time.Now().UnixNano()%0xffff, 16)
	if _, err := rand.Read(buf[:]); err == nil {
		suffix = hex.EncodeToString(buf[:])
	}
	if slug == "" {
		return "partner-" + suffix
	}
	return slug + "-" + suffix
}

func normalizeReferralPartnerPayload(payload referralPartnerPayload, generateCode bool) (store.ReferralPartnerInput, error) {
	name := strings.TrimSpace(payload.Name)
	if name == "" {
		return store.ReferralPartnerInput{}, errors.New("partner name is required")
	}

	code, err := normalizeReferralCode(payload.Code)
	if err != nil {
		return store.ReferralPartnerInput{}, err
	}
	if code == "" && generateCode {
		code = generateReferralCode(name)
	}

	commission := decimal.NewFromInt(25)
	if strings.TrimSpace(payload.CommissionPct) != "" {
		commission, err = decimal.NewFromString(strings.TrimSpace(payload.CommissionPct))
		if err != nil {
			return store.ReferralPartnerInput{}, errors.New("invalid commission_pct")
		}
	}
	if commission.LessThan(decimal.Zero) || commission.GreaterThan(decimal.NewFromInt(100)) {
		return store.ReferralPartnerInput{}, errors.New("commission_pct must be between 0 and 100")
	}

	input := store.ReferralPartnerInput{
		Code:          code,
		Name:          name,
		Contact:       strings.TrimSpace(payload.Contact),
		CommissionPct: commission,
		PayoutAddress: strings.TrimSpace(payload.PayoutAddress),
		Notes:         strings.TrimSpace(payload.Notes),
		IsArchived:    payload.IsArchived,
	}

	if strings.TrimSpace(payload.LaunchCommissionPct) != "" {
		launchPct, err := decimal.NewFromString(strings.TrimSpace(payload.LaunchCommissionPct))
		if err != nil {
			return store.ReferralPartnerInput{}, errors.New("invalid launch_commission_pct")
		}
		if launchPct.LessThan(decimal.Zero) || launchPct.GreaterThan(decimal.NewFromInt(100)) {
			return store.ReferralPartnerInput{}, errors.New("launch_commission_pct must be between 0 and 100")
		}
		input.LaunchCommissionPct = &launchPct

		switch {
		case strings.TrimSpace(payload.LaunchEndsAt) != "":
			endsAt, err := time.Parse(time.RFC3339, strings.TrimSpace(payload.LaunchEndsAt))
			if err != nil {
				return store.ReferralPartnerInput{}, errors.New("launch_ends_at must be RFC3339")
			}
			input.LaunchEndsAt = &endsAt
		case payload.LaunchMonths > 0:
			if payload.LaunchMonths > 12 {
				return store.ReferralPartnerInput{}, errors.New("launch_months must be at most 12")
			}
			endsAt := time.Now().UTC().Add(time.Duration(payload.LaunchMonths * 30 * 24 * float64(time.Hour)))
			input.LaunchEndsAt = &endsAt
		default:
			return store.ReferralPartnerInput{}, errors.New("launch rate needs launch_months or launch_ends_at")
		}
	}

	return input, nil
}

func (s *Server) handleAdminListReferralPartners(c *gin.Context) {
	items, err := s.store.ListReferralPartners(c.Request.Context())
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (s *Server) handleAdminCreateReferralPartner(c *gin.Context) {
	var payload referralPartnerPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid referral partner payload"})
		return
	}
	input, err := normalizeReferralPartnerPayload(payload, true)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	partner, err := s.store.CreateReferralPartner(c.Request.Context(), input)
	if err != nil {
		if strings.Contains(err.Error(), "already taken") {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		respondError(c, http.StatusInternalServerError, err)
		return
	}

	_ = s.store.RecordAdminAuditEvent(c.Request.Context(), adminActor(c), "referral_partner_created", "referral_partner", strconv.FormatInt(partner.ID, 10), gin.H{"code": partner.Code, "name": partner.Name})
	c.JSON(http.StatusCreated, gin.H{"partner": partner})
}

func (s *Server) handleAdminUpdateReferralPartner(c *gin.Context) {
	partnerID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid partner id"})
		return
	}
	var payload referralPartnerPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid referral partner payload"})
		return
	}
	input, err := normalizeReferralPartnerPayload(payload, false)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	partner, err := s.store.UpdateReferralPartner(c.Request.Context(), partnerID, input)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, store.ErrNotFound) {
			status = http.StatusNotFound
		}
		respondError(c, status, err)
		return
	}

	_ = s.store.RecordAdminAuditEvent(c.Request.Context(), adminActor(c), "referral_partner_updated", "referral_partner", strconv.FormatInt(partner.ID, 10), gin.H{"code": partner.Code, "is_archived": partner.IsArchived})
	c.JSON(http.StatusOK, gin.H{"partner": partner})
}

func (s *Server) handleAdminReferralPartnerReport(c *gin.Context) {
	partnerID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid partner id"})
		return
	}
	report, err := s.store.GetReferralPartnerReport(c.Request.Context(), partnerID)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, store.ErrNotFound) {
			status = http.StatusNotFound
		}
		respondError(c, status, err)
		return
	}
	c.JSON(http.StatusOK, report)
}

func (s *Server) handleAdminCreateReferralPayout(c *gin.Context) {
	partnerID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid partner id"})
		return
	}
	var body struct {
		AmountUSD string `json:"amount_usd"`
		Note      string `json:"note"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payout payload"})
		return
	}
	amount, err := decimal.NewFromString(strings.TrimSpace(body.AmountUSD))
	if err != nil || amount.LessThanOrEqual(decimal.Zero) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "amount_usd must be a positive number"})
		return
	}

	payout, err := s.store.CreateReferralPayout(c.Request.Context(), partnerID, amount, strings.TrimSpace(body.Note), adminActor(c))
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, store.ErrNotFound) {
			status = http.StatusNotFound
		} else if errors.Is(err, store.ErrReferralPayoutExceedsBalance) {
			status = http.StatusBadRequest
		}
		respondError(c, status, err)
		return
	}

	_ = s.store.RecordAdminAuditEvent(c.Request.Context(), adminActor(c), "referral_payout_recorded", "referral_partner", strconv.FormatInt(partnerID, 10), gin.H{"amount_usd": payout.AmountUSD, "note": payout.Note})
	c.JSON(http.StatusCreated, gin.H{"payout": payout})
}

// handlePublicReferralCode lets the signup form confirm a referral code is
// valid before the merchant commits to it. Codes are public by design (they
// live in shared links), so this endpoint only exposes existence and the
// partner's display name.
func (s *Server) handlePublicReferralCode(c *gin.Context) {
	code, err := normalizeReferralCode(c.Param("code"))
	if err != nil || code == "" {
		c.JSON(http.StatusOK, gin.H{"valid": false})
		return
	}
	partner, err := s.store.GetReferralPartnerByCode(c.Request.Context(), code)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			c.JSON(http.StatusOK, gin.H{"valid": false})
			return
		}
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"valid": true, "partner_name": partner.Name, "code": partner.Code})
}

func adminActor(c *gin.Context) string {
	admin := adminFromContext(c)
	if admin.Claims.Username != "" {
		return admin.Claims.Username
	}
	return "admin"
}
