package metrics

import (
	"context"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

type contextKey string

const sourceContextKey contextKey = "metrics_source"

var (
	serviceName = "unknown"
	appEnv      = "unknown"

	appInfo = promauto.NewGaugeVec(prometheus.GaugeOpts{
		Namespace: "reqst",
		Name:      "app_info",
		Help:      "Static information about the running reqst service.",
	}, []string{"service", "env"})

	httpRequests = promauto.NewCounterVec(prometheus.CounterOpts{
		Namespace: "reqst",
		Name:      "http_requests_total",
		Help:      "HTTP requests handled by the service.",
	}, []string{"service", "method", "route", "status"})

	httpDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Namespace: "reqst",
		Name:      "http_request_duration_seconds",
		Help:      "Latency of HTTP requests handled by the service.",
		Buckets:   prometheus.DefBuckets,
	}, []string{"service", "method", "route", "status"})

	authAttempts = promauto.NewCounterVec(prometheus.CounterOpts{
		Namespace: "reqst",
		Name:      "auth_attempts_total",
		Help:      "Authentication and authorization decisions.",
	}, []string{"service", "method", "result", "reason"})

	invoiceOperations = promauto.NewCounterVec(prometheus.CounterOpts{
		Namespace: "reqst",
		Name:      "invoice_operations_total",
		Help:      "Invoice operations across seller, billing, and automation flows.",
	}, []string{"service", "operation", "source", "kind", "network", "plan", "result", "reason"})

	invoiceTransitions = promauto.NewCounterVec(prometheus.CounterOpts{
		Namespace: "reqst",
		Name:      "invoice_status_transitions_total",
		Help:      "Invoice status transitions.",
	}, []string{"service", "source", "kind", "from_status", "to_status", "classification"})

	paymentClassifications = promauto.NewCounterVec(prometheus.CounterOpts{
		Namespace: "reqst",
		Name:      "payment_classifications_total",
		Help:      "Observed transfer classifications.",
	}, []string{"service", "source", "network", "classification", "invoice_status", "matched"})

	paymentAmounts = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Namespace: "reqst",
		Name:      "payment_amount_observed",
		Help:      "Observed payment amounts in network units.",
		Buckets:   []float64{0.5, 1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 5000},
	}, []string{"service", "source", "network", "classification"})

	limitDecisions = promauto.NewCounterVec(prometheus.CounterOpts{
		Namespace: "reqst",
		Name:      "limit_decisions_total",
		Help:      "Business limit checks such as trial caps and API quotas.",
	}, []string{"service", "kind", "result", "reason"})

	resourceOperations = promauto.NewCounterVec(prometheus.CounterOpts{
		Namespace: "reqst",
		Name:      "resource_operations_total",
		Help:      "CRUD-style resource operations for wallets, API keys, webhooks, and sellers.",
	}, []string{"service", "resource", "action", "result"})

	adminOperations = promauto.NewCounterVec(prometheus.CounterOpts{
		Namespace: "reqst",
		Name:      "admin_operations_total",
		Help:      "Administrative actions performed through internal endpoints.",
	}, []string{"service", "action", "result"})

	deliveryEvents = promauto.NewCounterVec(prometheus.CounterOpts{
		Namespace: "reqst",
		Name:      "delivery_events_total",
		Help:      "Notification and webhook delivery pipeline events.",
	}, []string{"service", "channel", "stage", "result"})

	batchSizes = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Namespace: "reqst",
		Name:      "batch_size",
		Help:      "Sizes of batched backend operations such as watcher ingests and delivery claims.",
		Buckets:   []float64{0, 1, 2, 5, 10, 20, 50, 100},
	}, []string{"service", "kind", "source"})

	watcherPolls = promauto.NewCounterVec(prometheus.CounterOpts{
		Namespace: "reqst",
		Name:      "watcher_polls_total",
		Help:      "Wallet polling attempts performed by watcher workers.",
	}, []string{"service", "network", "result"})

	watcherPollDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Namespace: "reqst",
		Name:      "watcher_poll_duration_seconds",
		Help:      "Latency of watcher wallet polls.",
		Buckets:   prometheus.DefBuckets,
	}, []string{"service", "network", "result"})

	watcherTransfers = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Namespace: "reqst",
		Name:      "watcher_transfers_per_poll",
		Help:      "Number of transfers returned by a watcher poll.",
		Buckets:   []float64{0, 1, 2, 5, 10, 20, 50},
	}, []string{"service", "network"})

	rpcRequests = promauto.NewCounterVec(prometheus.CounterOpts{
		Namespace: "reqst",
		Name:      "rpc_requests_total",
		Help:      "JSON-RPC requests issued by watcher workers.",
	}, []string{"service", "family", "network", "method", "result"})

	rpcDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Namespace: "reqst",
		Name:      "rpc_request_duration_seconds",
		Help:      "Latency of JSON-RPC requests issued by watcher workers.",
		Buckets:   prometheus.DefBuckets,
	}, []string{"service", "family", "network", "method", "result"})

	upstreamRequests = promauto.NewCounterVec(prometheus.CounterOpts{
		Namespace: "reqst",
		Name:      "upstream_requests_total",
		Help:      "HTTP requests sent to external upstream systems.",
	}, []string{"service", "upstream", "operation", "result"})

	upstreamDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Namespace: "reqst",
		Name:      "upstream_request_duration_seconds",
		Help:      "Latency of HTTP requests sent to external upstream systems.",
		Buckets:   prometheus.DefBuckets,
	}, []string{"service", "upstream", "operation", "result"})
)

