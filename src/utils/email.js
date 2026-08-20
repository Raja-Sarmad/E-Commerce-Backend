import { transport } from "../config/email.js";
import config from "../config/index.js";

/**
 * Generic sendEmail helper. Never throws in production paths — failures
 * are logged so core flows (register/login) don't break when SMTP is down.
 *
 * @param {{ to: string, subject: string, html: string, text?: string }} mail
 */
async function sendEmail({ to, subject, html, text }) {
  const mailOptions = {
    from: config.mail.from,
    to,
    subject,
    html,
    text,
  };

  try {
    const info = await transport.sendMail(mailOptions);
    console.log(`[email] Sent "${subject}" -> ${to} (${info.messageId})`);
    return { ok: true, messageId: info.messageId, previewUrl: info.previewUrl };
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" -> ${to}:`, err.message);
    return { ok: false, error: err.message };
  }
}

const welcomeEmail = (name) => `
  <h2>Welcome to ${config.seed.adminName.split(" ")[0]}Mart!</h2>
  <p>Hi ${name},</p>
  <p>Thanks for creating an account. We're thrilled to have you on board.</p>
  <p>Happy shopping!</p>
`;

const verificationEmail = (name, url) => `
  <h2>Verify your email</h2>
  <p>Hi ${name},</p>
  <p>Please confirm your email address by clicking the link below. This link expires in 1 hour.</p>
  <p><a href="${url}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">Verify email</a></p>
  <p>If the button doesn't work, paste this into your browser: ${url}</p>
`;

const passwordResetEmail = (name, url) => `
  <h2>Reset your password</h2>
  <p>Hi ${name},</p>
  <p>We received a request to reset your password. Click below to choose a new one. This link expires in 1 hour.</p>
  <p><a href="${url}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">Reset password</a></p>
  <p>If you didn't request this, you can safely ignore this email.</p>
`;

const orderConfirmationEmail = (name, orderNumber, total) => `
  <h2>Order confirmed 🎉</h2>
  <p>Hi ${name},</p>
  <p>Your order <strong>#${orderNumber}</strong> has been placed successfully.</p>
  <p>Total: <strong>${total}</strong></p>
  <p>We'll email you as soon as it ships.</p>
`;

export {
  sendEmail,
  welcomeEmail,
  verificationEmail,
  passwordResetEmail,
  orderConfirmationEmail,
};
