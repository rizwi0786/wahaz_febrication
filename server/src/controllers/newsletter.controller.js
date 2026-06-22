const prisma = require('../config/db');
const { ApiError, asyncHandler } = require('../utils/errorHandler');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');

// Simple, permissive email shape check. Real validation happens when we
// actually send mail; this just rejects obvious junk before hitting the DB.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/newsletter — public. Subscribe an email to the newsletter.
// Idempotent: re-subscribing an existing address succeeds quietly, and a
// previously unsubscribed address is reactivated.
const subscribe = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const source = req.body.source ? String(req.body.source).slice(0, 60) : 'home-footer';

  if (!email || !EMAIL_RE.test(email)) {
    throw new ApiError(400, 'Please enter a valid email address');
  }

  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });

  // Already subscribed and active — nothing to do, but don't leak that or error.
  if (existing && existing.isActive) {
    return res.status(200).json({ success: true, message: "You're already subscribed." });
  }

  const subscriber = existing
    ? await prisma.newsletterSubscriber.update({
        where: { email },
        data: { isActive: true, source },
      })
    : await prisma.newsletterSubscriber.create({
        data: { email, source },
      });

  // Best-effort emails — never fail the request if SMTP is down/unconfigured.
  const welcome = emailTemplates.newsletterWelcome();
  sendEmail({ to: email, subject: welcome.subject, html: welcome.html })
    .catch((e) => console.error('[email]', e));

  if (process.env.CONTACT_EMAIL) {
    const notice = emailTemplates.newsletterAdminNotice(email);
    sendEmail({ to: process.env.CONTACT_EMAIL, subject: notice.subject, html: notice.html })
      .catch((e) => console.error('[email]', e));
  }

  res.status(201).json({ success: true, message: 'Thank you for subscribing!', subscriber });
});

// -------- Admin --------

// GET /api/admin/newsletter — list subscribers (paginated + searchable).
const adminListSubscribers = asyncHandler(async (req, res) => {
  const { search, active, page = 1, limit = 50 } = req.query;
  const where = {};
  if (active === 'true') where.isActive = true;
  if (active === 'false') where.isActive = false;
  if (search) where.email = { contains: search, mode: 'insensitive' };

  const skip = (Number(page) - 1) * Number(limit);
  const [total, subscribers] = await prisma.$transaction([
    prisma.newsletterSubscriber.count({ where }),
    prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
  ]);

  res.json({
    success: true,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
    subscribers,
  });
});

// GET /api/admin/newsletter/export — download all active subscribers as CSV.
const adminExportSubscribers = asyncHandler(async (_req, res) => {
  const subs = await prisma.newsletterSubscriber.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });
  const rows = [
    'email,subscribedAt,source',
    ...subs.map((s) => `${s.email},${s.createdAt.toISOString()},${s.source || ''}`),
  ];
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="newsletter-subscribers.csv"');
  res.send(rows.join('\n'));
});

module.exports = {
  subscribe,
  adminListSubscribers,
  adminExportSubscribers,
};
