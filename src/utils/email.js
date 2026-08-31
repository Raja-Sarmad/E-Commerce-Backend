import { transport } from "../config/email.js";
import config from "../config/index.js";

/**
 * Send email via Nodemailer. Never throws — failures are logged.
 *
 * @param {{ to: string, subject: string, html: string, text?: string }} mail
 */
async function sendEmail({ to, subject, html, text }) {
  const mailOptions = {
    from: config.mail.from,
    to,
    subject,
    html,
    text: text ?? stripHtml(html),
  };

  try {
    const info = await transport.sendMail(mailOptions);
    console.log(`[email] Sent "${subject}" -> ${to} (${info.messageId})`);
    if (info.previewUrl) {
      console.log(`[email] Preview: ${info.previewUrl}`);
    }
    return { ok: true, messageId: info.messageId, previewUrl: info.previewUrl };
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" -> ${to}:`, err.message);
    return { ok: false, error: err.message };
  }
}

/** Send a rendered template { subject, html, text } to a recipient. */
async function sendTemplateEmail(to, template) {
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

function stripHtml(html) {
  return String(html)
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export { sendEmail, sendTemplateEmail };

export {
  registrationOtpEmail,
  welcomeEmail,
  verificationEmail,
  passwordResetEmail,
  passwordChangedEmail,
  orderConfirmationEmail,
} from "./email-templates.js";
