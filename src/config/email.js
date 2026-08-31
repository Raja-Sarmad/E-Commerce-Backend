import nodemailer from "nodemailer";
import config from "./index.js";

/**
 * Nodemailer SMTP transport from env (MAIL_HOST, MAIL_USER, MAIL_PASS, etc.).
 */
function createTransport() {
  const options = {
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.secure,
  };

  if (config.mail.user && config.mail.pass) {
    options.auth = { user: config.mail.user, pass: config.mail.pass };
  }

  if (!config.mail.secure && config.mail.port === 587) {
    options.requireTLS = true;
  }

  return nodemailer.createTransport(options);
}

const transport = createTransport();

if (config.mail.user && config.mail.pass) {
  console.log(`[email] SMTP ready -> ${config.mail.host}:${config.mail.port} as ${config.mail.user}`);
} else {
  console.warn("[email] MAIL_USER / MAIL_PASS not set — emails will fail in production.");
}

export { transport, createTransport };
