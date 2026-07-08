const rateLimit = require('express-rate-limit');
const { getClientIp } = require('../utils/clientIp');

// Key by a normalized client IP. Supplying our own keyGenerator also bypasses
// express-rate-limit's built-in IP check, which otherwise raises
// ERR_ERL_INVALID_IP_ADDRESS when IIS/ARR sends X-Forwarded-For as "ip:port".
const ipKey = (req) => getClientIp(req);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKey,
  message: { success: false, message: 'Too many attempts. Try again in 15 minutes.' },
});

// Login limiter: keyed by the TARGETED account + client IP, and only FAILED
// logins count (skipSuccessfulRequests). Consequences:
//   - a correct login never consumes the budget, so normal users are never
//     throttled no matter how often they sign in;
//   - one person's wrong-password typos lock only THAT account from THAT IP,
//     not every user sharing the same WiFi/office/CGNAT IP;
//   - brute-forcing a single account still trips the limit after `max` misses.
// Falls back to IP-only keying when no email is supplied (malformed request).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 FAILED logins per account+IP per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const ip = getClientIp(req);
    return email ? `login:${email}:${ip}` : `login:ip:${ip}`;
  },
  message: {
    success: false,
    message: 'Too many failed login attempts for this account. Try again in 15 minutes.',
  },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKey,
  message: { success: false, message: 'Too many requests. Slow down.' },
});

// Image endpoint: every product card/banner/category tile is one request, so
// a normal browsing session fires far more of these than JSON calls. Cheap
// single-row reads + long browser/CDN caching keep the real load low.
const imageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKey,
  message: { success: false, message: 'Too many requests. Slow down.' },
});

// Verify-payment is sensitive: an attacker who guesses payment IDs/signatures
// shouldn't get unlimited tries. Keyed by user when authenticated, IP otherwise.
const paymentVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user?.id ? `u:${req.user.id}` : `ip:${getClientIp(req)}`),
  message: { success: false, message: 'Too many payment verification attempts.' },
});

// Razorpay retries webhooks aggressively on non-2xx; we keep this lenient
// but still bounded to absorb bursts without letting an open endpoint be abused.
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKey,
  message: { success: false, message: 'Too many webhook requests.' },
});

module.exports = {
  authLimiter,
  loginLimiter,
  apiLimiter,
  imageLimiter,
  paymentVerifyLimiter,
  webhookLimiter,
};
