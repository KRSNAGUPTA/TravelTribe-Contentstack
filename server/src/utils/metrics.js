import client from "@prometheus-io/client";

/**
 * Prometheus metrics registry.
 *
 * Two categories of metrics live here:
 *   1. HTTP metrics — request count + latency per route. Auto-recorded by
 *      middleware in index.js.
 *   2. Business metrics — booking, payment, refund counters. Manually
 *      incremented in controllers.
 *
 * CARDINALITY RULES (do not violate):
 *   - Never put user IDs, emails, hostel IDs, or payment IDs in a label.
 *     Each unique label combination creates a new time series, and
 *     Prometheus dies at ~1M series.
 *   - Route labels must be Express route patterns ("/api/hostel/:id"),
 *     not concrete paths ("/api/hostel/abc123").
 */

// Auto-collect Node.js runtime metrics (event loop lag, GC, memory, CPU)
client.collectDefaultMetrics({ prefix: "nodejs_" });

// ── HTTP metrics ────────────────────────────────────────────────────────

export const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

// ── Booking metrics ─────────────────────────────────────────────────────

export const bookingHoldsTotal = new client.Counter({
  name: "booking_holds_total",
  help: "Total booking hold attempts",
  labelNames: ["result"], // success | no_availability | conflict | error
});

export const bookingConfirmedTotal = new client.Counter({
  name: "booking_confirmed_total",
  help: "Total bookings confirmed after payment",
});

export const bookingCancelledTotal = new client.Counter({
  name: "booking_cancelled_total",
  help: "Total bookings cancelled by user or admin",
  labelNames: ["by"], // user | admin
});

export const bookingExpiredTotal = new client.Counter({
  name: "booking_expired_total",
  help: "Total booking holds expired without payment",
});

// ── Payment metrics ─────────────────────────────────────────────────────

export const paymentOrdersCreatedTotal = new client.Counter({
  name: "payment_orders_created_total",
  help: "Total Razorpay orders created",
});

export const paymentVerifiedTotal = new client.Counter({
  name: "payment_verified_total",
  help: "Total payments verified and consumed",
});

export const paymentFailedTotal = new client.Counter({
  name: "payment_failed_total",
  help: "Total payment failures",
  labelNames: ["reason"], // signature_invalid | expired | not_found | error
});

export const paymentRefundsTotal = new client.Counter({
  name: "payment_refunds_total",
  help: "Total payments refunded",
  labelNames: ["reason"], // hold_expired | price_changed | no_availability | booking_race
});

// ⚠️ SECURITY SIGNAL — alert if this ever increases
export const paymentPriceMismatchTotal = new client.Counter({
  name: "payment_price_mismatch_total",
  help: "Payments where amount did not match server-computed price (tampering signal)",
});

// ── Transaction duration ────────────────────────────────────────────────

export const bookingTransactionDuration = new client.Histogram({
  name: "booking_transaction_duration_seconds",
  help: "Duration of booking hold transaction",
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});

// ── Registry export ─────────────────────────────────────────────────────

export const register = client.register;