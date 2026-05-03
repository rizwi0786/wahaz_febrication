# Payments — Bellissimo Couture

This document is the single source of truth for how the payment system works,
why each piece exists, and what is left to do before going live.

The flow uses **Razorpay Standard Checkout** with **server-side validation +
webhook reconciliation**. Razorpay holds the customer's card/UPI credentials
— our server never sees them. We only see signed proofs of payment, which we
verify cryptographically before flipping an order to PAID.

---

## 1. What's Done

| Concern | Implementation | File |
|---|---|---|
| Razorpay order creation | `razorpay.orders.create()` server-side, total computed from DB | [server/src/controllers/order.controller.js](server/src/controllers/order.controller.js) `placeOrder` |
| HMAC signature verification | `crypto.timingSafeEqual` (constant-time) | `verifyPayment` |
| Server-side amount validation | `razorpay.payments.fetch()` → compare `amount`, `currency`, `order_id`, `status` against DB | `verifyPayment` |
| Idempotent order finalization | `updateMany WHERE paymentStatus='PENDING'` — only first call wins | `finalizePaidOrder` |
| Webhook handler | Raw-body HMAC verify, dedup via unique constraint | `razorpayWebhook` |
| Audit log | `PaymentEvent` table — every attempt, success, failure, mismatch | `logPaymentEvent` |
| Rate limiting | `paymentVerifyLimiter` (10 / 10 min / user), `webhookLimiter` (200 / min) | [server/src/middleware/rateLimiter.js](server/src/middleware/rateLimiter.js) |
| Transport security | Helmet + HSTS, prod HTTPS redirect, `trust proxy` for ngrok / LB | [server/src/app.js](server/src/app.js) |
| Frontend double-click guard | `paying` state disables Place Order during in-flight verify | [client/src/pages/Checkout.jsx](client/src/pages/Checkout.jsx) |
| Schema | `Order.razorpayOrderId @unique`, `paymentId @unique`, `PaymentEvent` model | [server/prisma/schema.prisma](server/prisma/schema.prisma) |

---

## 2. What's Left To Do

### 2.1 Required before going live

