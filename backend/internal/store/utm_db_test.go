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
	for _, event := range []UTMEventInput{
		{AttributionID: "vis-1", EventName: "page_view", Source: "tg_channel_a", Medium: "cpc", Campaign: "launch", Path: "/ru", Title: "Home"},
		{AttributionID: "vis-1", EventName: "docs_open", Source: "tg_channel_a", Medium: "cpc", Campaign: "launch", Path: "/ru/docs/quickstart", Title: "Quickstart"},
		{AttributionID: "vis-1", EventName: "app_open", Source: "tg_channel_a", Medium: "cpc", Campaign: "launch", Path: "/app/auth", Title: "Sign in"},
		{AttributionID: "vis-1", EventName: "signup_start", Source: "tg_channel_a", Medium: "cpc", Campaign: "launch", Path: "/app/auth", Title: "Sign in"},
	} {
		if err := st.RecordUTMEvent(ctx, event); err != nil {
			t.Fatalf("RecordUTMEvent: %v", err)
		}
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
	if found.Events != 4 || found.DocsOpened != 1 || found.AppOpens != 1 || found.SignupStarts != 1 {
		t.Fatalf("unexpected event funnel stats: %+v", found)
	}
	if found.Signups != 1 {
		t.Fatalf("expected 1 signup, got %d", found.Signups)
	}
	if found.PayingWorkspaces != 0 {
		t.Fatalf("expected 0 paying workspaces, got %d", found.PayingWorkspaces)
	}
	if len(report.TopDocs) == 0 || report.TopDocs[0].Path != "/ru/docs/quickstart" {
		t.Fatalf("expected docs path in report, got %+v", report.TopDocs)
	}
	if len(report.Leads) == 0 || report.Leads[0].AttributionID != "vis-1" {
		t.Fatalf("expected lead journey for vis-1, got %+v", report.Leads)
	}
	if report.Leads[0].WorkspaceID == nil || *report.Leads[0].WorkspaceID != workspace.ID {
		t.Fatalf("expected lead workspace %d, got %+v", workspace.ID, report.Leads[0].WorkspaceID)
	}
	if len(report.Leads[0].Timeline) != 4 {
		t.Fatalf("expected 4 timeline events, got %+v", report.Leads[0].Timeline)
	}
}
