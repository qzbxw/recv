package telegram

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"recv/backend/internal/metrics"
	"recv/backend/internal/store"
)

func (b *BotWorker) flushWebhookDeliveries(ctx context.Context) error {
	deliveries, err := b.store.ClaimWebhookDeliveries(ctx, 20)
	if err != nil {
		return err
	}

	// Deliver the claimed batch concurrently: each target gets its own
	// HTTP budget, so one slow seller endpoint cannot hold up the rest.
	var wg sync.WaitGroup
	for _, delivery := range deliveries {
		wg.Add(1)
		go func(delivery store.WebhookDelivery) {
			defer wg.Done()
			attempt := b.sendWebhookDelivery(ctx, delivery.TargetURL, delivery.Secret, delivery.EventType, delivery.Payload)
			_ = b.store.RecordWebhookDeliveryAttempt(ctx, delivery.ID, delivery.EndpointID, delivery.Attempts, attempt)
			statusCode := attempt.StatusCode
			requestErr := errorFromString(attempt.Error)
			if requestErr != nil || statusCode >= http.StatusBadRequest {
				message := ""
				if requestErr != nil {
					message = requestErr.Error()
				} else {
					message = fmt.Sprintf("webhook responded with HTTP %d", statusCode)
				}
				_ = b.store.MarkWebhookDeliveryFailed(ctx, delivery.ID, delivery.EndpointID, delivery.Attempts, delivery.MaxAttempts, statusCode, message)
				return
			}
			_ = b.store.MarkWebhookDeliverySent(ctx, delivery.ID, delivery.EndpointID)
		}(delivery)
	}
	wg.Wait()
	return nil
}

func (b *BotWorker) sendWebhookDelivery(ctx context.Context, targetURL string, secret string, eventType string, payload []byte) store.WebhookAttemptResult {
	timestamp := strconv.FormatInt(time.Now().UTC().Unix(), 10)
	signature := webhookSignature(secret, timestamp, payload)
	startedAt := time.Now()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, targetURL, bytes.NewReader(payload))
	if err != nil {
		return store.WebhookAttemptResult{Status: "failure", Error: err.Error(), Duration: time.Since(startedAt)}
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "recv-webhooks/1.0")
	req.Header.Set("X-recv-Event", eventType)
	req.Header.Set("X-recv-Timestamp", timestamp)
	req.Header.Set("X-recv-Signature", signature)

	client := b.webhookClient
	if client == nil {
		client = b.httpClient
	}
	resp, err := client.Do(req)
	if err != nil {
		metrics.ObserveUpstream("seller_webhook", eventType, "failure", time.Since(startedAt))
		return store.WebhookAttemptResult{Status: "failure", Error: err.Error(), Duration: time.Since(startedAt)}
	}
	defer resp.Body.Close()
	var responseBody bytes.Buffer
	_, _ = io.Copy(&responseBody, io.LimitReader(resp.Body, 1024))
	result := "success"
	if resp.StatusCode >= http.StatusBadRequest {
		result = "failure"
	}
	metrics.ObserveUpstream("seller_webhook", eventType, result, time.Since(startedAt))
	return store.WebhookAttemptResult{
		StatusCode:      resp.StatusCode,
		Status:          result,
		Duration:        time.Since(startedAt),
		ResponseSnippet: strings.TrimSpace(responseBody.String()),
	}
}

func errorFromString(message string) error {
	if strings.TrimSpace(message) == "" {
		return nil
	}
	return fmt.Errorf("%s", message)
}

func webhookSignature(secret string, timestamp string, payload []byte) string {
	mac := hmac.New(sha256.New, []byte(strings.TrimSpace(secret)))
	mac.Write([]byte(timestamp))
	mac.Write([]byte("."))
	mac.Write(payload)
	return "v1=" + hex.EncodeToString(mac.Sum(nil))
}
