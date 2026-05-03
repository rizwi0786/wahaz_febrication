const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Try again in 15 minutes.' },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Slow down.' },
});

// Verify-payment is sensitive: an attacker who guesses payment IDs/signatures
// shouldn't get unlimited tries. Keyed by user when authenticated, IP otherwise.
const paymentVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user?.id ? `u:${req.user.id}` : `ip:${req.ip}`),
  message: { success: false, message: 'Too many payment verification attempts.' },
});

// Razorpay retries webhooks aggressively on non-2xx; we keep this lenient
// but still bounded to absorb bursts without letting an open endpoint be abused.
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many webhook requests.' },
});

module.exports = { authLimiter, apiLimiter, paymentVerifyLimiter, webhookLimiter };
