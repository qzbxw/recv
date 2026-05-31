package store

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
)

type ProductEventInput struct {
	WorkspaceID     *int64          `json:"workspace_id,omitempty"`
	InvoiceID       *int64          `json:"invoice_id,omitempty"`
	InvoicePublicID string          `json:"invoice_public_id,omitempty"`
	EventName       string          `json:"event_name"`
	Source          string          `json:"source"`
	Properties      json.RawMessage `json:"properties"`
}

func (s *Store) RecordProductEvent(ctx context.Context, input ProductEventInput) error {
	eventName := strings.TrimSpace(input.EventName)
	if eventName == "" {
		return nil
	}
	workspaceID := input.WorkspaceID
	invoiceID := input.InvoiceID
	if strings.TrimSpace(input.InvoicePublicID) != "" {
		invoice, err := s.GetInvoiceByPublicID(ctx, input.InvoicePublicID)
		if err == nil {
			workspaceID = &invoice.WorkspaceID
			invoiceID = &invoice.ID
		}
	}
	properties := input.Properties
	if len(properties) == 0 || !json.Valid(properties) {
		properties = json.RawMessage(`{}`)
	}
	_, err := s.pool.Exec(ctx, `
		INSERT INTO product_events (workspace_id, invoice_id, event_name, source, properties)
		VALUES ($1, $2, $3, $4, $5)
	`, workspaceID, invoiceID, limitString(eventName, 160), limitString(input.Source, 120), properties)
	if err != nil {
		return fmt.Errorf("record product event: %w", err)
	}
	return nil
}
