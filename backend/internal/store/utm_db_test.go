package store

import (
	"context"
	"testing"
	"time"
)

// TestUTMVisitsAndReport verifies that visits are recorded and the funnel
// report joins visits with signup attributions per campaign.
func TestUTMVisitsAndReport(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	// Arrange: two ad clicks from one visitor plus one from another.
	for _, visit := range []AttributionInput{
		{AttributionID: "vis-1", Source: "tg_channel_a", Medium: "cpc", Campaign: "launch", LandingPath: "/ru"},
		{AttributionID: "vis-1", Source: "tg_channel_a", Medium: "cpc", Campaign: "launch", LandingPath: "/ru/pricing"},
		{AttributionID: "vis-2", Source: "tg_channel_a", Medium: "cpc", Campaign: "launch", LandingPath: "/ru"},
	} {
		if err := st.RecordUTMVisit(ctx, visit); err != nil {
			t.Fatalf("RecordUTMVisit: %v", err)
		}
	}
	// Empty visit is a no-op.
	if err := st.RecordUTMVisit(ctx, AttributionInput{}); err != nil {
		t.Fatalf("RecordUTMVisit with empty input: %v", err)
	}

	// Arrange: one of the visitors signs up.
	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 70020, "utmreportuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	if err := st.RecordUTMAttribution(ctx, workspace.ID, AttributionInput{
		AttributionID: "vis-1",
		Source:        "tg_channel_a",
		Medium:        "cpc",
		Campaign:      "launch",
	}); err != nil {
		t.Fatalf("RecordUTMAttribution: %v", err)
	}

	// Act
	to := time.Now().UTC().Add(time.Minute)
	report, err := st.GetUTMReport(ctx, to.AddDate(0, 0, -1), to)
	if err != nil {
		t.Fatalf("GetUTMReport: %v", err)
	}

	// Assert
	var found *UTMCampaignStats
	for i := range report.Campaigns {
		if report.Campaigns[i].Source == "tg_channel_a" && report.Campaigns[i].Campaign == "launch" {
			found = &report.Campaigns[i]
			break
		}
	}
	if found == nil {
		t.Fatalf("expected tg_channel_a/launch in report, got %+v", report.Campaigns)
	}
	if found.Visits != 3 {
		t.Fatalf("expected 3 visits, got %d", found.Visits)
	}
	if found.UniqueVisitors != 2 {
		t.Fatalf("expected 2 unique visitors, got %d", found.UniqueVisitors)
	}
	if found.Signups != 1 {
		t.Fatalf("expected 1 signup, got %d", found.Signups)
	}
	if found.PayingWorkspaces != 0 {
		t.Fatalf("expected 0 paying workspaces, got %d", found.PayingWorkspaces)
	}
}
