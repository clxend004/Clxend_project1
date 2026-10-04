import { postRequest } from "./api";
import {
  prepareRegistrationOptions,
  prepareAuthenticationOptions,
  serializeRegistrationCredential,
  serializeAuthenticationCredential,
} from "../utils/webauthn";

// =========================================================
// FACE ID / PASSKEY LOGIN (WebAuthn)
//
// See docs/FACE_ID_PASSKEY_INTEGRATION.md for the full
// backend contract this expects. Every function here calls
// an endpoint that does not exist yet on the backend — this
// is the frontend half of the integration, ready to connect
// once those endpoints are built.
// =========================================================

// Feature detection — call this before showing any passkey UI
// as usable. Some environments have the API but no platform
// authenticator (Face ID/Touch ID/Windows Hello) available.
export const isPasskeySupported = async () => {
  if (!window.PublicKeyCredential) return false;

  try {
    const available =
      await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch (error) {
    console.error("Passkey support check failed:", error);
    return false;
  }
};

// Maps native WebAuthn DOMException names to plain-language
// messages. These names are part of the Web standard, not
// something our backend defines.
const mapWebAuthnError = (error) => {
  const name = error?.name;

  if (name === "NotAllowedError") {
    return "Passkey action was cancelled or timed out.";
  }
  if (name === "InvalidStateError") {
    return "A passkey is already registered for this device.";
  }
  if (name === "SecurityError") {
    return "This page isn't allowed to use passkeys in this context.";
  }
  if (name === "NotSupportedError") {
    return "Your device doesn't support the requested passkey type.";
  }

  return error?.message || "Passkey action failed. Please try again.";
};

// =========================================================
// REGISTRATION (enrolling a passkey for an already-logged-in,
// already-authenticated user — e.g. from a security settings
// screen)
// =========================================================

export const registerPasskey = async (label) => {
  try {
    const options = await postRequest("/webauthn/register/options", {
      label,
    });

    const credential = await navigator.credentials.create({
      publicKey: prepareRegistrationOptions(options),
    });

    const serialized = serializeRegistrationCredential(credential);

    const result = await postRequest("/webauthn/register/verify", {
      credential: serialized,
      label,
    });

    return { success: true, passkey: result };
  } catch (error) {
    console.error("Passkey registration failed:", error);
    throw new Error(mapWebAuthnError(error));
  }
};

// =========================================================
// AUTHENTICATION (logging in with an existing passkey)
//
// `email` is optional — passing it lets the backend scope the
// challenge to that user's registered credentials. Omitting it
// relies on discoverable/resident-key credentials (the
// platform authenticator itself lists which accounts it has a
// passkey for) — support for this varies by backend
// implementation; see the docs.
// =========================================================

export const loginWithPasskey = async (email) => {
  try {
    const options = await postRequest("/webauthn/login/options", {
      email: email || undefined,
    });

    const credential = await navigator.credentials.get({
      publicKey: prepareAuthenticationOptions(options),
    });

    const serialized = serializeAuthenticationCredential(credential);

    const result = await postRequest("/webauthn/login/verify", {
      credential: serialized,
    });

    return {
      success: true,
      token: result.token,
      user: result.user,
      message: result.message || "Signed in with passkey successfully",
    };
  } catch (error) {
    console.error("Passkey login failed:", error);
    throw new Error(mapWebAuthnError(error));
  }
};

// =========================================================
// LIST / REMOVE ENROLLED PASSKEYS
// =========================================================

export const getEnrolledPasskeys = async () => {
  try {
    const result = await postRequest("/webauthn/list", {});
    return result?.passkeys || [];
  } catch (error) {
    console.error("Failed to load enrolled passkeys:", error);
    throw new Error(
      error?.message || "Unable to load your passkeys right now."
    );
  }
};

export const removePasskey = async (passkeyId) => {
  try {
    await postRequest("/webauthn/remove", { passkeyId });
    return { success: true };
  } catch (error) {
    console.error("Failed to remove passkey:", error);
    throw new Error(error?.message || "Unable to remove this passkey.");
  }
};