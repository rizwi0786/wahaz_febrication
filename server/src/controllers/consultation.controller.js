const prisma = require('../config/db');
const { ApiError, asyncHandler } = require('../utils/errorHandler');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');
const { createMeetEvent, generateAuthUrl, exchangeCodeForTokens, isConfigured } = require('../utils/googleCalendar');

function generateBookingNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BC-CONSULT-${ts}-${rand}`;
}

function fmtDate(d, time) {
  try {
    const dt = new Date(d);
    return `${dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at ${time}`;
  } catch {
    return `${d} at ${time}`;
  }
}

// POST /api/consultations
const createConsultation = asyncHandler(async (req, res) => {
  const { name, email, phone, preferredDate, preferredTime, duration, topic, notes } = req.body;
  if (!name || !email || !phone || !preferredDate || !preferredTime) {
    throw new ApiError(400, 'name, email, phone, preferredDate and preferredTime are required');
  }
  const date = new Date(preferredDate);
  if (isNaN(date.getTime())) throw new ApiError(400, 'Invalid date');
  if (date < new Date(new Date().toDateString())) {
    throw new ApiError(400, 'Preferred date cannot be in the past');
  }

  const created = await prisma.consultationBooking.create({
    data: {
      bookingNumber: generateBookingNumber(),
      userId: req.user?.id || null,
      name,
      email,
      phone,
      preferredDate: date,
      preferredTime,
      duration: Number(duration) > 0 ? Number(duration) : 30,
      topic: topic || null,
      notes: notes || null,
      status: 'PENDING',
    },
  });

  // Best-effort: auto-create a Google Meet event if creds are configured.
  // Failure here should NOT fail the booking — admin can confirm manually.
  let autoMeetResult = null;
  try {
    autoMeetResult = await createMeetEvent({
      summary: `Bellissimo Couture session — ${name}`,
      description: `Booking ${created.bookingNumber}\nTopic: ${topic || '—'}\nNotes: ${notes || '—'}\nPhone: ${phone}`,
      preferredDate: date,
      preferredTime,
      durationMinutes: created.duration,
      attendeeEmails: [
        email,
        process.env.CONTACT_EMAIL || process.env.SMTP_USER,
      ],
    });
    if (autoMeetResult?.meetLink) {
      await prisma.consultationBooking.update({
        where: { id: created.id },
        data: {
          status: 'CONFIRMED',
          meetLink: autoMeetResult.meetLink,
        },
      });
      created.status = 'CONFIRMED';
      created.meetLink = autoMeetResult.meetLink;
    }
  } catch (err) {
    console.error('[google-calendar]', err?.message || err);
  }

  const when = fmtDate(date, preferredTime);

  // Customer confirmation
  const customerTpl = emailTemplates.consultationConfirmation(created, when);
  sendEmail({ to: email, subject: customerTpl.subject, html: customerTpl.html })
    .catch((e) => console.error('[email]', e));

  // Admin notice
  if (process.env.CONTACT_EMAIL) {
    const adminTpl = emailTemplates.consultationAdminNotice(created, when);
    sendEmail({ to: process.env.CONTACT_EMAIL, subject: adminTpl.subject, html: adminTpl.html })
      .catch((e) => console.error('[email]', e));
  }

  res.status(201).json({
    success: true,
    consultation: created,
    autoMeet: autoMeetResult?.configured
      ? { ok: !!autoMeetResult.meetLink, meetLink: autoMeetResult.meetLink || null }
      : { ok: false, configured: false },
  });
});

// -------- Google OAuth setup (admin) --------

// GET /api/admin/google/auth-url
const googleAuthUrl = asyncHandler(async (_req, res) => {
  const url = generateAuthUrl();
  if (!url) {
    throw new ApiError(
      400,
      'GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET must be set in .env first',
    );
  }
  res.json({ success: true, url });
});

// GET /api/admin/google/callback?code=...
// Google redirects here after admin authorizes. We exchange the code for
// a refresh token and PRINT it so the admin can paste it into .env.
const googleCallback = asyncHandler(async (req, res) => {
  const { code, error } = req.query;
  if (error) return res.status(400).send(`<h1>Authorization error: ${error}</h1>`);
  if (!code) return res.status(400).send('<h1>Missing code parameter</h1>');
  const tokens = await exchangeCodeForTokens(code);
  const refresh = tokens.refresh_token;
  if (!refresh) {
    return res.status(400).send(`
      <h1>No refresh token returned</h1>
      <p>Google only returns a refresh token on the first authorization for a given client.
         Visit your Google Account → Security → Third-party access, remove the app, then retry.</p>
    `);
  }
  res.send(`
    <html><body style="font-family:sans-serif;max-width:640px;margin:40px auto">
      <h2>Google Calendar connected ✅</h2>
      <p>Add the following line to your <code>server/.env</code> file and restart the server:</p>
      <pre style="background:#f4f4f4;padding:12px;border-radius:6px;word-break:break-all">GOOGLE_OAUTH_REFRESH_TOKEN=${refresh}</pre>
      <p>From now on, every consultation booking will auto-create a Google Meet event with the customer's email and yours as attendees.</p>
    </body></html>
  `);
});

// GET /api/admin/google/status
const googleStatus = asyncHandler(async (_req, res) => {
  res.json({
    success: true,
    configured: isConfigured(),
    hasClientId: !!process.env.GOOGLE_OAUTH_CLIENT_ID,
    hasClientSecret: !!process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    hasRefreshToken: !!process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
  });
});

// GET /api/consultations
const getMyConsultations = asyncHandler(async (req, res) => {
  const list = await prisma.consultationBooking.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, consultations: list });
});

// POST /api/consultations/:id/cancel
const cancelConsultation = asyncHandler(async (req, res) => {
  const c = await prisma.consultationBooking.findUnique({ where: { id: req.params.id } });
  if (!c || (c.userId && c.userId !== req.user.id)) throw new ApiError(404, 'Booking not found');
  if (['CANCELLED', 'COMPLETED'].includes(c.status)) {
    throw new ApiError(400, `Cannot cancel a ${c.status} booking`);
  }
  const updated = await prisma.consultationBooking.update({
    where: { id: c.id },
    data: { status: 'CANCELLED' },
  });
  res.json({ success: true, consultation: updated });
});

// -------- Admin --------

// GET /api/admin/consultations
const adminListConsultations = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;
  const where = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { bookingNumber: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [total, consultations] = await prisma.$transaction([
    prisma.consultationBooking.count({ where }),
    prisma.consultationBooking.findMany({
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
    consultations,
  });
});

// GET /api/admin/consultations/:id
const adminGetConsultation = asyncHandler(async (req, res) => {
  const c = await prisma.consultationBooking.findUnique({ where: { id: req.params.id } });
  if (!c) throw new ApiError(404, 'Booking not found');
  res.json({ success: true, consultation: c });
});

// PUT /api/admin/consultations/:id/confirm
const adminConfirmConsultation = asyncHandler(async (req, res) => {
  const { meetLink, adminNotes, preferredDate, preferredTime } = req.body;
  if (!meetLink) throw new ApiError(400, 'meetLink is required');

  const c = await prisma.consultationBooking.findUnique({ where: { id: req.params.id } });
  if (!c) throw new ApiError(404, 'Booking not found');

  const updated = await prisma.consultationBooking.update({
    where: { id: c.id },
    data: {
      status: 'CONFIRMED',
      meetLink,
      adminNotes: adminNotes || c.adminNotes,
      preferredDate: preferredDate ? new Date(preferredDate) : c.preferredDate,
      preferredTime: preferredTime || c.preferredTime,
    },
  });

  const when = fmtDate(updated.preferredDate, updated.preferredTime);
  const tpl = emailTemplates.consultationConfirmedByAdmin(updated, when, adminNotes);
  sendEmail({ to: updated.email, subject: tpl.subject, html: tpl.html })
    .catch((e) => console.error('[email]', e));

  res.json({ success: true, consultation: updated });
});

// PUT /api/admin/consultations/:id/cancel
const adminCancelConsultation = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const c = await prisma.consultationBooking.findUnique({ where: { id: req.params.id } });
  if (!c) throw new ApiError(404, 'Booking not found');
  const updated = await prisma.consultationBooking.update({
    where: { id: c.id },
    data: { status: 'CANCELLED', adminNotes: reason || c.adminNotes },
  });
  const tpl = emailTemplates.consultationCancelled(c, reason);
  sendEmail({ to: c.email, subject: tpl.subject, html: tpl.html })
    .catch((e) => console.error('[email]', e));
  res.json({ success: true, consultation: updated });
});

// PUT /api/admin/consultations/:id/complete
const adminCompleteConsultation = asyncHandler(async (req, res) => {
  const c = await prisma.consultationBooking.findUnique({ where: { id: req.params.id } });
  if (!c) throw new ApiError(404, 'Booking not found');
  const updated = await prisma.consultationBooking.update({
    where: { id: c.id },
    data: { status: 'COMPLETED' },
  });
  res.json({ success: true, consultation: updated });
});

module.exports = {
  createConsultation,
  getMyConsultations,
  cancelConsultation,
  adminListConsultations,
  adminGetConsultation,
  adminConfirmConsultation,
  adminCancelConsultation,
  adminCompleteConsultation,
  googleAuthUrl,
  googleCallback,
  googleStatus,
};
