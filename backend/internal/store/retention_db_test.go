package store

import (
	"context"
	"testing"
)

func TestRetentionAndBroadcastFlow(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	// 1. Create a few test workspaces
	w1, err := st.UpsertWorkspaceByTelegram(ctx, 90011, "retention_user_1")
	if err != nil {
		t.Fatalf("failed to create user 1: %v", err)
	}

	_, err = st.UpsertWorkspaceByTelegram(ctx, 90012, "retention_user_2")
	if err != nil {
		t.Fatalf("failed to create user 2: %v", err)
	}

	w3, err := st.UpsertWorkspaceByTelegram(ctx, 90013, "retention_user_3")
	if err != nil {
		t.Fatalf("failed to create user 3: %v", err)
	}

	// 2. Test GetEligibleTelegramBroadcastUsersCount
	count, err := st.GetEligibleTelegramBroadcastUsersCount(ctx)
	if err != nil {
		t.Fatalf("failed to get broadcast count: %v", err)
	}
	// There may be other users in the DB from other tests, so we save the base count
	baseCount := count

	// 3. Mark user 2 bot blocked
	err = st.SetBotBlockedByTelegramID(ctx, 90012, true)
	if err != nil {
		t.Fatalf("failed to set bot blocked: %v", err)
	}

	// Verify count decreases
	count, err = st.GetEligibleTelegramBroadcastUsersCount(ctx)
	if err != nil {
		t.Fatalf("failed to get broadcast count after block: %v", err)
	}
	if count != baseCount-1 {
		t.Fatalf("expected count %d, got %d", baseCount-1, count)
	}

	// 4. Test CreateTelegramBroadcast
	queued, err := st.CreateTelegramBroadcast(ctx, "Test Broadcast message")
	if err != nil {
		t.Fatalf("failed to create broadcast: %v", err)
	}
	if queued != count {
		t.Fatalf("expected queued count to match eligible count (%d), got %d", count, queued)
	}

	// 5. Verify UpsertWorkspaceByTelegram resets bot_blocked to false
	w2Updated, err := st.UpsertWorkspaceByTelegram(ctx, 90012, "retention_user_2")
	if err != nil {
		t.Fatalf("failed to upsert user 2 again: %v", err)
	}
	if w2Updated.BotBlocked {
		t.Fatalf("expected BotBlocked to be reset to false on user interaction")
	}

	// 6. Test GetRetentionCandidates
	// By default, since they are brand new (created_at is now), they shouldn't show up in no_wallet candidates until 4 hours have passed.
	candidates, err := st.GetRetentionCandidates(ctx)
	if err != nil {
		t.Fatalf("failed to get retention candidates: %v", err)
	}

	// Modify w1 created_at to 5 hours ago and set language to Russian, plan_code to developer
	_, err = st.pool.Exec(ctx, `UPDATE workspaces SET created_at = NOW() - INTERVAL '5 hours', language = 'ru', plan_code = 'developer', free_invoices_used = 3 WHERE id = $1`, w1.ID)
	if err != nil {
		t.Fatalf("failed to update workspace for user 1: %v", err)
	}

	candidates, err = st.GetRetentionCandidates(ctx)
	if err != nil {
		t.Fatalf("failed to get retention candidates: %v", err)
	}

	var foundW1 bool
	for _, c := range candidates {
		if c.ID == w1.ID {
			foundW1 = true
			if c.WalletCount != 0 {
				t.Fatalf("expected 0 wallets, got %d", c.WalletCount)
			}
			if c.PlanCode != "developer" {
				t.Fatalf("expected plan_code developer, got %s", c.PlanCode)
			}
			if c.FreeInvoicesUsed != 3 {
				t.Fatalf("expected free_invoices_used 3, got %d", c.FreeInvoicesUsed)
			}
			if c.Language != "ru" {
				t.Fatalf("expected normalized language ru, got %s", c.Language)
			}
		}
	}
	if !foundW1 {
		t.Fatalf("expected user 1 to be a candidate for no_wallet reminder")
	}

	// 7. Test QueueRetentionReminder
	payload := MustJSON(map[string]any{"action": "test"})
	err = st.QueueRetentionReminder(ctx, w1.ID, 90011, "Hello user 1", payload, "no_wallet")
	if err != nil {
		t.Fatalf("failed to queue retention reminder: %v", err)
	}

	// Verify w1 is no longer candidate (since last_retention_reminder_at is set to now)
	candidates, err = st.GetRetentionCandidates(ctx)
	if err != nil {
		t.Fatalf("failed to get candidates: %v", err)
	}
	for _, c := range candidates {
		if c.ID == w1.ID {
			t.Fatalf("expected user 1 to be filtered out because it received a reminder recently")
		}
	}

	// 8. Test ClaimNotificationJobs skips blocked users
	// Queue a notification for w3
	_, err = st.pool.Exec(ctx, `
		INSERT INTO notification_outbox (workspace_id, recipient_telegram_id, message)
		VALUES ($1, $2, 'Test message for w3')
	`, w3.ID, 90013)
	if err != nil {
		t.Fatalf("failed to insert outbox message: %v", err)
	}

	// Claim jobs: should find it
	jobs, err := st.ClaimNotificationJobs(ctx, 10)
	if err != nil {
		t.Fatalf("failed to claim: %v", err)
	}
	var foundJob bool
	for _, job := range jobs {
		if job.WorkspaceID == w3.ID {
			foundJob = true
		}
	}
	if !foundJob {
		t.Fatalf("expected to claim job for user 3")
	}

	// Mark w3 bot blocked, queue another, and claim: should skip
	err = st.SetBotBlockedByTelegramID(ctx, 90013, true)
	if err != nil {
		t.Fatalf("failed to block w3: %v", err)
	}

	_, err = st.pool.Exec(ctx, `
		INSERT INTO notification_outbox (workspace_id, recipient_telegram_id, message)
		VALUES ($1, $2, 'Another test message for w3')
	`, w3.ID, 90013)
	if err != nil {
		t.Fatalf("failed to insert second outbox message: %v", err)
	}

	jobs, err = st.ClaimNotificationJobs(ctx, 10)
	if err != nil {
		t.Fatalf("failed to claim: %v", err)
	}
	for _, job := range jobs {
		if job.WorkspaceID == w3.ID {
			t.Fatalf("should not claim job for bot_blocked user 3")
		}
	}
}
