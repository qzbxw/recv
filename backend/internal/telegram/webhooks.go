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
	"time"
)

func (b *BotWorker) flushWebhookDeliveries(ctx context.Context) error {
	deliveries, err := b.store.ClaimWebhookDeliveries(ctx, 20)
	if err != nil {
		return err
	}

	for _, delivery := range deliveries {
		statusCode, requestErr := b.sendWebhookDelivery(ctx, delivery.TargetURL, delivery.Secret, delivery.EventType, delivery.Payload)
		if requestErr != nil || statusCode >= http.StatusBadRequest {
			message := ""
			if requestErr != nil {
				message = requestErr.Error()
			} else {
				message = fmt.Sprintf("webhook responded with HTTP %d", statusCode)
			}
			_ = b.store.MarkWebhookDeliveryFailed(ctx, delivery.ID, delivery.EndpointID, delivery.Attempts, delivery.MaxAttempts, statusCode, message)
			continue
		}
		_ = b.store.MarkWebhookDeliverySent(ctx, delivery.ID, delivery.EndpointID)
	}
	return nil
}

func (b *BotWorker) sendWebhookDelivery(ctx context.Context, targetURL string, secret string, eventType string, payload []byte) (int, error) {
	timestamp := strconv.FormatInt(time.Now().UTC().Unix(), 10)
	signature := webhookSignature(secret, timestamp, payload)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, targetURL, bytes.NewReader(payload))
	if err != nil {
		return 0, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "reqst-webhooks/1.0")
	req.Header.Set("X-Reqst-Event", eventType)
	req.Header.Set("X-Reqst-Timestamp", timestamp)
	req.Header.Set("X-Reqst-Signature", signature)

	resp, err := b.httpClient.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, io.LimitReader(resp.Body, 1024))
	return resp.StatusCode, nil
}

func webhookSignature(secret string, timestamp string, payload []byte) string {
	mac := hmac.New(sha256.New, []byte(strings.TrimSpace(secret)))
	mac.Write([]byte(timestamp))
	mac.Write([]byte("."))
	mac.Write(payload)
	return "v1=" + hex.EncodeToString(mac.Sum(nil))
}
