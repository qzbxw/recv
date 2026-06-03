package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"recv/backend/internal/metrics"
	"recv/backend/internal/store"
)

type PaymentService struct {
	store *store.Store
}

type PaymentResult struct {
	Invoice        *store.Invoice `json:"invoice,omitempty"`
	Classification string         `json:"classification"`
}

func NewPaymentService(st *store.Store) *PaymentService {
	return &PaymentService{store: st}
}

func (s *PaymentService) ProcessObservedTransfer(ctx context.Context, transfer store.ObservedTransfer) (PaymentResult, error) {
	source := metrics.SourceFromContext(ctx)
	event, inserted, err := s.store.RecordObservedTransfer(ctx, transfer)
	if err != nil {
		metrics.ObservePayment(source, string(transfer.Network), "record_failed", "none", false, transfer.Amount.InexactFloat64())
		return PaymentResult{}, err
	}
	if !inserted {
		metrics.ObservePayment(source, string(transfer.Network), "duplicate", "none", false, transfer.Amount.InexactFloat64())
		return PaymentResult{Classification: "duplicate"}, nil
	}

	invoice, classification, status, err := s.matchTransfer(ctx, transfer)
	if err != nil {
		if errors.Is(err, store.ErrAmbiguousPaymentMatch) {
			_ = s.store.MarkPaymentEventUnmatched(ctx, event.ID, "ambiguous_match")
			metrics.ObservePayment(source, string(transfer.Network), "ambiguous_match", "none", false, transfer.Amount.InexactFloat64())
			return PaymentResult{Classification: "ambiguous_match"}, nil
		}
		metrics.ObservePayment(source, string(transfer.Network), "match_failed", "none", false, transfer.Amount.InexactFloat64())
		return PaymentResult{}, err
	}
	if invoice == nil {
		metrics.ObservePayment(source, string(transfer.Network), classification, "none", false, transfer.Amount.InexactFloat64())
		return PaymentResult{Classification: classification}, nil
	}

	updated, err := s.store.CompleteInvoicePayment(ctx, invoice.ID, invoice.Status, event.ID, transfer.TxHash, status, classification, transfer.Amount, transfer.ObservedAt)
	if err != nil {
		metrics.ObservePayment(source, string(transfer.Network), classification, string(status), true, transfer.Amount.InexactFloat64())
		return PaymentResult{}, err
	}
	metrics.ObservePayment(source, string(transfer.Network), classification, string(updated.Status), true, transfer.Amount.InexactFloat64())
	return PaymentResult{
		Invoice:        &updated,
		Classification: classification,
	}, nil
}

func (s *PaymentService) matchTransfer(ctx context.Context, transfer store.ObservedTransfer) (*store.Invoice, string, store.InvoiceStatus, error) {
	switch transfer.Network {
	case store.NetworkTON:
		if transfer.PaymentComment == "" {
			return nil, "unmatched", store.InvoiceStatusDraft, nil
		}
		invoice, err := s.store.FindInvoiceByTONComment(ctx, transfer.DestinationAddress, transfer.PaymentComment)
		if err != nil {
			if errors.Is(err, store.ErrNotFound) {
				return nil, "unmatched", store.InvoiceStatusDraft, nil
			}
			return nil, "", store.InvoiceStatusDraft, err
		}
		decision := store.DecideInvoicePaymentStatus(invoice, transfer.Amount, transfer.ObservedAt, "")
		return &invoice, decision.Classification, decision.Status, nil
	default:
		invoice, err := s.store.FindInvoiceByExactAmount(ctx, transfer.DestinationAddress, transfer.Network, transfer.Amount)
		if err == nil {
			decision := store.DecideInvoicePaymentStatus(invoice, transfer.Amount, transfer.ObservedAt, "")
			return &invoice, decision.Classification, decision.Status, nil
		}
		if err != nil && !errors.Is(err, store.ErrNotFound) {
			return nil, "", store.InvoiceStatusDraft, err
		}

		invoice, err = s.store.FindPotentialUnderpaidInvoice(ctx, transfer.DestinationAddress, transfer.Network, transfer.Amount)
		if err != nil {
			if errors.Is(err, store.ErrNotFound) {
				return nil, "unmatched", store.InvoiceStatusDraft, nil
			}
			return nil, "", store.InvoiceStatusDraft, err
		}
		decision := store.DecideInvoicePaymentStatus(invoice, transfer.Amount, transfer.ObservedAt, "")
		return &invoice, decision.Classification, decision.Status, nil
	}
}

func normalizeObservedTransfer(transfer *store.ObservedTransfer) error {
	if transfer.TxHash == "" {
		return errors.New("tx_hash is required")
	}
	if transfer.ExternalEventID == "" {
		transfer.ExternalEventID = string(transfer.Network) + ":" + transfer.TxHash
	}
	if transfer.DestinationAddress == "" {
		return errors.New("destination_address is required")
	}
	if transfer.Network == "" {
		return errors.New("network is required")
	}
	if !transfer.Amount.IsPositive() {
		return errors.New("amount must be positive")
	}
	if transfer.ObservedAt.IsZero() {
		transfer.ObservedAt = time.Now().UTC()
	}
	return nil
}

func NormalizeObservedTransfer(transfer *store.ObservedTransfer) error {
	if err := normalizeObservedTransfer(transfer); err != nil {
		return fmt.Errorf("normalize observed transfer: %w", err)
	}
	return nil
}
