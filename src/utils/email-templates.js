import config from "../config/index.js";

const BRAND = "NovaMart";
const PRIMARY = "#2563eb";
const PRIMARY_DARK = "#1d4ed8";
const TEXT = "#18181b";
const MUTED = "#71717a";
const BORDER = "#e4e4e7";
const BG = "#f4f4f5";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function emailLayout({ title, preheader, bodyHtml, footerNote }) {
  const safeTitle = escapeHtml(title);
  const safePreheader = escapeHtml(preheader ?? title);
  const safeFooter = escapeHtml(footerNote ?? `© ${new Date().getFullYear()} ${BRAND}. All rights reserved.`);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${safeTitle}</title>
  <!--[if mso]><style>body,table,td{font-family:Arial,sans-serif!important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${safePreheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${BG};padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <div style="display:inline-block;background:${PRIMARY};color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.02em;padding:10px 18px;border-radius:12px;">
                ${BRAND}
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border:1px solid ${BORDER};border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(24,24,27,0.06);">
                <tr>
                  <td style="height:4px;background:linear-gradient(90deg,${PRIMARY},${PRIMARY_DARK});font-size:0;line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:32px 28px 28px;color:${TEXT};font-size:15px;line-height:1.6;">
                    ${bodyHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 8px 0;color:${MUTED};font-size:12px;line-height:1.5;">
              ${safeFooter}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function primaryButton(label, href) {
  const safeLabel = escapeHtml(label);
  const safeHref = escapeHtml(href);
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 8px;">
  <tr>
    <td align="center" style="border-radius:10px;background:${PRIMARY};">
      <a href="${safeHref}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">
        ${safeLabel}
      </a>
    </td>
  </tr>
</table>`;
}

function otpBox(code) {
  const safeCode = escapeHtml(code);
  return `<div style="margin:24px 0;text-align:center;">
  <div style="display:inline-block;background:#eff6ff;border:1px dashed #93c5fd;border-radius:12px;padding:18px 28px;">
    <p style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};">Verification code</p>
    <p style="margin:0;font-size:34px;font-weight:800;letter-spacing:10px;color:${PRIMARY_DARK};font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${safeCode}</p>
  </div>
</div>`;
}

function infoBox(text) {
  return `<div style="margin-top:20px;padding:14px 16px;background:#fafafa;border:1px solid ${BORDER};border-radius:10px;color:${MUTED};font-size:13px;line-height:1.5;">
  ${text}
</div>`;
}

function registrationOtpEmail(code) {
  const bodyHtml = `
    <h1 style="margin:0 0 8px;font-size:24px;line-height:1.3;font-weight:800;color:${TEXT};">Verify your email</h1>
    <p style="margin:0 0 16px;color:${MUTED};">Enter this code on the registration page to create your ${BRAND} account.</p>
    ${otpBox(code)}
    <p style="margin:0;color:${MUTED};font-size:14px;">This code expires in <strong style="color:${TEXT};">10 minutes</strong>. Do not share it with anyone.</p>
    ${infoBox("If you didn't try to sign up, you can safely ignore this email.")}`;

  const text = `Your ${BRAND} verification code is ${code}. It expires in 10 minutes.`;

  return {
    subject: `${code} is your ${BRAND} verification code`,
    html: emailLayout({
      title: "Verify your email",
      preheader: `Your verification code is ${code}`,
      bodyHtml,
    }),
    text,
  };
}

function welcomeEmail(name) {
  const safeName = escapeHtml(name);
  const shopUrl = config.frontendUrl;

  const bodyHtml = `
    <h1 style="margin:0 0 8px;font-size:24px;line-height:1.3;font-weight:800;color:${TEXT};">Welcome, ${safeName}! 🎉</h1>
    <p style="margin:0 0 16px;color:${MUTED};">Your account is ready. Start exploring deals, track orders, and save items to your wishlist.</p>
    ${primaryButton("Start shopping", shopUrl)}
    <p style="margin:16px 0 0;color:${MUTED};font-size:14px;">We're glad to have you at ${BRAND}.</p>`;

  return {
    subject: `Welcome to ${BRAND}!`,
    html: emailLayout({
      title: `Welcome to ${BRAND}`,
      preheader: `Hi ${name}, your account is ready.`,
      bodyHtml,
    }),
    text: `Hi ${name},\n\nWelcome to ${BRAND}! Your account is ready.\n\nShop now: ${shopUrl}`,
  };
}

function verificationEmail(name, url) {
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(url);

  const bodyHtml = `
    <h1 style="margin:0 0 8px;font-size:24px;line-height:1.3;font-weight:800;color:${TEXT};">Confirm your email</h1>
    <p style="margin:0 0 16px;color:${MUTED};">Hi ${safeName}, please verify your email address to secure your account.</p>
    ${primaryButton("Verify email", url)}
    <p style="margin:16px 0 0;color:${MUTED};font-size:13px;">Or copy this link:<br /><a href="${safeUrl}" style="color:${PRIMARY};word-break:break-all;">${safeUrl}</a></p>
    ${infoBox("This link expires in 1 hour.")}`;

  return {
    subject: `Verify your ${BRAND} email`,
    html: emailLayout({
      title: "Verify your email",
      preheader: "Confirm your email address",
      bodyHtml,
    }),
    text: `Hi ${name},\n\nVerify your email: ${url}\n\nThis link expires in 1 hour.`,
  };
}

function passwordResetEmail(name, url) {
  const safeName = escapeHtml(name);

  const bodyHtml = `
    <h1 style="margin:0 0 8px;font-size:24px;line-height:1.3;font-weight:800;color:${TEXT};">Reset your password</h1>
    <p style="margin:0 0 16px;color:${MUTED};">Hi ${safeName}, we received a request to reset your password.</p>
    ${primaryButton("Reset password", url)}
    ${infoBox("If you didn't request a password reset, ignore this email. Your password will stay the same.")}`;

  return {
    subject: `Reset your ${BRAND} password`,
    html: emailLayout({
      title: "Reset your password",
      preheader: "Reset your account password",
      bodyHtml,
    }),
    text: `Hi ${name},\n\nReset your password: ${url}\n\nThis link expires in 1 hour.`,
  };
}

function passwordChangedEmail(name) {
  const safeName = escapeHtml(name);

  const bodyHtml = `
    <h1 style="margin:0 0 8px;font-size:24px;line-height:1.3;font-weight:800;color:${TEXT};">Password updated</h1>
    <p style="margin:0 0 16px;color:${MUTED};">Hi ${safeName}, your ${BRAND} password was changed successfully.</p>
    ${infoBox("If this wasn't you, contact support immediately and secure your account.")}`;

  return {
    subject: `Your ${BRAND} password was changed`,
    html: emailLayout({
      title: "Password changed",
      preheader: "Your password was updated",
      bodyHtml,
    }),
    text: `Hi ${name},\n\nYour ${BRAND} password was changed successfully.`,
  };
}

function orderConfirmationEmail(name, orderNumber, total) {
  const safeName = escapeHtml(name);
  const safeOrder = escapeHtml(orderNumber);
  const safeTotal = escapeHtml(total);
  const ordersUrl = `${config.frontendUrl}/orders`;

  const bodyHtml = `
    <h1 style="margin:0 0 8px;font-size:24px;line-height:1.3;font-weight:800;color:${TEXT};">Order confirmed 🎉</h1>
    <p style="margin:0 0 20px;color:${MUTED};">Hi ${safeName}, thanks for your order! We've received it and will notify you when it ships.</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafafa;border:1px solid ${BORDER};border-radius:12px;">
      <tr>
        <td style="padding:16px 18px;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:${MUTED};">Order number</p>
          <p style="margin:0 0 14px;font-size:18px;font-weight:700;color:${TEXT};">#${safeOrder}</p>
          <p style="margin:0 0 6px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:${MUTED};">Total paid</p>
          <p style="margin:0;font-size:22px;font-weight:800;color:${PRIMARY_DARK};">${safeTotal}</p>
        </td>
      </tr>
    </table>
    ${primaryButton("View my orders", ordersUrl)}`;

  return {
    subject: `Order #${orderNumber} confirmed — ${BRAND}`,
    html: emailLayout({
      title: "Order confirmed",
      preheader: `Order #${orderNumber} — ${total}`,
      bodyHtml,
    }),
    text: `Hi ${name},\n\nOrder #${orderNumber} confirmed.\nTotal: ${total}\n\nView orders: ${ordersUrl}`,
  };
}

export {
  registrationOtpEmail,
  welcomeEmail,
  verificationEmail,
  passwordResetEmail,
  passwordChangedEmail,
  orderConfirmationEmail,
};
