package store

import (
	"context"
	"testing"
	"time"
)

func TestPromoCodes(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	// Create workspace to redeem the promo code
	ws, err := st.UpsertWorkspaceByTelegram(ctx, 80001, "promo_user")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	t.Run("Create and List Promo Codes", func(t *testing.T) {
		maxUses := 5
		expiresAt := time.Now().Add(time.Hour)
		p, err := st.CreatePromoCode(ctx, "SAVE10", 30, PlanCodeBusiness, &expiresAt, &maxUses, 0, "admin1")
		if err != nil {
			t.Fatalf("CreatePromoCode: %v", err)
		}

		if p.Code != "SAVE10" {
			t.Errorf("Expected code SAVE10, got %s", p.Code)
		}
		if p.DurationDays != 30 {
			t.Errorf("Expected duration 30, got %d", p.DurationDays)
		}
		if p.PlanCode != PlanCodeBusiness {
			t.Errorf("Expected plan business, got %s", p.PlanCode)
		}
		if p.MaxUses == nil || *p.MaxUses != 5 {
			t.Errorf("Expected max uses 5, got %v", p.MaxUses)
		}

		list, err := st.ListPromoCodes(ctx)
		if err != nil {
			t.Fatalf("ListPromoCodes: %v", err)
		}
		if len(list) == 0 {
			t.Fatal("Expected non-empty list of promo codes")
		}
		found := false
		for _, promo := range list {
			if promo.Code == "SAVE10" {
				found = true
				break
			}
		}
		if !found {
			t.Error("Expected SAVE10 promo code to be in the list")
		}
	})

	t.Run("Successful Redemption", func(t *testing.T) {
		p, err := st.CreatePromoCode(ctx, "REDEEM30", 30, PlanCodeMerchant, nil, nil, 0, "admin1")
		if err != nil {
			t.Fatalf("CreatePromoCode: %v", err)
		}

		updatedWs, err := st.RedeemPromoCode(ctx, ws.ID, p.Code)
		if err != nil {
			t.Fatalf("RedeemPromoCode failed: %v", err)
		}

		if updatedWs.PlanCode != PlanCodeMerchant {
			t.Errorf("Expected plan to update to merchant, got %s", updatedWs.PlanCode)
		}
		if updatedWs.SubscriptionEndsAt == nil {
			t.Error("Expected SubscriptionEndsAt to be set")
		} else {
			expectedMinTime := time.Now().AddDate(0, 0, 29)
			if updatedWs.SubscriptionEndsAt.Before(expectedMinTime) {
				t.Errorf("Expected subscription to end in ~30 days, got %v", updatedWs.SubscriptionEndsAt)
			}
		}

		// Verify uses_count incremented
		list, err := st.ListPromoCodes(ctx)
		if err != nil {
			t.Fatalf("ListPromoCodes: %v", err)
		}
		var updatedPromo *PromoCode
		for i := range list {
			if list[i].Code == "REDEEM30" {
				updatedPromo = &list[i]
				break
			}
		}
		if updatedPromo == nil {
			t.Fatal("Promo code REDEEM30 not found after redemption")
		}
		if updatedPromo.UsesCount != 1 {
			t.Errorf("Expected uses count to be 1, got %d", updatedPromo.UsesCount)
		}
	})

	t.Run("Prevent Double Redemption by Same Workspace", func(t *testing.T) {
		p, err := st.CreatePromoCode(ctx, "ONCEONLY", 15, PlanCodeMerchant, nil, nil, 0, "admin")
		if err != nil {
			t.Fatalf("CreatePromoCode: %v", err)
		}

		_, err = st.RedeemPromoCode(ctx, ws.ID, p.Code)
		if err != nil {
			t.Fatalf("First redemption: %v", err)
		}

		_, err = st.RedeemPromoCode(ctx, ws.ID, p.Code)
		if err != ErrPromoCodeAlreadyUsed {
			t.Fatalf("Expected ErrPromoCodeAlreadyUsed on second redemption, got: %v", err)
		}
	})

	t.Run("Expired Promo Code", func(t *testing.T) {
		past := time.Now().Add(-time.Hour)
		p, err := st.CreatePromoCode(ctx, "EXPIRED_CODE", 30, PlanCodeMerchant, &past, nil, 0, "admin")
		if err != nil {
			t.Fatalf("CreatePromoCode: %v", err)
		}

		_, err = st.RedeemPromoCode(ctx, ws.ID, p.Code)
		if err != ErrPromoCodeExpired {
			t.Fatalf("Expected ErrPromoCodeExpired, got: %v", err)
		}
	})

	t.Run("Max Uses Limit reached", func(t *testing.T) {
		limit := 1
		p, err := st.CreatePromoCode(ctx, "LIMITED_USES", 30, PlanCodeMerchant, nil, &limit, 0, "admin")
		if err != nil {
			t.Fatalf("CreatePromoCode: %v", err)
		}

		// Redeem once on ws
		_, err = st.RedeemPromoCode(ctx, ws.ID, p.Code)
		if err != nil {
			t.Fatalf("First redemption: %v", err)
		}

		// Create another workspace to attempt second use
		ws2, err := st.UpsertWorkspaceByTelegram(ctx, 80002, "promo_user_2")
		if err != nil {
			t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
		}

		_, err = st.RedeemPromoCode(ctx, ws2.ID, p.Code)
		if err != ErrPromoCodeMaxUsesLimit {
			t.Fatalf("Expected ErrPromoCodeMaxUsesLimit, got: %v", err)
		}
	})

	t.Run("Delete Promo Code", func(t *testing.T) {
		p, err := st.CreatePromoCode(ctx, "DELETE_ME", 30, PlanCodeMerchant, nil, nil, 0, "admin")
		if err != nil {
			t.Fatalf("CreatePromoCode: %v", err)
		}

		err = st.DeletePromoCode(ctx, p.ID)
		if err != nil {
			t.Fatalf("DeletePromoCode: %v", err)
		}

		list, err := st.ListPromoCodes(ctx)
		if err != nil {
			t.Fatalf("ListPromoCodes: %v", err)
		}
		for _, promo := range list {
			if promo.Code == "DELETE_ME" {
				t.Error("Deleted promo code should not be in the list")
			}
		}
	})

	t.Run("Discount Promo Code Creation and Redemption", func(t *testing.T) {
		// 1. Create a workspace with default/trial plan
		dws, err := st.UpsertWorkspaceByTelegram(ctx, 90001, "discount_user")
		if err != nil {
			t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
		}

		// 2. Create discount promo code restricted to PlanCodeBusiness
		p, err := st.CreatePromoCode(ctx, "BIZDISC20", 0, PlanCodeBusiness, nil, nil, 20, "admin")
		if err != nil {
			t.Fatalf("CreatePromoCode with discount: %v", err)
		}

		if p.DiscountPercent != 20 {
			t.Errorf("Expected discount percent 20, got %d", p.DiscountPercent)
		}
		if p.PlanCode != PlanCodeBusiness {
			t.Errorf("Expected plan code %s, got %s", PlanCodeBusiness, p.PlanCode)
		}

		// 3. Redeem discount promo code
		updatedWs, err := st.RedeemPromoCode(ctx, dws.ID, p.Code)
		if err != nil {
			t.Fatalf("RedeemPromoCode failed: %v", err)
		}

		// Verify plan was NOT updated (since duration_days is 0)
		if updatedWs.PlanCode != dws.PlanCode {
			t.Errorf("Expected plan code to remain unchanged (%s), got %s", dws.PlanCode, updatedWs.PlanCode)
		}

		// Verify discount was applied
		if updatedWs.DiscountPercent != 20 {
			t.Errorf("Expected workspace discount percent 20, got %d", updatedWs.DiscountPercent)
		}
		if updatedWs.DiscountPlanCode == nil || *updatedWs.DiscountPlanCode != string(PlanCodeBusiness) {
			t.Errorf("Expected workspace discount plan code 'business', got %v", updatedWs.DiscountPlanCode)
		}

		// 4. Create another promo code that is general (no plan restriction)
		p2, err := st.CreatePromoCode(ctx, "ANYDISC10", 0, "", nil, nil, 10, "admin")
		if err != nil {
			t.Fatalf("CreatePromoCode: %v", err)
		}

		if p2.PlanCode != "" {
			t.Errorf("Expected empty plan code, got %s", p2.PlanCode)
		}

		updatedWs2, err := st.RedeemPromoCode(ctx, dws.ID, p2.Code)
		if err != nil {
			t.Fatalf("RedeemPromoCode failed: %v", err)
		}

		if updatedWs2.DiscountPercent != 10 {
			t.Errorf("Expected workspace discount percent 10, got %d", updatedWs2.DiscountPercent)
		}
		if updatedWs2.DiscountPlanCode != nil {
			t.Errorf("Expected workspace discount plan code nil, got %v", updatedWs2.DiscountPlanCode)
		}
	})
}
