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

  const from = `"${process.env.FROM_NAME || 'Wahaz Fabrication'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`;
  return transporter.sendMail({ from, to, subject, html, text });
}

const emailTemplates = {
  verifyEmail: (name, link) => ({
    subject: 'Verify your Wahaz Fabrication account',
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:auto">
        <h2>Welcome, ${name}!</h2>
        <p>Please verify your email by clicking the button below.</p>
        <p><a href="${link}" style="background:#1A1A1A;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px">Verify Email</a></p>
        <p>If the button doesn't work, copy this link: ${link}</p>
      </div>
    `,
  }),
  resetPassword: (name, link) => ({
    subject: 'Reset your Wahaz Fabrication password',
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:auto">
        <h2>Hi ${name},</h2>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <p><a href="${link}" style="background:#1A1A1A;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px">Reset Password</a></p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
  }),
  orderConfirmation: (order) => ({
    subject: `Order #${order.orderNumber} confirmed`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:auto">
        <h2>Thank you for your order!</h2>
        <p>Your order <strong>#${order.orderNumber}</strong> has been confirmed.</p>
        <p><strong>Total:</strong> Rs. ${order.total}</p>
        <p>We will notify you when your order is shipped.</p>
      </div>
    `,
  }),
  orderStatusUpdate: (order, status, message) => ({
    subject: `Order #${order.orderNumber} — ${status}`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:auto">
        <h2>Order Update</h2>
        <p>Your order <strong>#${order.orderNumber}</strong> status has been updated to <strong>${status}</strong>.</p>
        ${message ? `<p>${message}</p>` : ''}
      </div>
    `,
  }),
  orderCancelled: (order, reason) => ({
    subject: `Order #${order.orderNumber} cancelled`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:auto">
        <h2>Order Cancelled</h2>
        <p>Your order <strong>#${order.orderNumber}</strong> has been cancelled.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      </div>
    `,
  }),
};

module.exports = { sendEmail, emailTemplates };
