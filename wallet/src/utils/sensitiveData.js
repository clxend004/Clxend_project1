// =========================================================
// SENSITIVE DATA HELPERS
//
// Government ID numbers (Aadhaar etc.) and similar identifiers
// should never be displayed in full or persisted to browser
// storage in full. This mirrors how banking/fintech apps mask
// account and card numbers.
// =========================================================

// "123456789012" -> "XXXX XXXX 9012"
export function maskGovId(idNumber) {
  if (!idNumber) return "";

  const digitsOnly = String(idNumber).replace(/\s/g, "");
  const lastFour = digitsOnly.slice(-4);
  const groups = Math.max(Math.ceil((digitsOnly.length - 4) / 4), 0);

  return `${Array(groups).fill("XXXX").join(" ")} ${lastFour}`.trim();
}