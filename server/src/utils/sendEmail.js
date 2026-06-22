const transporter = require('../config/nodemailer');

/**
 * Send an HTML email. Silently logs (and does not throw) if SMTP is not
 * configured, so dev environments without real SMTP still work.
 */
async function sendEmail({ to, subject, html, text }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('[email] SMTP not configured; skipping send to', to);
    return { skipped: true };
  }

  const from = `"${process.env.FROM_NAME || 'Bellissimo Couture'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`;
  return transporter.sendMail({ from, to, subject, html, text });
}

// ----------------------------------------------------------------------
// Branded layout
// ----------------------------------------------------------------------

const BRAND_NAME    = process.env.FROM_NAME        || 'Bellissimo Couture';
const SITE_URL      = process.env.BRAND_WEBSITE_URL || process.env.CLIENT_URL || 'https://bellissimocouture.com';
const LOGO_URL      = process.env.BRAND_LOGO_URL    || `${SITE_URL}/email/header-logo.png`;
const FOOTER_URL    = process.env.BRAND_FOOTER_URL  || `${SITE_URL}/email/brand-footer.png`;
const TAGLINE       = process.env.BRAND_TAGLINE     || 'Designer Attire. Timeless Impression.';
const CONTACT_EMAIL = process.env.CONTACT_EMAIL     || process.env.FROM_EMAIL || '';
const CONTACT_PHONE = process.env.CONTACT_PHONE     || '';

const COLORS = {
  bg:      '#0D0D0D',
  surface: '#1A1A1A',
  text:    '#F5EFE6',
  muted:   '#B6AC9D',
  gold:    '#B89B6E',
  divider: '#2C2622',
  // The header/footer logo PNGs have a baked-in solid background of #1F2324.
  // Painting the logo cells this exact color hides the visible "box" so the
  // logo blends in. If you re-export the logos transparent (or on #0D0D0D),
  // change this back to COLORS.bg.
  logoBg:  '#1F2324',
};

function button(label, href, { color = COLORS.gold, textColor = '#0D0D0D' } = {}) {
  return `<a href="${href}" style="display:inline-block;background:${color};color:${textColor};padding:12px 28px;text-decoration:none;border-radius:4px;font-weight:600;letter-spacing:0.04em;font-size:14px">${label}</a>`;
}

/**
 * Wrap content in the standard branded shell (header logo + body + brand
 * footer card + contact line). `bodyHtml` is the per-email content.
 */
