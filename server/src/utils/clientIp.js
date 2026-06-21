// IIS / ARR (and some other reverse proxies) append the client's port to the
// X-Forwarded-For header, so Express resolves req.ip to values like
// "203.0.113.7:51234" or "[::1]:51234". That:
//   1. fails IP parsing — express-rate-limit raises ERR_ERL_INVALID_IP_ADDRESS, and
//   2. would split one client across many rate-limit buckets (each port = a key).
// Normalize req.ip down to a bare IP for keying and logging.
function getClientIp(req) {
  const raw = String(req?.ip || req?.connection?.remoteAddress || '').trim();
  if (!raw) return 'unknown';

  // "[IPv6]:port" -> IPv6
  const bracketed = raw.match(/^\[(.+)\]:\d+$/);
  if (bracketed) return bracketed[1];

  // "IPv4:port" (exactly four dotted octets + :port) -> IPv4
  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(raw)) return raw.split(':')[0];

  // IPv4-mapped IPv6 ("::ffff:1.2.3.4") -> IPv4 for tidier keys/logs
  const mapped = raw.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mapped) return mapped[1];

  // Bare IPv4 or bare IPv6 — already clean.
  return raw;
}

module.exports = { getClientIp };
