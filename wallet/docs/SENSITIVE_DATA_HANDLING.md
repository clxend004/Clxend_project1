Sensitive Data Handling — Notes
Passwords
Never stored anywhere in the frontend (not in `localStorage`, not
logged). Sent to the backend over the API call on login/register; the
backend is responsible for hashing (bcrypt/argon2) before storage
— this is correct and is not something the frontend should ever do
itself.
Government ID (Aadhaar) numbers and selfie images
Fixed as of this pass. Previously, `KYCScreen.js` and
`VerificationResultScreen.jsx` wrote the raw government ID number and
the full selfie image (as a base64 data URI) into `localStorage`,
unencrypted, with no expiry — and displayed the raw ID number on
screen. This is a real risk (XSS-readable, persists indefinitely) and
would not meet basic PII-handling expectations for a fintech product,
particularly for Aadhaar data under India's DPDP Act / UIDAI
guidelines.
Current behavior:
`localStorage` (`kycResult`) now only ever holds a minimal,
masked summary: status, face-match score, liveness flag, name,
a masked ID (`maskGovId()` in `src/utils/sensitiveData.js`, showing
only the last 4 digits), and a timestamp.
The full ID number and selfie are passed only via React Router
navigation state (`navigate(path, { state })`), which lives in
memory for that one screen render and is never written to disk.
Reloading the verification-result page, or returning to it later,
will only ever show the masked summary — the selfie won't reappear.
The ID number is masked (`XXXX XXXX 1234` style) everywhere it's
displayed in the frontend.
Auth token
Still stored in `localStorage` (`token` key). This is a common,
pragmatic choice but has a known tradeoff: `localStorage` is
readable by any script on the page, so a successful XSS attack
elsewhere in the app could steal the session token. The more
XSS-resistant alternative is an `httpOnly` secure cookie set by the
backend (not readable by JavaScript at all) — but that's a backend
decision (requires the login endpoint to `Set-Cookie` instead of
returning a token in the JSON body), not something the frontend can
change unilaterally. Flagging this for the backend team to weigh in
on.
Personal details (name, DOB, address, etc.)
Sent to the backend via `saveKYC()` at submission time — this is
correct, the backend needs it. It is not persisted to
`localStorage` (only `personalDetails.fullName` appears in the
minimal masked summary above).
Summary of what's still open
Auth token in `localStorage` vs. `httpOnly` cookie — backend
decision.
No client-side encryption-at-rest for anything (by design — the
fix here is to not store sensitive data client-side at all,
rather than encrypt it in a place an attacker with XSS could also
read the decryption key from).
This review covered the frontend only. The backend's actual
storage of Aadhaar numbers, selfies, and passwords (encryption at
rest, access controls, retention policy) is out of scope here and
should be reviewed separately with whoever owns that system.