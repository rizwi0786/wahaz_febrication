function getClientIp(req) {
  // Cloudflare always injects this with the real visitor IP
  const cf = req.headers["cf-connecting-ip"];
  if (cf) return cf.trim();

  // Fallback: X-Forwarded-For (first IP in the chain)
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();

  const raw = String(req?.ip || req?.connection?.remoteAddress || "").trim();
  if (!raw) return "unknown";

  // "[IPv6]:port" -> IPv6
  const bracketed = raw.match(/^\[(.+)\]:\d+$/);
  if (bracketed) return bracketed[1];

  // "IPv4:port" -> IPv4
  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(raw)) return raw.split(":")[0];

  // IPv4-mapped IPv6 ("::ffff:1.2.3.4") -> IPv4
  const mapped = raw.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mapped) return mapped[1];

  return raw;
}

module.exports = { getClientIp };
