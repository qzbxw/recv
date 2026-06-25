package store

import (
	"context"
	"testing"
	"time"
)

func TestScheduledBroadcasts(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	// 1. Create a workspace to ensure there is an eligible user for broadcast
	ws, err := st.UpsertWorkspaceByTelegram(ctx, 123456, "test_broadcast_user")
	if err != nil {
		t.Fatalf("failed to create workspace: %v", err)
	}

	// 2. Create Scheduled Broadcast
	schedTime := time.Now().Add(1 * time.Hour).Truncate(time.Second)
	sb, err := st.CreateScheduledBroadcast(ctx, "Hello scheduled!", schedTime)
	if err != nil {
		t.Fatalf("failed to create scheduled broadcast: %v", err)
	}

	if sb.Message != "Hello scheduled!" {
		t.Errorf("expected message 'Hello scheduled!', got %q", sb.Message)
	}
	if !sb.ScheduledAt.Equal(schedTime) {
		t.Errorf("expected scheduled time %v, got %v", schedTime, sb.ScheduledAt)
	}
	if sb.Status != "pending" {
		t.Errorf("expected status 'pending', got %q", sb.Status)
	}

	// 3. List Scheduled Broadcasts
	list, err := st.ListScheduledBroadcasts(ctx)
	if err != nil {
		t.Fatalf("failed to list scheduled broadcasts: %v", err)
	}
	if len(list) != 1 {
		t.Errorf("expected 1 scheduled broadcast, got %d", len(list))
	} else {
		if list[0].ID != sb.ID {
			t.Errorf("expected broadcast ID %d, got %d", sb.ID, list[0].ID)
		}
	}

	// 4. Update Scheduled Broadcast
	newTime := time.Now().Add(2 * time.Hour).Truncate(time.Second)
	sbUpdated, err := st.UpdateScheduledBroadcast(ctx, sb.ID, "Hello updated scheduled!", newTime)
	if err != nil {
		t.Fatalf("failed to update scheduled broadcast: %v", err)
	}
	if sbUpdated.Message != "Hello updated scheduled!" {
		t.Errorf("expected updated message 'Hello updated scheduled!', got %q", sbUpdated.Message)
	}
	if !sbUpdated.ScheduledAt.Equal(newTime) {
		t.Errorf("expected updated scheduled time %v, got %v", newTime, sbUpdated.ScheduledAt)
	}

	// 5. Get Pending Scheduled Broadcasts (should be empty since scheduled time is in the future)
	pending, err := st.GetPendingScheduledBroadcasts(ctx)
	if err != nil {
		t.Fatalf("failed to get pending broadcasts: %v", err)
	}
	if len(pending) != 0 {
		t.Errorf("expected 0 pending broadcasts in the future, got %d", len(pending))
	}

	// 6. Delete Scheduled Broadcast
	// We'll create another one to delete
	sbToDelete, err := st.CreateScheduledBroadcast(ctx, "Delete me", time.Now().Add(30 * time.Minute))
	if err != nil {
		t.Fatalf("failed to create delete-candidate broadcast: %v", err)
	}

	err = st.DeleteScheduledBroadcast(ctx, sbToDelete.ID)
	if err != nil {
		t.Fatalf("failed to delete scheduled broadcast: %v", err)
	}

	// Verify deletion
	listAfterDelete, err := st.ListScheduledBroadcasts(ctx)
	if err != nil {
		t.Fatalf("failed to list after delete: %v", err)
	}
	for _, b := range listAfterDelete {
		if b.ID == sbToDelete.ID {
			t.Errorf("scheduled broadcast was not deleted")
		}
	}

	// 7. Process Scheduled Broadcast
	// Update the first broadcast to be in the past so it is due
	_, err = st.pool.Exec(ctx, `
		UPDATE scheduled_broadcasts
		SET scheduled_at = NOW() - INTERVAL '1 minute'
		WHERE id = $1
	`, sb.ID)
	if err != nil {
		t.Fatalf("failed to update scheduled_at to the past: %v", err)
	}

	pendingDue, err := st.GetPendingScheduledBroadcasts(ctx)
	if err != nil {
		t.Fatalf("failed to get pending due broadcasts: %v", err)
	}
	if len(pendingDue) != 1 || pendingDue[0].ID != sb.ID {
		t.Errorf("expected 1 due broadcast with ID %d, got %d", sb.ID, len(pendingDue))
	}

	queued, err := st.ProcessScheduledBroadcast(ctx, sb.ID)
	if err != nil {
		t.Fatalf("failed to process scheduled broadcast: %v", err)
	}
	if queued != 1 {
		t.Errorf("expected 1 queued message, got %d", queued)
	}

	// Verify notification_outbox entry
	var outboxCount int
	err = st.pool.QueryRow(ctx, `
		SELECT COUNT(1) FROM notification_outbox WHERE workspace_id = $1 AND message = $2
	`, ws.ID, "Hello updated scheduled!").Scan(&outboxCount)
	if err != nil {
		t.Fatalf("failed to check notification_outbox: %v", err)
	}
	if outboxCount != 1 {
		t.Errorf("expected 1 outbox entry for the broadcast message, got %d", outboxCount)
	}

	// Verify broadcast status is now 'sent'
	listAfterSend, err := st.ListScheduledBroadcasts(ctx)
	if err != nil {
		t.Fatalf("failed to list after send: %v", err)
	}
	foundSent := false
	for _, b := range listAfterSend {
		if b.ID == sb.ID {
			if b.Status != "sent" {
				t.Errorf("expected status to be 'sent', got %q", b.Status)
			}
			if b.SentAt == nil {
				t.Errorf("expected SentAt to be set")
			}
			foundSent = true
		}
	}
	if !foundSent {
		t.Errorf("processed broadcast not found in list")
	}
}
