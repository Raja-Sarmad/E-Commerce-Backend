/** Strip to digits; keep leading + for E.164 when present. */
function normalizePhone(phone) {
  const raw = String(phone ?? "").trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (raw.startsWith("+")) return `+${digits}`;
  return digits;
}

function isValidPhone(phone) {
  const normalized = normalizePhone(phone);
  const digits = normalized.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

function toE164(phone) {
  const normalized = normalizePhone(phone);
  if (normalized.startsWith("+")) return normalized;
  if (normalized.length === 10) return `+1${normalized}`;
  if (normalized.length === 11 && normalized.startsWith("1")) return `+${normalized}`;
  if (normalized.length === 11 && normalized.startsWith("0")) return `+92${normalized.slice(1)}`;
  if (normalized.length === 10 && normalized.startsWith("3")) return `+92${normalized}`;
  return `+${normalized}`;
}

export { normalizePhone, isValidPhone, toE164 };
