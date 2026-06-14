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
		p, err := st.CreatePromoCode(ctx, "SAVE10", 30, PlanCodeBusiness, &expiresAt, &maxUses, "admin1")
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
		p, err := st.CreatePromoCode(ctx, "REDEEM30", 30, PlanCodeMerchant, nil, nil, "admin1")
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
		p, err := st.CreatePromoCode(ctx, "ONCEONLY", 15, PlanCodeMerchant, nil, nil, "admin")
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
		p, err := st.CreatePromoCode(ctx, "EXPIRED_CODE", 30, PlanCodeMerchant, &past, nil, "admin")
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
		p, err := st.CreatePromoCode(ctx, "LIMITED_USES", 30, PlanCodeMerchant, nil, &limit, "admin")
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
		p, err := st.CreatePromoCode(ctx, "DELETE_ME", 30, PlanCodeMerchant, nil, nil, "admin")
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
}
