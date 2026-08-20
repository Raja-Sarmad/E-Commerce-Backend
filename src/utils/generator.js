/**
 * Generate a human-friendly unique order number, e.g. NM-100482.
 */
function generateOrderNumber() {
  const prefix = "NM";
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${random}`;
}

function generateReference(prefix = "TXN") {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${random}`;
}

export { generateOrderNumber, generateReference };
