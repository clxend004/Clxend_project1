// =========================================================
// WEBAUTHN — BINARY <-> JSON HELPERS
//
// The WebAuthn browser API (navigator.credentials.create /
// .get) works with raw ArrayBuffers, but our backend speaks
// JSON. These helpers convert between base64url strings (safe
// to put in JSON) and ArrayBuffers (what the browser API
// needs) in both directions.
//
// No external library needed for this — it's a handful of
// small, well-understood conversions.
// =========================================================

export function base64UrlToBuffer(base64Url) {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawString = atob(base64);
  const buffer = new Uint8Array(rawString.length);

  for (let i = 0; i < rawString.length; i++) {
    buffer[i] = rawString.charCodeAt(i);
  }

  return buffer.buffer;
}

export function bufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Converts the JSON registration options received from the
// backend (challenge, user.id, and any excludeCredentials ids
// as base64url strings) into the ArrayBuffer form
// navigator.credentials.create() requires.
export function prepareRegistrationOptions(optionsFromServer) {
  return {
    ...optionsFromServer,
    challenge: base64UrlToBuffer(optionsFromServer.challenge),
    user: {
      ...optionsFromServer.user,
      id: base64UrlToBuffer(optionsFromServer.user.id),
    },
    excludeCredentials: (optionsFromServer.excludeCredentials || []).map(
      (cred) => ({
        ...cred,
        id: base64UrlToBuffer(cred.id),
      })
    ),
  };
}

// Converts the JSON authentication (login) options received
// from the backend into the ArrayBuffer form
// navigator.credentials.get() requires.
export function prepareAuthenticationOptions(optionsFromServer) {
  return {
    ...optionsFromServer,
    challenge: base64UrlToBuffer(optionsFromServer.challenge),
    allowCredentials: (optionsFromServer.allowCredentials || []).map(
      (cred) => ({
        ...cred,
        id: base64UrlToBuffer(cred.id),
      })
    ),
  };
}

// Converts the browser's PublicKeyCredential (registration
// result) into a plain JSON-safe object to send to the backend
// for verification/storage.
export function serializeRegistrationCredential(credential) {
  return {
    id: credential.id,
    rawId: bufferToBase64Url(credential.rawId),
    type: credential.type,
    response: {
      attestationObject: bufferToBase64Url(
        credential.response.attestationObject
      ),
      clientDataJSON: bufferToBase64Url(credential.response.clientDataJSON),
    },
  };
}

// Converts the browser's PublicKeyCredential (authentication
// result / assertion) into a plain JSON-safe object to send to
// the backend for signature verification.
export function serializeAuthenticationCredential(credential) {
  return {
    id: credential.id,
    rawId: bufferToBase64Url(credential.rawId),
    type: credential.type,
    response: {
      authenticatorData: bufferToBase64Url(
        credential.response.authenticatorData
      ),
      clientDataJSON: bufferToBase64Url(credential.response.clientDataJSON),
      signature: bufferToBase64Url(credential.response.signature),
      userHandle: credential.response.userHandle
        ? bufferToBase64Url(credential.response.userHandle)
        : null,
    },
  };
}