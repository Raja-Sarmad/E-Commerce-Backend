import config from "../config/index.js";

/**
 * Send SMS via Twilio REST API when configured.
 * Returns { ok, devMode?, error? } — never throws.
 */
async function sendSms(to, body) {
  const { accountSid, authToken, fromNumber } = config.twilio;

  if (!accountSid || !authToken || !fromNumber) {
    if (config.isDev) {
      console.log(`[sms:dev] To ${to}: ${body}`);
      return { ok: true, devMode: true };
    }
    return { ok: false, error: "SMS service is not configured." };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const params = new URLSearchParams({ To: to, From: fromNumber, Body: body });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[sms] Twilio error:", errBody);
      return { ok: false, error: "Failed to send SMS." };
    }

    return { ok: true };
  } catch (err) {
    console.error("[sms] Send failed:", err.message);
    return { ok: false, error: "Failed to send SMS." };
  }
}

export { sendSms };