func Init(service string, env string) {
	serviceName = normalize(service, "unknown")
	appEnv = normalize(env, "unknown")
	appInfo.WithLabelValues(serviceName, appEnv).Set(1)
}

func WithSource(ctx context.Context, source string) context.Context {
	return context.WithValue(ctx, sourceContextKey, normalize(source, "unknown"))
}

func SourceFromContext(ctx context.Context) string {
	if ctx == nil {
		return "unknown"
	}
	if value, ok := ctx.Value(sourceContextKey).(string); ok && strings.TrimSpace(value) != "" {
		return value
	}
	return "unknown"
}

func Handler() http.Handler {
	return promhttp.Handler()
}

func StartServer(ctx context.Context, addr string, logger *slog.Logger) *http.Server {
	mux := http.NewServeMux()
	mux.Handle("/metrics", Handler())
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"ok":true}`))
	})

	server := &http.Server{
		Addr:              addr,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = server.Shutdown(shutdownCtx)
	}()

	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed && logger != nil {
			logger.Error("metrics server failed", "addr", addr, "error", err)
		}
	}()

	return server
}

func ObserveHTTPRequest(method string, route string, statusCode int, duration time.Duration) {
	status := strconv.Itoa(statusCode)
	route = normalizeRoute(route)
	method = normalize(method, "unknown")
	httpRequests.WithLabelValues(serviceName, method, route, status).Inc()
	httpDuration.WithLabelValues(serviceName, method, route, status).Observe(duration.Seconds())
}

func IncAuthAttempt(method string, result string, reason string) {
	authAttempts.WithLabelValues(serviceName, normalize(method, "unknown"), normalize(result, "unknown"), normalize(reason, "none")).Inc()
}

func IncInvoiceOperation(operation string, source string, kind string, network string, plan string, result string, reason string) {
	invoiceOperations.WithLabelValues(
		serviceName,
		normalize(operation, "unknown"),
		normalize(source, "unknown"),
		normalize(kind, "unknown"),
		normalize(network, "unknown"),
		normalize(plan, "unknown"),
		normalize(result, "unknown"),
		normalize(reason, "none"),
	).Inc()
}

func IncInvoiceTransition(source string, kind string, fromStatus string, toStatus string, classification string) {
	invoiceTransitions.WithLabelValues(
		serviceName,
		normalize(source, "unknown"),
		normalize(kind, "unknown"),
		normalize(fromStatus, "unknown"),
		normalize(toStatus, "unknown"),
		normalize(classification, "none"),
	).Inc()
}

func ObservePayment(source string, network string, classification string, status string, matched bool, amount float64) {
	matchedLabel := "false"
	if matched {
		matchedLabel = "true"
	}
	network = normalize(network, "unknown")
	classification = normalize(classification, "unknown")
	paymentClassifications.WithLabelValues(
		serviceName,
		normalize(source, "unknown"),
		network,
		classification,
		normalize(status, "none"),
		matchedLabel,
	).Inc()
	if amount >= 0 {
		paymentAmounts.WithLabelValues(serviceName, normalize(source, "unknown"), network, classification).Observe(amount)
	}
}

func IncLimitDecision(kind string, result string, reason string) {
	limitDecisions.WithLabelValues(serviceName, normalize(kind, "unknown"), normalize(result, "unknown"), normalize(reason, "none")).Inc()
}

func IncResourceOperation(resource string, action string, result string) {
	resourceOperations.WithLabelValues(serviceName, normalize(resource, "unknown"), normalize(action, "unknown"), normalize(result, "unknown")).Inc()
}

func IncAdminOperation(action string, result string) {
	adminOperations.WithLabelValues(serviceName, normalize(action, "unknown"), normalize(result, "unknown")).Inc()
}

func IncDeliveryEvent(channel string, stage string, result string) {
	deliveryEvents.WithLabelValues(serviceName, normalize(channel, "unknown"), normalize(stage, "unknown"), normalize(result, "unknown")).Inc()
}

func ObserveBatch(kind string, source string, size int) {
	batchSizes.WithLabelValues(serviceName, normalize(kind, "unknown"), normalize(source, "unknown")).Observe(float64(size))
}

func ObserveWatcherPoll(network string, result string, duration time.Duration, transfers int) {
	network = normalize(network, "unknown")
	result = normalize(result, "unknown")
	watcherPolls.WithLabelValues(serviceName, network, result).Inc()
	watcherPollDuration.WithLabelValues(serviceName, network, result).Observe(duration.Seconds())
	if transfers >= 0 {
		watcherTransfers.WithLabelValues(serviceName, network).Observe(float64(transfers))
	}
}

func ObserveRPC(family string, network string, method string, result string, duration time.Duration) {
	family = normalize(family, "unknown")
	network = normalize(network, "unknown")
	method = normalize(method, "unknown")
	result = normalize(result, "unknown")
	rpcRequests.WithLabelValues(serviceName, family, network, method, result).Inc()
	rpcDuration.WithLabelValues(serviceName, family, network, method, result).Observe(duration.Seconds())
}

func ObserveUpstream(upstream string, operation string, result string, duration time.Duration) {
	upstream = normalize(upstream, "unknown")
	operation = normalize(operation, "unknown")
	result = normalize(result, "unknown")
	upstreamRequests.WithLabelValues(serviceName, upstream, operation, result).Inc()
	upstreamDuration.WithLabelValues(serviceName, upstream, operation, result).Observe(duration.Seconds())
}

func normalizeRoute(route string) string {
	route = strings.TrimSpace(route)
	if route == "" {
		return "unmatched"
	}
	return route
}

func normalize(value string, fallback string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	if value == "" {
		return fallback
	}
	return value
}
