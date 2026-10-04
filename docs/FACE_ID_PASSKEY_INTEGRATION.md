Face ID / Passkey Integration (WebAuthn)
Status: frontend fully built; needs 5 new backend endpoints to actually work
This uses the browser's native WebAuthn API — no third-party
passkey vendor, no SDK to install. It's a W3C/FIDO standard supported
by Face ID, Touch ID, Windows Hello, and hardware keys, built into
every modern browser (`navigator.credentials.create()` /
`navigator.credentials.get()`).
Nothing about authentication security can be faked or mocked on the
frontend alone — that would defeat the entire point of a
cryptographic authentication method. This document describes exactly
what the backend needs to implement for this to actually work.
Where the frontend code lives
File	Responsibility
`src/utils/webauthn.js`	Converts between base64url (JSON-safe) and ArrayBuffer (what the browser API needs)
`src/services/webauthnService.js`	Calls the backend endpoints, feature detection, friendly error mapping
`src/screens/LoginScreen.js`	"Continue with Face ID / Passkey" button — only shown if the device supports it
`src/screens/SecuritySettingsScreen.js` (`/security`)	Where a logged-in user enrolls/removes passkeys
What's already working right now
Feature detection: the passkey button only appears if
`window.PublicKeyCredential` exists and
`isUserVerifyingPlatformAuthenticatorAvailable()` confirms an actual
platform authenticator (Face ID/Touch ID/Windows Hello) is present.
No broken button on unsupported browsers/devices.
All binary ↔ JSON conversion (challenge, credential IDs, signatures)
— this is the fiddly part most people get wrong, and it's fully
implemented and tested (`src/utils/webauthn.test.js`).
Friendly error messages for the standard WebAuthn failure cases
(user cancelled, timeout, duplicate registration, unsupported
browser context).
A UI to enroll and remove passkeys (`/security`).
What's needed from the backend — 5 endpoints
All require the caller to already be authenticated (send the
`Authorization: Bearer <token>` header, same as every other endpoint)
except `/webauthn/login/options` and `/webauthn/login/verify`,
which are used to log in — the user isn't authenticated yet at that
point.
1. `POST /webauthn/register/options`
Called when a logged-in user clicks "Add Passkey."
Request:
```json
{ "label": "My iPhone" }
```
Response — a WebAuthn `PublicKeyCredentialCreationOptions` object,
JSON-encoded (binary fields as base64url strings):
```json
{
  "challenge": "base64url-random-bytes",
  "rp": { "name": "VECTRO Wallet", "id": "yourdomain.com" },
  "user": {
    "id": "base64url-encoded-user-id",
    "name": "user@example.com",
    "displayName": "Jane Doe"
  },
  "pubKeyCredParams": [{ "type": "public-key", "alg": -7 }],
  "authenticatorSelection": {
    "authenticatorAttachment": "platform",
    "userVerification": "required"
  },
  "excludeCredentials": []
}
```
The backend must generate and temporarily store the `challenge`
server-side (e.g. in Redis or a short-lived DB row, keyed to the
user's session) to verify against in step 2.
2. `POST /webauthn/register/verify`
Request: `{ "credential": {...}, "label": "My iPhone" }` — `credential`
is exactly what `serializeRegistrationCredential()` produces on the
frontend.
The backend verifies the attestation against the challenge it stored
in step 1, then stores the resulting public key against the user's
account (not the frontend — no raw credential data should ever
touch the database via a different path).
Response: `{ "id": "...", "label": "My iPhone", "createdAt": "..." }`
3. `POST /webauthn/login/options`
Request: `{ "email": "user@example.com" }` (email is optional — see
"Usernameless login" below).
Response — a `PublicKeyCredentialRequestOptions` object:
```json
{
  "challenge": "base64url-random-bytes",
  "allowCredentials": [
    { "id": "base64url-credential-id", "type": "public-key" }
  ],
  "userVerification": "required"
}
```
4. `POST /webauthn/login/verify`
Request: `{ "credential": {...} }` — from
`serializeAuthenticationCredential()`.
The backend verifies the signature against the stored public key and
the challenge from step 3.
Response — same shape as normal email/password login, so the
frontend can reuse its existing session-handling code:
```json
{
  "success": true,
  "token": "jwt-or-session-token",
  "user": { "id": 1, "email": "user@example.com" },
  "message": "Signed in with passkey successfully"
}
```
5. `POST /webauthn/list` and `POST /webauthn/remove`
`/webauthn/list` → `{ "passkeys": [{ "id", "label", "createdAt" }] }`
for the logged-in user (no sensitive key material — just enough to
show a management list).
`/webauthn/remove` → request `{ "passkeyId": "..." }`, deletes that
credential for the logged-in user only (must verify ownership
server-side, not trust the frontend).
Usernameless ("discoverable credential") login
The frontend calls `loginWithPasskey()` without an email if the
user is on the Mobile tab or hasn't typed anything yet — this relies
on the authenticator itself listing which accounts it has a passkey
for (this is what lets a real "Sign in with a passkey" experience skip
typing a username entirely). This requires the backend to issue a
challenge with no `allowCredentials` restriction and instead
resolve the account from the `userHandle` returned in the assertion.
Not every backend WebAuthn library supports this out of the box —
confirm your chosen library does before promising this UX.
Suggested backend library
Don't hand-roll WebAuthn cryptographic verification. Use an
established library:
Node/Express: `@simplewebauthn/server`
Python/FastAPI: `webauthn` (Duo Labs) or `py_webauthn`
Java/Spring: `webauthn4j`
These handle challenge generation, attestation/assertion verification,
and the various edge cases (algorithm negotiation, counter checks to
detect cloned authenticators) correctly — this is not something to
reimplement from the spec directly.
What I could not verify
Same limitation as the other backend integrations: I have no network
access to your running backend from this environment, so none of
these 5 endpoints have been tested against a live implementation.
Once they exist, the fastest way to verify: go to `/security` while
logged in, add a passkey, log out, then use "Continue with Face ID /
Passkey" on the login screen.