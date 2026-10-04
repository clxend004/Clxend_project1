import { useState, useEffect } from "react";
import AppLayout from "../components/AppLayout";
import { useNavigate } from "react-router-dom";
import BackgroundWrapper from "../components/BackgroundWrapper";
import Loader from "../components/Loader";
import { getWallet } from "../services/walletService";

export default function WalletLookupScreen() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [walletData, setWalletData] = useState(null);

  // ================= LOAD USER WALLET =================
  useEffect(() => {
    const loadWallet = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getWallet();

        setWalletData({
          email: data.email,
          phone: data.phone,
          walletId: data.walletId,
          userReference: `USER-${data.userId}`,
          walletAddress: data.walletAddress,
          balance: data.balance,
          balanceInr: data.balanceInr,
          ethInrPrice: data.ethInrPrice,
          did: data.did,
          blockchain: data.blockchain,
          txHash: data.txHash,
          identityStatus: data.identityStatus,
        });
      } catch (err) {
        setError(err.message || "Failed to load wallet");
      } finally {
        setLoading(false);
      }
    };

    loadWallet();
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  const isVerified = walletData?.identityStatus === "verified";

  return (
    <BackgroundWrapper>
      <AppLayout>
        <div style={styles.page}>
          <div style={styles.header}>
            <h1 style={styles.title}>My Wallet</h1>
            <p style={styles.subtitle}>
              Your on-chain identity, address, and balance
            </p>
          </div>

          {/* ================= LOADING ================= */}
          {loading && (
            <div style={styles.centerMessage}>
              <Loader />
              <p style={styles.loadingText}>Fetching your wallet…</p>
            </div>
          )}

          {/* ================= ERROR ================= */}
          {!loading && error && (
            <div style={styles.errorCard}>
              <span style={styles.errorIcon}>⚠</span>
              <p style={styles.errorText}>{error}</p>

              <button onClick={handleRetry} style={styles.retryButton}>
                Retry
              </button>
            </div>
          )}

          {/* ================= WALLET DETAILS ================= */}
          {!loading && !error && walletData && (
            <>
              {/* Balance hero */}
              <div style={styles.balanceCard}>
                <div style={styles.balanceLabel}>Available balance</div>
                <div style={styles.balanceValue}>
                  {Number(walletData.balance ?? 0).toFixed(6)} ETH
                </div>

                <div style={styles.inrBalance}>
                  ≈ ₹{Number(walletData.balanceInr ?? 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>

                <div style={styles.badgeRow}>
                  <span
                    style={{
                      ...styles.statusBadge,
                      ...(isVerified
                        ? styles.statusBadgeVerified
                        : styles.statusBadgePending),
                    }}
                  >
                    {isVerified ? "🟢 Verified" : "🟡 Pending verification"}
                  </span>

                  {walletData.blockchain && (
                    <span style={styles.chainBadge}>
                      {walletData.blockchain}
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div style={styles.actionsRow}>
                <button
                  onClick={() => navigate("/send")}
                  style={styles.primaryButton}
                >
                  Send
                </button>

                <button
                  onClick={() => navigate("/receive")}
                  style={styles.secondaryButton}
                >
                  Receive
                </button>

                <button
                  onClick={() => navigate("/transactions")}
                  style={styles.secondaryButton}
                >
                  History
                </button>
              </div>

              {/* Details grid */}
              <div style={styles.detailsCard}>
                <h2 style={styles.sectionTitle}>Account details</h2>

                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Email</span>
                  <span style={styles.detailValue}>
                    {walletData.email || "—"}
                  </span>
                </div>

                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Phone</span>
                  <span style={styles.detailValue}>
                    {walletData.phone || "—"}
                  </span>
                </div>

                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Wallet ID</span>
                  <span style={styles.detailValue}>
                    {walletData.walletId || "—"}
                  </span>
                </div>

                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>User reference</span>
                  <span style={styles.detailValue}>
                    {walletData.userReference}
                  </span>
                </div>

                <div style={styles.detailRowStacked}>
                  <span style={styles.detailLabel}>Wallet address</span>
                  <span style={styles.detailValueMono}>
                    {walletData.walletAddress || "Not available"}
                  </span>
                </div>

                <div style={styles.detailRowStacked}>
                  <span style={styles.detailLabel}>DID</span>
                  <span style={styles.detailValueMono}>
                    {walletData.did || "Not available"}
                  </span>
                  {!walletData.did && (
                    <p style={styles.warningText}>
                      No DID found for this wallet
                    </p>
                  )}
                </div>

                <div style={styles.detailRowStacked}>
                  <span style={styles.detailLabel}>
                    Latest transaction hash
                  </span>
                  {walletData.txHash ? (
                    <a
                      href={`https://polygonscan.com/tx/${walletData.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.txLink}
                    >
                      {walletData.txHash}
                    </a>
                  ) : (
                    <span style={styles.detailValueMono}>Not available</span>
                  )}
                </div>
              </div>
            </>
          )}
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
    maxWidth: 560,
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

  centerMessage: {
    minHeight: "40vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  loadingText: { color: colors.textMuted, fontSize: 12 },

  errorCard: {
    padding: 20,
    borderRadius: 16,
    background: colors.cardBg,
    border: "1px solid rgba(248,113,113,0.25)",
    textAlign: "center",
  },

  errorIcon: { fontSize: 20 },

  errorText: {
    color: "#fca5a5",
    fontSize: 13,
    margin: "8px 0 14px",
  },

  retryButton: {
    height: 40,
    padding: "0 18px",
    borderRadius: 9,
    border: "none",
    background: "linear-gradient(135deg, #8b5cf6, #2563eb)",
    color: "#ffffff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },

  balanceCard: {
    padding: 24,
    borderRadius: 18,
    marginBottom: 18,
    background: colors.cardBg,
    border: `1px solid ${colors.border}`,
    boxShadow: "0 15px 40px rgba(0,0,0,0.20)",
  },

  balanceLabel: { fontSize: 12, color: colors.textMuted },

  balanceValue: {
    fontSize: 34,
    fontWeight: 800,
    marginTop: 6,
    letterSpacing: -0.5,
  },

  inrBalance: {
  marginTop: 4,
  fontSize: 13,
  color: colors.textSecondary,
  fontWeight: 500,
},

  badgeRow: {
    display: "flex",
    gap: 8,
    marginTop: 14,
    flexWrap: "wrap",
  },

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 11px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },

  statusBadgeVerified: {
    color: "#34d399",
    background: "rgba(52,211,153,0.10)",
  },

  statusBadgePending: {
    color: "#f59e0b",
    background: "rgba(245,158,11,0.10)",
  },

  chainBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 11px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    color: "#93c5fd",
    background: "rgba(59,130,246,0.10)",
  },

  actionsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,
    marginBottom: 18,
  },

  primaryButton: {
    height: 44,
    border: "none",
    borderRadius: 10,
    background: "linear-gradient(135deg, #8b5cf6, #2563eb)",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
  },

  secondaryButton: {
    height: 44,
    border: "1px solid rgba(139,92,246,0.35)",
    borderRadius: 10,
    background: "rgba(139,92,246,0.08)",
    color: "#c4b5fd",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
  },

  detailsCard: {
    padding: 22,
    borderRadius: 16,
    background: colors.cardBg,
    border: `1px solid ${colors.border}`,
    boxShadow: "0 15px 35px rgba(0,0,0,0.18)",
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    margin: "0 0 14px",
    color: colors.text,
  },

  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid rgba(148,163,184,0.08)",
  },

  detailRowStacked: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    padding: "10px 0",
    borderBottom: "1px solid rgba(148,163,184,0.08)",
  },

  detailLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: 600,
  },

  detailValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: 600,
  },

  detailValueMono: {
    fontSize: 12,
    color: colors.text,
    fontFamily: "monospace",
    wordBreak: "break-all",
  },

  txLink: {
    fontSize: 12,
    color: "#60a5fa",
    fontFamily: "monospace",
    wordBreak: "break-all",
  },

  warningText: {
    fontSize: 11,
    color: "#f87171",
    margin: 0,
  },
};