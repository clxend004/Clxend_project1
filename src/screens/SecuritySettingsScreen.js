import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import BackgroundWrapper from "../components/BackgroundWrapper";
import {
  isPasskeySupported,
  registerPasskey,
  getEnrolledPasskeys,
  removePasskey,
} from "../services/webauthnService";

export default function SecuritySettingsScreen() {
  const [supported, setSupported] = useState(null); // null = checking
  const [passkeys, setPasskeys] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [label, setLabel] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadPasskeys = async () => {
    try {
      setLoadingList(true);
      const list = await getEnrolledPasskeys();
      setPasskeys(list);
    } catch (err) {
      // Non-fatal — the backend endpoint likely doesn't exist yet
      // (see docs/FACE_ID_PASSKEY_INTEGRATION.md). Fail quietly to
      // an empty list rather than blocking the whole screen.
      console.error(err);
      setPasskeys([]);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    isPasskeySupported().then(setSupported);
    loadPasskeys();
  }, []);

  const handleEnroll = async () => {
    setError("");
    setSuccess("");
    setEnrolling(true);

    try {
      await registerPasskey(label || "My device");
      setSuccess("Passkey added successfully.");
      setLabel("");
      loadPasskeys();
    } catch (err) {
      setError(err.message || "Could not add passkey.");
    } finally {
      setEnrolling(false);
    }
  };

  const handleRemove = async (id) => {
    setError("");
    setSuccess("");

    try {
      await removePasskey(id);
      setSuccess("Passkey removed.");
      loadPasskeys();
    } catch (err) {
      setError(err.message || "Could not remove passkey.");
    }
  };

  return (
    <BackgroundWrapper>
      <AppLayout>
        <div style={styles.page}>
          <div style={styles.container}>
            <h1 style={styles.title}>Security</h1>
            <p style={styles.subtitle}>
              Manage Face ID, Touch ID, and other passkeys for signing in
              without a password.
            </p>

            {supported === false && (
              <div style={styles.warningBox}>
                Your current browser or device doesn't support passkeys.
                Try this on a device with Face ID, Touch ID, or Windows
                Hello, using a modern browser.
              </div>
            )}

            {supported && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Add a new passkey</h2>

                <input
                  type="text"
                  placeholder='Name this passkey (e.g. "My iPhone")'
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  style={styles.input}
                />

                <button
                  type="button"
                  onClick={handleEnroll}
                  disabled={enrolling}
                  style={{
                    ...styles.primaryButton,
                    opacity: enrolling ? 0.7 : 1,
                  }}
                >
                  {enrolling
                    ? "Waiting for Face ID / Touch ID…"
                    : "+ Add Passkey"}
                </button>
              </div>
            )}

            {error && <div style={styles.errorBox}>⚠ {error}</div>}
            {success && <div style={styles.successBox}>✓ {success}</div>}

            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Your passkeys</h2>

              {loadingList ? (
                <p style={styles.muted}>Loading…</p>
              ) : passkeys.length === 0 ? (
                <p style={styles.muted}>
                  No passkeys added yet. Once you add one, you'll be able to
                  sign in using Face ID / Touch ID instead of your password.
                </p>
              ) : (
                <div style={styles.list}>
                  {passkeys.map((pk) => (
                    <div key={pk.id} style={styles.listItem}>
                      <div>
                        <div style={styles.listItemLabel}>
                          {pk.label || "Unnamed passkey"}
                        </div>
                        <div style={styles.listItemMeta}>
                          Added{" "}
                          {pk.createdAt
                            ? new Date(pk.createdAt).toLocaleDateString()
                            : "—"}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemove(pk.id)}
                        style={styles.removeBtn}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    </BackgroundWrapper>
  );
}

const colors = {
  text: "#f8fafc",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  border: "rgba(148,163,184,0.12)",
  cardBg: "rgba(15, 20, 33, 0.72)",
};

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    padding: "40px 20px",
    background:
      "radial-gradient(circle at top, #172554 0%, #0b1120 45%, #050816 100%)",
    color: colors.text,
    fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
  },

  container: { width: "100%", maxWidth: 560 },

  title: { fontSize: 24, fontWeight: 800, margin: 0 },

  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 1.6,
  },

  warningBox: {
    padding: "12px 14px",
    borderRadius: 10,
    background: "rgba(245,158,11,0.10)",
    border: "1px solid rgba(245,158,11,0.25)",
    color: "#f59e0b",
    fontSize: 13,
    marginBottom: 20,
  },

  card: {
    padding: 20,
    borderRadius: 16,
    background: colors.cardBg,
    border: `1px solid ${colors.border}`,
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    marginBottom: 16,
  },

  cardTitle: { fontSize: 15, fontWeight: 700, margin: "0 0 14px" },

  input: {
    width: "100%",
    height: 46,
    boxSizing: "border-box",
    borderRadius: 10,
    border: `1px solid ${colors.border}`,
    background: "#0b1120",
    color: colors.text,
    fontSize: 14,
    padding: "0 14px",
    marginBottom: 12,
  },

  primaryButton: {
    width: "100%",
    height: 46,
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #8b5cf6, #2563eb)",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },

  errorBox: {
    padding: "10px 12px",
    borderRadius: 10,
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.25)",
    color: "#f87171",
    fontSize: 13,
    marginBottom: 16,
  },

  successBox: {
    padding: "10px 12px",
    borderRadius: 10,
    background: "rgba(52,211,153,0.10)",
    border: "1px solid rgba(52,211,153,0.25)",
    color: "#34d399",
    fontSize: 13,
    marginBottom: 16,
  },

  muted: { fontSize: 13, color: colors.textMuted, margin: 0 },

  list: { display: "flex", flexDirection: "column", gap: 10 },

  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 12px",
    borderRadius: 10,
    background: "rgba(255,255,255,0.03)",
  },

  listItemLabel: { fontSize: 14, fontWeight: 600 },

  listItemMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  removeBtn: {
    height: 40,
    padding: "0 12px",
    borderRadius: 8,
    border: "1px solid rgba(248,113,113,0.3)",
    background: "rgba(248,113,113,0.10)",
    color: "#f87171",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
};