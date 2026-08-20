import nodemailer from "nodemailer";
import config from "./index.js";

/**
 * SMTP transport built from env config.
 * Falls back to an Ethereal-style test account at runtime if no creds provided.
 */
function createTransport() {
  if (config.mail.user && config.mail.pass) {
    return nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.secure,
      auth: { user: config.mail.user, pass: config.mail.pass },
    });
  }
  return nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.secure,
  });
}

let transport = createTransport();

export { transport, createTransport };
