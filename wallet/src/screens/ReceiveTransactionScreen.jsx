import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import BackgroundWrapper from "../components/BackgroundWrapper";
import Loader from "../components/Loader";
import { getWallet } from "../services/walletService";

export default function ReceiveTransactionScreen() {
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadWallet = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getWallet();
        setWalletAddress(data.walletAddress || "");
      } catch (err) {
        // The previous version of this screen silently swallowed
        // this error, leaving the address blank with no feedback.
        setError(err.message || "Failed to load your wallet address");
      } finally {
        setLoading(false);
      }
    };

    loadWallet();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <BackgroundWrapper>
      <AppLayout>
        <div style={styles.page}>
          <div style={styles.header}>
            <h1 style={styles.title}>Receive</h1>
            <p style={styles.subtitle}>
              Share your wallet address to receive funds
            </p>
          </div>

          <div style={styles.card}>
            {loading && (
              <div style={styles.centerMessage}>
                <Loader />
                <p style={styles.loadingText}>Loading your address…</p>
              </div>
            )}

            {!loading && error && (
              <div style={styles.errorBox}>
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            {!loading && !error && (
              <>
                <label style={styles.label}>Your wallet address</label>

                <div style={styles.addressBox}>
                  {walletAddress || "Not available"}
                </div>

                <button
                  onClick={handleCopy}
                  disabled={!walletAddress}
                  style={{
                    ...styles.copyButton,
                    opacity: walletAddress ? 1 : 0.6,
                    cursor: walletAddress ? "pointer" : "not-allowed",
                  }}
                >
                  {copied ? "✓ Copied" : "Copy Address"}
                </button>

                <p style={styles.hint}>
                  Anyone with this address can send funds to your wallet.
                  Only share it through channels you trust.
                </p>
              </>
            )}
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
  border: "rgba(148,163,184,0.13)",
  cardBg: "linear-gradient(145deg, #182338, #111827)",
};

const styles = {
  page: {
    width: "100%",
    maxWidth: 460,
    margin: "0 auto",
    padding: "10px 4px 40px",
    color: colors.text,
    fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
  },

  header: { marginBottom: 22 },

  title: { fontSize: 22, fontWeight: 800, margin: 0 },

  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
  },

  card: {
    padding: 24,
    borderRadius: 18,
    background: colors.cardBg,
    border: `1px solid ${colors.border}`,
    boxShadow: "0 15px 40px rgba(0,0,0,0.20)",
  },

  centerMessage: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    padding: "20px 0",
  },

  loadingText: { color: colors.textMuted, fontSize: 12 },

  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 10,
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.25)",
    color: "#f87171",
    fontSize: 13,
  },

  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: colors.textSecondary,
    marginBottom: 8,
  },

  addressBox: {
    padding: "14px 16px",
    borderRadius: 10,
    background: "#0b1120",
    border: `1px solid ${colors.border}`,
    color: colors.text,
    fontSize: 13,
    fontFamily: "monospace",
    wordBreak: "break-all",
    marginBottom: 14,
  },

  copyButton: {
    width: "100%",
    height: 46,
    border: "none",
    borderRadius: 10,
    background: "linear-gradient(135deg, #8b5cf6, #2563eb)",
    color: "#ffffff",
    fontSize: 13,
    fontWeight: 700,
  },

  hint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 16,
    marginBottom: 0,
    lineHeight: 1.6,
    textAlign: "center",
  },
};