function layout({ previewText = '', bodyHtml }) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${BRAND_NAME}</title>
  </head>
  <body style="margin:0;padding:0;background:${COLORS.bg};font-family:Georgia,'Times New Roman',serif;color:${COLORS.text}">
    <span style="display:none!important;visibility:hidden;mso-hide:all;font-size:1px;color:${COLORS.bg};line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden">${previewText}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg}">
      <tr>
        <td align="center" style="padding:32px 16px">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${COLORS.surface};border-radius:8px;overflow:hidden">
            <tr>
              <td align="center" style="padding:28px 24px 18px;background:${COLORS.logoBg}">
                <a href="${SITE_URL}" style="text-decoration:none">
                  <img src="${LOGO_URL}" alt="${BRAND_NAME}" width="300" style="display:block;margin:0 auto;border:0;outline:none;max-width:320px;height:auto" />
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 8px;font-family:Montserrat,Arial,sans-serif;color:${COLORS.text};font-size:15px;line-height:1.6">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 24px">
                <hr style="border:0;border-top:1px solid ${COLORS.divider};margin:24px 0" />
                <p style="margin:0 0 12px;color:${COLORS.muted};font-family:Montserrat,Arial,sans-serif;font-size:12px">
                  Questions? Reply to this email${CONTACT_EMAIL ? ` or write to <a href="mailto:${CONTACT_EMAIL}" style="color:${COLORS.gold};text-decoration:none">${CONTACT_EMAIL}</a>` : ''}${CONTACT_PHONE ? ` • Call ${CONTACT_PHONE}` : ''}.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0;background:${COLORS.bg}">
                <a href="${SITE_URL}" style="text-decoration:none">
                  <img src="${FOOTER_URL}" alt="${BRAND_NAME} — ${TAGLINE}" width="600" style="display:block;border:0;outline:none;max-width:600px;width:100%;height:auto" />
                </a>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:18px 24px;background:${COLORS.bg};font-family:Montserrat,Arial,sans-serif;color:${COLORS.muted};font-size:11px;line-height:1.6">
                <a href="${SITE_URL}" style="color:${COLORS.gold};text-decoration:none">${SITE_URL.replace(/^https?:\/\//, '')}</a><br/>
                © ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function trackOrderUrl(orderId) {
  if (!orderId) return null;
  const base = process.env.CLIENT_URL || SITE_URL;
  return `${base.replace(/\/$/, '')}/orders/${orderId}`;
}

// ----------------------------------------------------------------------
// Templates
// ----------------------------------------------------------------------

const emailTemplates = {
  verifyEmail: (name, link) => ({
    subject: `Verify your ${BRAND_NAME} account`,
    html: layout({
      previewText: 'Confirm your email to start your bespoke journey.',
      bodyHtml: `
        <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:24px;margin:0 0 8px;color:${COLORS.text}">Welcome, ${name}.</h1>
        <p style="margin:0 0 14px;color:${COLORS.muted}">Please confirm your email address to begin.</p>
        <p style="margin:0 0 24px">${button('Verify Email', link)}</p>
        <p style="margin:0;color:${COLORS.muted};font-size:12px">If the button doesn't work, paste this link into your browser:<br/>
          <a href="${link}" style="color:${COLORS.gold};word-break:break-all">${link}</a>
        </p>
      `,
    }),
  }),

  resetPassword: (name, link) => ({
    subject: `Reset your ${BRAND_NAME} password`,
    html: layout({
      previewText: 'A secure link to set a new password.',
      bodyHtml: `
        <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:24px;margin:0 0 8px;color:${COLORS.text}">Hi ${name},</h1>
        <p style="margin:0 0 14px;color:${COLORS.muted}">Click below to set a new password. This link expires in 1 hour.</p>
        <p style="margin:0 0 24px">${button('Reset Password', link)}</p>
        <p style="margin:0;color:${COLORS.muted};font-size:12px">If you did not request this, you can safely ignore this email.</p>
      `,
    }),
  }),

  orderConfirmation: (order) => ({
    subject: `Order #${order.orderNumber} confirmed`,
    html: layout({
      previewText: `Your order ${order.orderNumber} is confirmed.`,
      bodyHtml: `
        <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:24px;margin:0 0 8px;color:${COLORS.text}">Thank you for your order.</h1>
        <p style="margin:0 0 14px;color:${COLORS.muted}">Your order <strong style="color:${COLORS.text}">#${order.orderNumber}</strong> has been confirmed.</p>
        <p style="margin:0 0 22px;color:${COLORS.text};font-size:16px"><strong>Total:</strong> Rs. ${order.total}</p>
        ${trackOrderUrl(order.id) ? `<p style="margin:0 0 20px">${button('Track your order', trackOrderUrl(order.id))}</p>` : ''}
        <p style="margin:0;color:${COLORS.muted}">We'll write again as soon as our master tailor begins work on your piece.</p>
      `,
    }),
  }),

  orderStatusUpdate: (order, status, message) => {
    const STATUS_COPY = {
      ORDER_RECEIVED: {
        label: 'Order Received',
        line: 'Thank you for placing your order. Our team has received your request and is preparing it for our master tailor.',
      },
      IN_TAILORING: {
        label: 'Master Tailor at Work',
        line: 'Your garment is now in the hands of our master tailor. Each cut, stitch and finish is being made specially for you.',
      },
      QUALITY_CHECK: {
        label: 'Quality Check',
        line: 'Tailoring is complete. Your piece is now going through a careful quality check before it leaves our atelier.',
      },
      READY_TO_SHIP: {
        label: 'Ready to Ship',
        line: 'Your bespoke piece has passed quality check and is packed, ready to leave our atelier.',
      },
      SHIPPED: {
        label: 'Shipped',
        line: 'Your order is on its way to you.',
      },
      OUT_FOR_DELIVERY: {
        label: 'Out for Delivery',
        line: 'Your order is out for delivery and will reach you very soon.',
      },
      DELIVERED: {
        label: 'Delivered',
        line: 'Your order has been delivered. We hope you love it — wear it well.',
      },
      CANCELLED: {
        label: 'Cancelled',
        line: 'Your order has been cancelled.',
      },
      RETURN_REQUESTED: {
        label: 'Return Requested',
        line: 'We have received your return request and will reach out with next steps.',
      },
      RETURNED: {
        label: 'Returned',
        line: 'We have received your returned order.',
      },
    };
    const copy = STATUS_COPY[status] || { label: status, line: '' };
    const trackUrl = trackOrderUrl(order.id);
    return {
      subject: `Order #${order.orderNumber} — ${copy.label}`,
      html: layout({
        previewText: copy.line,
        bodyHtml: `
          <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:24px;margin:0 0 6px;color:${COLORS.text}">${copy.label}</h1>
          <p style="margin:0 0 12px;color:${COLORS.muted}">Hi${order.user?.name ? ` ${order.user.name}` : ''},</p>
          <p style="margin:0 0 14px">${copy.line}</p>
          <p style="margin:0 0 18px;color:${COLORS.muted};font-size:14px">Order: <strong style="color:${COLORS.text}">#${order.orderNumber}</strong></p>
          ${message ? `<p style="background:#231C13;border-left:3px solid ${COLORS.gold};padding:12px 16px;border-radius:4px;margin:0 0 22px;color:${COLORS.text};font-style:italic">${message}</p>` : ''}
          ${trackUrl ? `<p style="margin:0 0 8px">${button('Track your order', trackUrl)}</p>` : ''}
          <p style="margin:24px 0 0;color:${COLORS.muted};font-size:13px">— The ${BRAND_NAME} atelier</p>
        `,
      }),
    };
  },

  consultationConfirmation: (booking, when) => {
    const confirmed = booking.status === 'CONFIRMED' && !!booking.meetLink;
    return {
      subject: confirmed
        ? `Your session is confirmed — ${booking.bookingNumber}`
        : `We received your session request — ${booking.bookingNumber}`,
      html: layout({
        previewText: confirmed
          ? `Your session is confirmed for ${when}.`
          : `We've received your session request for ${when}.`,
        bodyHtml: `
          <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:24px;margin:0 0 6px;color:${COLORS.text}">${confirmed ? 'Your session is confirmed' : 'Session request received'}</h1>
          <p style="margin:0 0 12px;color:${COLORS.muted}">Hi ${booking.name},</p>
          <p style="margin:0 0 14px">${confirmed
            ? 'Your virtual consultation is confirmed. The Google Meet link is below — we look forward to seeing you.'
            : 'Thank you for requesting a session with us. Our team will confirm shortly with a Google Meet link.'}</p>
          <p style="margin:0 0 6px;color:${COLORS.muted};font-size:14px">Booking: <strong style="color:${COLORS.text}">${booking.bookingNumber}</strong></p>
          <p style="margin:0 0 6px;color:${COLORS.muted};font-size:14px">When: <strong style="color:${COLORS.text}">${when}</strong> (${booking.duration} mins)</p>
          ${booking.topic ? `<p style="margin:0 0 18px;color:${COLORS.muted};font-size:14px">Topic: <strong style="color:${COLORS.text}">${booking.topic}</strong></p>` : ''}
          ${booking.meetLink
            ? `<p style="margin:18px 0 22px">${button('Join Google Meet', booking.meetLink)}</p>
               <p style="margin:0 0 18px;color:${COLORS.muted};font-size:12px">If the button doesn't work, paste this link into your browser:<br/>
                 <a href="${booking.meetLink}" style="color:${COLORS.gold};word-break:break-all">${booking.meetLink}</a>
               </p>`
            : `<p style="background:#231C13;border-left:3px solid ${COLORS.gold};padding:12px 16px;border-radius:4px;margin:18px 0 22px;color:${COLORS.text};font-style:italic">Our team will email you the Google Meet link once your session is confirmed.</p>`}
          <p style="margin:24px 0 0;color:${COLORS.muted};font-size:13px">— The ${BRAND_NAME} atelier</p>
        `,
      }),
    };
  },

  consultationConfirmedByAdmin: (booking, when, adminNotes) => ({
    subject: `Your session is confirmed — ${booking.bookingNumber}`,
    html: layout({
      previewText: `Your session is confirmed for ${when}.`,
      bodyHtml: `
        <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:24px;margin:0 0 6px;color:${COLORS.text}">Your session is confirmed</h1>
        <p style="margin:0 0 12px;color:${COLORS.muted}">Hi ${booking.name},</p>
        <p style="margin:0 0 14px">Your virtual consultation is confirmed. We look forward to seeing you.</p>
        <p style="margin:0 0 6px;color:${COLORS.muted};font-size:14px">Booking: <strong style="color:${COLORS.text}">${booking.bookingNumber}</strong></p>
        <p style="margin:0 0 6px;color:${COLORS.muted};font-size:14px">When: <strong style="color:${COLORS.text}">${when}</strong> (${booking.duration} mins)</p>
        ${booking.topic ? `<p style="margin:0 0 18px;color:${COLORS.muted};font-size:14px">Topic: <strong style="color:${COLORS.text}">${booking.topic}</strong></p>` : ''}
        ${booking.meetLink
          ? `<p style="margin:18px 0 22px">${button('Join Google Meet', booking.meetLink)}</p>
             <p style="margin:0 0 18px;color:${COLORS.muted};font-size:12px">If the button doesn't work, paste this link into your browser:<br/>
               <a href="${booking.meetLink}" style="color:${COLORS.gold};word-break:break-all">${booking.meetLink}</a>
             </p>`
          : ''}
        ${adminNotes ? `<p style="background:#231C13;border-left:3px solid ${COLORS.gold};padding:12px 16px;border-radius:4px;margin:0 0 22px;color:${COLORS.text};font-style:italic">${adminNotes}</p>` : ''}
        <p style="margin:24px 0 0;color:${COLORS.muted};font-size:13px">— The ${BRAND_NAME} atelier</p>
      `,
    }),
  }),

  consultationCancelled: (booking, reason) => ({
    subject: `Session update — ${booking.bookingNumber}`,
    html: layout({
      previewText: `Your session ${booking.bookingNumber} has been cancelled.`,
      bodyHtml: `
        <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:24px;margin:0 0 6px;color:${COLORS.text}">Session cancelled</h1>
        <p style="margin:0 0 12px;color:${COLORS.muted}">Hi ${booking.name},</p>
        <p style="margin:0 0 14px">Your session request <strong style="color:${COLORS.text}">${booking.bookingNumber}</strong> has been cancelled.</p>
        ${reason ? `<p style="background:#231C13;border-left:3px solid ${COLORS.gold};padding:12px 16px;border-radius:4px;margin:0 0 22px"><strong>Reason:</strong> ${reason}</p>` : ''}
        <p style="margin:24px 0 0;color:${COLORS.muted};font-size:13px">If this wasn't expected, reply to this email and we'll look into it right away.</p>
      `,
    }),
  }),

  consultationAdminNotice: (booking, when) => ({
    subject: `New consultation request — ${booking.bookingNumber}`,
    html: layout({
      previewText: `New consultation request from ${booking.name}.`,
      bodyHtml: `
        <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:24px;margin:0 0 6px;color:${COLORS.text}">New consultation request</h1>
        <p style="margin:0 0 12px;color:${COLORS.muted}">Booking <strong style="color:${COLORS.text}">${booking.bookingNumber}</strong></p>
        <p style="margin:0 0 6px;color:${COLORS.muted};font-size:14px">Name: <strong style="color:${COLORS.text}">${booking.name}</strong></p>
        <p style="margin:0 0 6px;color:${COLORS.muted};font-size:14px">Email: <strong style="color:${COLORS.text}">${booking.email}</strong></p>
        <p style="margin:0 0 6px;color:${COLORS.muted};font-size:14px">Phone: <strong style="color:${COLORS.text}">${booking.phone}</strong></p>
        <p style="margin:0 0 6px;color:${COLORS.muted};font-size:14px">Requested: <strong style="color:${COLORS.text}">${when}</strong> (${booking.duration} mins)</p>
        ${booking.topic ? `<p style="margin:0 0 6px;color:${COLORS.muted};font-size:14px">Topic: <strong style="color:${COLORS.text}">${booking.topic}</strong></p>` : ''}
        ${booking.notes ? `<p style="background:#231C13;border-left:3px solid ${COLORS.gold};padding:12px 16px;border-radius:4px;margin:14px 0 0;color:${COLORS.text};font-style:italic">${booking.notes}</p>` : ''}
      `,
    }),
  }),

  newsletterWelcome: () => ({
    subject: `Welcome to ${BRAND_NAME}`,
    html: layout({
      previewText: 'Thank you for subscribing — exclusive offers and new arrivals await.',
      bodyHtml: `
        <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:24px;margin:0 0 8px;color:${COLORS.text}">You're on the list.</h1>
        <p style="margin:0 0 14px;color:${COLORS.muted}">Thank you for subscribing to ${BRAND_NAME}. You'll be the first to know about exclusive offers, new arrivals and atelier stories.</p>
        <p style="margin:0 0 24px">${button('Explore the collection', SITE_URL)}</p>
        <p style="margin:24px 0 0;color:${COLORS.muted};font-size:13px">— The ${BRAND_NAME} atelier</p>
      `,
    }),
  }),

  newsletterAdminNotice: (email) => ({
    subject: `New newsletter subscriber`,
    html: layout({
      previewText: `New newsletter subscriber: ${email}`,
      bodyHtml: `
        <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:24px;margin:0 0 8px;color:${COLORS.text}">New newsletter subscriber</h1>
        <p style="margin:0 0 6px;color:${COLORS.muted};font-size:14px">Email: <strong style="color:${COLORS.text}">${email}</strong></p>
      `,
    }),
  }),

  orderCancelled: (order, reason) => ({
    subject: `Order #${order.orderNumber} cancelled`,
    html: layout({
      previewText: `Order ${order.orderNumber} has been cancelled.`,
      bodyHtml: `
        <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:24px;margin:0 0 8px;color:${COLORS.text}">Order Cancelled</h1>
        <p style="margin:0 0 14px;color:${COLORS.muted}">Your order <strong style="color:${COLORS.text}">#${order.orderNumber}</strong> has been cancelled.</p>
        ${reason ? `<p style="background:#231C13;border-left:3px solid ${COLORS.gold};padding:12px 16px;border-radius:4px;margin:0 0 18px"><strong>Reason:</strong> ${reason}</p>` : ''}
        ${trackOrderUrl(order.id) ? `<p style="margin:0 0 8px">${button('View order', trackOrderUrl(order.id))}</p>` : ''}
        <p style="margin:24px 0 0;color:${COLORS.muted};font-size:13px">If this wasn't expected, reply to this email and we'll look into it right away.</p>
      `,
    }),
  }),
};

module.exports = { sendEmail, emailTemplates };
