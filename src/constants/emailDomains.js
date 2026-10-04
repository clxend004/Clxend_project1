// =========================================================
// SHARED EMAIL DOMAIN AUTOSUGGEST
// Used by LoginScreen and RegisterScreen so both offer the
// same "did you mean" domain suggestions while typing.
// =========================================================

export const emailDomains = [
  "@gmail.com",
  "@outlook.com",
  "@hotmail.com",
  "@yahoo.com",
  "@icloud.com",
  "@proton.me",
];

// Returns up to `limit` suggested full email addresses based
// on what's typed so far. Empty array once the value already
// looks like a complete domain (contains a "." after the @).
export function getEmailSuggestions(value, limit = 5) {
  const emailValue = (value || "").toLowerCase();

  if (!emailValue) return [];

  if (!emailValue.includes("@")) {
    return emailDomains.map((domain) => emailValue + domain).slice(0, limit);
  }

  const [username, typedDomain] = emailValue.split("@");

  if (typedDomain && typedDomain.includes(".")) {
    return [];
  }

  return emailDomains
    .filter((domain) => domain.substring(1).startsWith(typedDomain || ""))
    .map((domain) => username + domain)
    .slice(0, limit);
}