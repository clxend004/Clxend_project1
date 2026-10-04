import {
  base64UrlToBuffer,
  bufferToBase64Url,
  prepareRegistrationOptions,
  prepareAuthenticationOptions,
  serializeRegistrationCredential,
  serializeAuthenticationCredential,
} from "./webauthn";

describe("webauthn base64url <-> buffer helpers", () => {
  test("round-trips arbitrary bytes through base64url encoding", () => {
    const original = new Uint8Array([0, 1, 2, 253, 254, 255, 16, 32]);
    const encoded = bufferToBase64Url(original.buffer);
    const decoded = new Uint8Array(base64UrlToBuffer(encoded));

    expect(Array.from(decoded)).toEqual(Array.from(original));
  });

  test("base64url output never contains +, /, or padding characters", () => {
    // Bytes chosen so standard base64 would need + and / characters.
    const original = new Uint8Array([251, 255, 190]);
    const encoded = bufferToBase64Url(original.buffer);

    expect(encoded).not.toMatch(/[+/=]/);
  });
});

describe("prepareRegistrationOptions", () => {
  test("converts challenge and user.id to ArrayBuffers", () => {
    const serverOptions = {
      challenge: bufferToBase64Url(new Uint8Array([1, 2, 3]).buffer),
      user: {
        id: bufferToBase64Url(new Uint8Array([9, 9]).buffer),
        name: "jane@example.com",
      },
      excludeCredentials: [
        { id: bufferToBase64Url(new Uint8Array([5]).buffer), type: "public-key" },
      ],
    };

    const prepared = prepareRegistrationOptions(serverOptions);

    expect(prepared.challenge).toBeInstanceOf(ArrayBuffer);
    expect(prepared.user.id).toBeInstanceOf(ArrayBuffer);
    expect(prepared.excludeCredentials[0].id).toBeInstanceOf(ArrayBuffer);
    expect(prepared.user.name).toBe("jane@example.com");
  });
});

describe("prepareAuthenticationOptions", () => {
  test("converts challenge and allowCredentials ids to ArrayBuffers", () => {
    const serverOptions = {
      challenge: bufferToBase64Url(new Uint8Array([4, 5, 6]).buffer),
      allowCredentials: [
        { id: bufferToBase64Url(new Uint8Array([7]).buffer), type: "public-key" },
      ],
    };

    const prepared = prepareAuthenticationOptions(serverOptions);

    expect(prepared.challenge).toBeInstanceOf(ArrayBuffer);
    expect(prepared.allowCredentials[0].id).toBeInstanceOf(ArrayBuffer);
  });

  test("handles missing allowCredentials (usernameless/resident-key flow)", () => {
    const serverOptions = {
      challenge: bufferToBase64Url(new Uint8Array([1]).buffer),
    };

    const prepared = prepareAuthenticationOptions(serverOptions);

    expect(prepared.allowCredentials).toEqual([]);
  });
});

describe("serializeRegistrationCredential", () => {
  test("converts a mock PublicKeyCredential registration result to JSON-safe base64url", () => {
    const mockCredential = {
      id: "cred-id",
      rawId: new Uint8Array([1, 2]).buffer,
      type: "public-key",
      response: {
        attestationObject: new Uint8Array([3, 4]).buffer,
        clientDataJSON: new Uint8Array([5, 6]).buffer,
      },
    };

    const serialized = serializeRegistrationCredential(mockCredential);

    expect(serialized.id).toBe("cred-id");
    expect(typeof serialized.rawId).toBe("string");
    expect(typeof serialized.response.attestationObject).toBe("string");
    expect(typeof serialized.response.clientDataJSON).toBe("string");
  });
});

describe("serializeAuthenticationCredential", () => {
  test("converts a mock PublicKeyCredential authentication result to JSON-safe base64url", () => {
    const mockCredential = {
      id: "cred-id",
      rawId: new Uint8Array([1]).buffer,
      type: "public-key",
      response: {
        authenticatorData: new Uint8Array([2]).buffer,
        clientDataJSON: new Uint8Array([3]).buffer,
        signature: new Uint8Array([4]).buffer,
        userHandle: new Uint8Array([5]).buffer,
      },
    };

    const serialized = serializeAuthenticationCredential(mockCredential);

    expect(typeof serialized.response.signature).toBe("string");
    expect(typeof serialized.response.userHandle).toBe("string");
  });

  test("handles a null userHandle (non-resident-key credentials)", () => {
    const mockCredential = {
      id: "cred-id",
      rawId: new Uint8Array([1]).buffer,
      type: "public-key",
      response: {
        authenticatorData: new Uint8Array([2]).buffer,
        clientDataJSON: new Uint8Array([3]).buffer,
        signature: new Uint8Array([4]).buffer,
        userHandle: null,
      },
    };

    const serialized = serializeAuthenticationCredential(mockCredential);

    expect(serialized.response.userHandle).toBeNull();
  });
});