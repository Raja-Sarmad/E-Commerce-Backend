import * as paymentService from "../modules/payments/payments.service.js";
import * as roleService from "../modules/roles/roles.service.js";

/**
 * Ensure default config data exists (payment methods, roles).
 * Called on server boot so the app always has sane defaults.
 */
async function ensureDefaultPaymentMethods() {
  try {
    await paymentService.ensureDefaultMethods();
    await roleService.ensureDefaultRoles();
  } catch (err) {
    console.error("[bootstrap] Failed to seed defaults:", err.message);
  }
}

export { ensureDefaultPaymentMethods };