- [ ] **Razorpay KYC** — submit Individual KYC with PAN + bank details + address proof. Until approved, you stay in Test Mode and can't accept real money.
- [ ] **Live API keys** — once KYC is approved, swap `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` in `.env` for the Live keys.
- [ ] **Production webhook** — register `https://api.yourdomain.com/api/webhooks/razorpay` in the Live dashboard, generate a new `RAZORPAY_WEBHOOK_SECRET`, paste it into prod `.env`.
- [ ] **HTTPS in production** — real TLS cert (Let's Encrypt / Cloudflare). Set `NODE_ENV=production` and `FORCE_HTTPS=true`.
- [ ] **Policy pages on the site** (Razorpay rejects KYC without these): Privacy Policy, Refund Policy, Shipping Policy, Terms & Conditions, Contact Us.
- [ ] **Run the Prisma migration** in production: `npx prisma migrate deploy`.

### 2.2 Recommended hardening (not blocking)

- [ ] **Refund handling** — currently logged in `PaymentEvent` only. Add a controller path that reconciles `refund.processed` webhook events to a Refund table (deferred per your call).
- [ ] **Webhook IP allowlist** — Razorpay publishes webhook source IPs. Restrict the `/api/webhooks/razorpay` route to those IPs at the firewall / reverse proxy.
- [ ] **Reconciliation job** — nightly cron that scans `Order.paymentStatus = 'PENDING'` rows older than 1 hour, calls `razorpay.orders.fetchPayments(orderId)`, and finalizes anything Razorpay reports as captured. Catches the rare case where both verify-callback AND all webhook deliveries were lost.
- [ ] **Alerts on suspicious events** — query `PaymentEvent` for `signature_failed`, `amount_mismatch`, or `validation_failed` at frequency `> N / hour` and notify ops.
- [ ] **Retry-safe email sends** — currently `sendEmail(...).catch(console.error)`. Move to a queue (BullMQ etc.) so a failed SMTP doesn't silently lose the receipt.
- [ ] **Stricter CSP via Helmet** — currently default. Lock `script-src` to self + `checkout.razorpay.com`.
- [ ] **Order amount lock** — once a Razorpay order is created, treat `Order.total` as immutable. Today nothing prevents an admin from editing total on a PENDING order.

### 2.3 Operational

- [ ] **Set `RAZORPAY_WEBHOOK_SECRET` and `PUBLIC_BASE_URL`** in `.env` (placeholders right now)
- [ ] **Run `ngrok http 5000`** in dev whenever testing the webhook end-to-end
- [ ] **Monitor `PaymentEvent` table** during the first week of live traffic

---

## 3. End-to-End Flow

```
Customer                Browser (React)            Our Server                 Razorpay
   |                         |                          |                         |
   | 1. Click "Place Order"  |                          |                         |
   |------------------------>|                          |                         |
   |                         | 2. POST /api/orders      |                         |
   |                         |  (cart, address)         |                         |
   |                         |------------------------->|                         |
   |                         |                          | 3. Recompute total     |
   |                         |                          |    from DB (cart +     |
   |                         |                          |    coupon + tax)       |
   |                         |                          |                         |
   |                         |                          | 4. orders.create({     |
   |                         |                          |    amount: total*100,  |
   |                         |                          |    currency:"INR" })   |
   |                         |                          |------------------------>|
   |                         |                          |<------------------------|
   |                         |                          | 5. Save Order          |
   |                         |                          |    (PENDING,           |
   |                         |                          |     razorpayOrderId)   |
   |                         |  6. {orderId, razorpay   |                         |
   |                         |   :{orderId,amount,key}} |                         |
   |                         |<-------------------------|                         |
   |                         |                          |                         |
   |                         | 7. Open Razorpay         |                         |
   |                         |    checkout.js modal     |                         |
   |                         |-------------------------------------------------->|
   | 8. Enter card / UPI     |                          |                         |
   |------------------------------------------------------------------------>|
   |                         |                          |  9. Razorpay charges    |
   |                         |                          |     payment instrument  |
   |                         |                          |                         |
   |                         |                          |     [TWO PARALLEL PATHS]|
   |                         |                          |                         |
   |  PATH A - Browser callback                          PATH B - Webhook         |
   |                         |                          |                         |
   |                         | 10a. onSuccess(          |  10b. POST /api/        |
   |                         |   razorpay_payment_id,   |   webhooks/razorpay     |
   |                         |   razorpay_order_id,     |   X-Razorpay-Signature  |
   |                         |   razorpay_signature)    |   {event:"payment.      |
   |                         |<-------------------------|     captured", ...}     |
   |                         |                          |<------------------------|
   |                         | 11a. POST /api/orders/   |                         |
   |                         |   verify-payment         |  11b. Verify HMAC of    |
   |                         |------------------------->|     RAW body using      |
   |                         |                          |     RAZORPAY_WEBHOOK_   |
   |                         |                          |     SECRET              |
   |                         |                          |                         |
   |                         |  12. Verify HMAC of      |  12b. Insert            |
   |                         |   "{orderId}|{paymentId}"|     PaymentEvent        |
   |                         |   using                  |     (idempotent)        |
   |                         |   RAZORPAY_KEY_SECRET    |                         |
   |                         |                          |  13b. finalizePaidOrder |
   |                         |  13. payments.fetch(     |     (updateMany WHERE   |
   |                         |   paymentId) → assert    |      status=PENDING)    |
   |                         |   amount/currency/       |                         |
   |                         |   status/order_id        |                         |
   |                         |                          |                         |
   |                         |  14. finalizePaidOrder   |                         |
   |                         |   - flip PENDING->PAID   |                         |
   |                         |   - decrement stock      |                         |
   |                         |   - clear cart           |                         |
   |                         |   - bump coupon usage    |                         |
   |                         |   - send receipt email   |                         |
   |                         |   - log PaymentEvent     |                         |
   |                         |                          |                         |
   |                         |<-------------------------|                         |
   |                         | 15. Navigate to          |                         |
   |                         |   /order-success/:id     |                         |
   |<------------------------|                          |                         |
```

**Key insight**: Path A and Path B are racing. Whichever arrives first does the
real work; the other one hits the `WHERE paymentStatus = 'PENDING'` guard and
becomes a silent no-op. This is what makes the system **idempotent** — and what
makes the webhook a true safety net for the case where the browser dies before
step 11a.

---

## 4. Security Guarantees — Threat Model

| Threat | Mitigation | Where |
|---|---|---|
| Customer tampers cart total in DevTools | Server recomputes total from DB cart + coupon, ignores any client-supplied amount | `placeOrder` → `calculateTotals()` |
| Customer pays ₹1 for a ₹10,000 order | Server fetches authoritative amount from Razorpay and asserts equality with DB total | `verifyPayment` → `payments.fetch` validation |
| Customer replays another order's payment | Order row is bound to a specific `razorpayOrderId` (unique). Verify rejects if mismatched | `verifyPayment` order_id check |
| Forged signature | HMAC-SHA256 with `RAZORPAY_KEY_SECRET`, compared in constant time | `timingSafeEqualHex` |
| Forged webhook | HMAC-SHA256 of **raw body** with `RAZORPAY_WEBHOOK_SECRET`, constant-time compare | `razorpayWebhook` |
| Body parser corrupting webhook signature | Webhook route mounts `express.raw` BEFORE `express.json` | [server/src/app.js](server/src/app.js) |
| Double-charge from duplicate clicks | Frontend `paying` state disables button + idempotent `updateMany` server-side | `Checkout.jsx`, `finalizePaidOrder` |
| Lost browser callback (tab closed) | Webhook independently finalizes the order | Path B above |
| Replayed webhook | `PaymentEvent.@@unique([source, eventId, eventType])` rejects dupes | Schema |
| Brute-force signature guessing | `paymentVerifyLimiter`: 10 attempts / 10 min / user | Rate limiter |
| MITM on payment payloads | HSTS + HTTPS redirect in production | `app.js` |
| Stack trace / error leak revealing secret | All errors go through `errorHandler`; secrets never logged | `error.middleware.js` |
| Webhook endpoint flooded by attacker | `webhookLimiter` 200/min, signature check is the real gate | Rate limiter |
| Coupon double-counted | Coupon `usedCount` increment is inside the same transaction as PAID flip | `finalizePaidOrder` |
| Stock oversold under race | Stock decrement is inside the same transaction as PAID flip; runs only when `updateMany` flips | `finalizePaidOrder` |

---

## 5. Code Walkthrough

### 5.1 Order creation — [`placeOrder`](server/src/controllers/order.controller.js)

```
1. Validate input (shippingAddress, paymentMethod)
2. Load cart from DB with product + variant data
3. calculateTotals(cart) — single source of truth for amount
   - reads price from product.discountPrice || product.price (DB-side)
   - applies coupon, shipping, tax
   - throws if any variant is out of stock
4. razorpay.orders.create({ amount: total*100, currency: "INR", receipt: orderNumber })
5. prisma.$transaction:
   - INSERT Order (PENDING, razorpayOrderId)
   - INSERT OrderItems
   - INSERT initial OrderTracking row
6. Return { order, razorpay: { orderId, amount, currency, keyId } }
```

The amount returned to the client is purely cosmetic for the Razorpay modal. It
is **not** trusted on verify — the server fetches the authoritative amount
directly from Razorpay later.

### 5.2 Verify-payment — [`verifyPayment`](server/src/controllers/order.controller.js)

```
1. Validate request shape
2. Load Order from DB; reject if not owned by req.user
3. Assert order.razorpayOrderId === body.razorpayOrderId  (binding check)
4. HMAC SHA256 of "{razorpayOrderId}|{razorpayPaymentId}" with RAZORPAY_KEY_SECRET
   - timingSafeEqual against client-supplied signature
   - on fail: mark FAILED, log PaymentEvent, return 400
5. razorpay.payments.fetch(razorpayPaymentId)
   - on network/API fail: log + return 502 (don't mark FAILED — gateway issue)
6. Validate payment object:
   - payment.order_id === razorpayOrderId
   - payment.amount    === Math.round(order.total * 100)
   - payment.currency  === "INR"
   - payment.status    in ("captured","authorized")
   on fail: mark FAILED, log + return 400
7. finalizePaidOrder({ orderId, paymentId, amountPaise, source: "verify" })
8. log PaymentEvent (success or already_paid)
9. send receipt email if not already sent
10. return { order }
```

### 5.3 Webhook — [`razorpayWebhook`](server/src/controllers/order.controller.js)

```
1. Read X-Razorpay-Signature header
2. HMAC SHA256 of req.body (RAW Buffer) with RAZORPAY_WEBHOOK_SECRET
   - timingSafeEqual; on fail: log + 400
3. JSON.parse(rawBody)
4. Extract event, payment.entity, order.entity
5. Look up our Order by razorpayOrderId (unique index)
6. INSERT PaymentEvent with raw payload (idempotent on @@unique)
7. Switch on event:
   - payment.captured / order.paid:
     - validate payment.amount === order.total * 100
     - finalizePaidOrder(..., source: "webhook")
     - send email if first finalizer
   - payment.failed:
     - updateMany WHERE PENDING -> FAILED
   - refund.*: log only (handle later)
8. Return 200 (always, on signature OK — even for unhandled events,
   so Razorpay stops retrying)
```

### 5.4 The idempotent finalizer — `finalizePaidOrder`

This is the heart of the safety story. **A single SQL guard decides everything.**

```js
const flipped = await tx.order.updateMany({
  where: { id: orderId, paymentStatus: "PENDING" },
  data: { paymentStatus: "PAID", paymentId, paymentAmount, paidAt: new Date() }
});
if (flipped.count === 0) return { alreadyPaid: true };
// ... only here do we decrement stock, clear cart, bump coupon
```

- If `verify-payment` arrives first → `flipped.count = 1`, side effects run, status flips to PAID
- Webhook arrives second → `WHERE paymentStatus = 'PENDING'` matches zero rows → no-op, returns `alreadyPaid: true`
- Reverse order works the same way

This means we can run side effects exactly once **without** distributed locks,
job queues, or retry coordination. The DB row's status acts as the lock.

### 5.5 Rate limits — [`rateLimiter.js`](server/src/middleware/rateLimiter.js)

| Limiter | Window | Max | Key | Mounted on |
|---|---|---|---|---|
| `apiLimiter` | 1 min | 120 | IP | `/api` (global) |
| `authLimiter` | 15 min | 5 | IP | `/api/auth/login`, register |
| `paymentVerifyLimiter` | 10 min | 10 | userId (or IP) | `POST /api/orders/verify-payment` |
| `webhookLimiter` | 1 min | 200 | IP | `POST /api/webhooks/razorpay` |

`paymentVerifyLimiter` is keyed by `userId` so an attacker can't bypass it by
rotating IPs (and a legitimate user behind shared NAT isn't punished by their
neighbours).

---

## 6. Database Schema

### `Order` (relevant fields)

| Column | Type | Note |
|---|---|---|
| `paymentStatus` | enum (PENDING/PAID/FAILED/REFUNDED) | The lock |
| `paymentMethod` | enum (RAZORPAY/COD) | |
| `razorpayOrderId` | String? **@unique** | Links to Razorpay's order |
| `paymentId` | String? **@unique** | Razorpay's payment ID after capture |
| `paymentAmount` | Int? | Captured amount in paise |
| `paidAt` | DateTime? | Set when status flips to PAID |
| `total` | Decimal | Source of truth for amount validation |

### `PaymentEvent` (audit log)

Append-only. Every payment-related action creates a row.

| Column | Type | Purpose |
|---|---|---|
| `source` | "verify" \| "webhook" | Which path observed this event |
| `eventType` | String | `verify.success`, `verify.signature_failed`, `webhook.payment.captured`, etc. |
| `eventId` | String? | Razorpay payment/event ID — used for dedup |
| `signatureValid` | Boolean? | True if HMAC checked out |
| `errorMessage` | String? | If status = "failed" |
| `rawPayload` | Json? | Webhook payload (for forensics) |
| `ipAddress` | String? | For correlating with bad actors |
| `@@unique([source, eventId, eventType])` | | Replay protection |

Useful queries:
```sql
-- Suspicious activity
SELECT * FROM "PaymentEvent"
WHERE "eventType" LIKE '%signature_failed%'
   OR "eventType" LIKE '%amount_mismatch%'
   OR "eventType" LIKE '%validation_failed%'
ORDER BY "createdAt" DESC LIMIT 100;

-- Orders paid via webhook only (verify call never landed)
SELECT o.id, o."orderNumber", o."paidAt"
FROM "Order" o
WHERE o."paymentStatus" = 'PAID'
  AND NOT EXISTS (
    SELECT 1 FROM "PaymentEvent" e
    WHERE e."orderId" = o.id AND e.source = 'verify' AND e.status = 'success'
  );
```

---

## 7. Environment Variables

```bash
# Razorpay credentials (Test Mode for dev, Live Mode keys for prod)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# Webhook secret — set this in Razorpay Dashboard -> Settings -> Webhooks
# and paste the same value here.
RAZORPAY_WEBHOOK_SECRET=set_a_long_random_string

# Public HTTPS base URL where Razorpay sends webhooks. In dev: ngrok URL.
PUBLIC_BASE_URL=https://abc1-203-0-113-42.ngrok-free.app

# Force HTTPS in production
NODE_ENV=production
FORCE_HTTPS=true
```

---

## 8. Operational Runbook

### Local dev with webhook
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
ngrok http 5000
# Copy the https URL

# Razorpay Dashboard -> Settings -> Webhooks -> Add
# URL:    https://<ngrok>.ngrok-free.app/api/webhooks/razorpay
# Secret: paste into .env as RAZORPAY_WEBHOOK_SECRET
# Events: payment.captured, payment.failed, order.paid
# Restart server so it picks up the secret.
```

### Test cards (Test Mode only)
- Visa success: `4718 6091 0820 4366`, any future expiry, any CVV, OTP `1234`
- Failure: `4000 0000 0000 0002`
- UPI success VPA: `success@razorpay`
- UPI failure VPA: `failure@razorpay`

### Going live checklist
1. KYC approved in Razorpay dashboard
2. Live API keys swapped in prod `.env`
3. Live webhook registered with prod URL + new secret
4. `npx prisma migrate deploy` run on prod DB
5. `NODE_ENV=production`, `FORCE_HTTPS=true`
6. Smoke test with a ₹1 real card, then refund it manually from the dashboard
7. Watch `PaymentEvent` for the first 24h

### Reconciling a stuck PENDING order
```bash
# 1. Find the razorpayOrderId
SELECT id, "razorpayOrderId", total FROM "Order" WHERE id = '<orderId>';

# 2. Check Razorpay-side
curl -u $RAZORPAY_KEY_ID:$RAZORPAY_KEY_SECRET \
  https://api.razorpay.com/v1/orders/<razorpayOrderId>/payments

# 3. If a captured payment exists, replay the webhook from
#    Dashboard -> Webhooks -> Recent Deliveries -> Resend
#    (or finalize manually via a one-off script using finalizePaidOrder)
```

---

## 9. What This System Does NOT Do (yet)

- **Refunds** — webhook events are logged in `PaymentEvent` but no `Refund` model exists. Add when needed.
- **Partial payments / multi-installment** — single full-amount capture only.
- **Saved cards / tokens** — Razorpay's Token Vault is not integrated. Customers re-enter card each time.
- **Subscriptions / recurring** — not in scope.
- **Settlement reconciliation** — Razorpay's settlement reports aren't pulled into our DB.
- **Webhook IP allowlist** — relying on signature check alone today; add IP restriction at the edge for defence-in-depth.

---

## 10. Quick Reference

| File | What it does |
|---|---|
| [server/src/controllers/order.controller.js](server/src/controllers/order.controller.js) | `placeOrder`, `verifyPayment`, `razorpayWebhook`, `finalizePaidOrder`, `logPaymentEvent` |
| [server/src/middleware/rateLimiter.js](server/src/middleware/rateLimiter.js) | All rate limiters |
| [server/src/app.js](server/src/app.js) | HSTS, HTTPS redirect, webhook raw-body mount |
| [server/src/routes/order.routes.js](server/src/routes/order.routes.js) | Routes + per-endpoint limiters |
| [server/src/config/razorpay.js](server/src/config/razorpay.js) | SDK instance |
| [server/prisma/schema.prisma](server/prisma/schema.prisma) | `Order`, `PaymentEvent` models |
| [server/prisma/migrations/20260502150000_payment_security/migration.sql](server/prisma/migrations/20260502150000_payment_security/migration.sql) | Schema migration |
| [client/src/pages/Checkout.jsx](client/src/pages/Checkout.jsx) | Place Order UX, double-click guard |
| [client/src/utils/razorpay.js](client/src/utils/razorpay.js) | Loads `checkout.js` and opens the modal |
