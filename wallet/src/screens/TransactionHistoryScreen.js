import { useEffect, useState, useCallback } from "react";
import AppLayout from "../components/AppLayout";
import { getTransactions } from "../services/transactionService";
import BackgroundWrapper from "../components/BackgroundWrapper";
import Loader from "../components/Loader";
import StatusBadge from "../components/StatusBadge";
import { useNavigate } from "react-router-dom";

export default function TransactionHistoryScreen() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState("Pending");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getTransactions();

      const storedStatus = localStorage.getItem("kycStatus") || "Pending";
      setKycStatus(storedStatus);

      const updatedData = (data || []).map((tx) => ({
        ...tx,
        status: tx.status || "Pending",
      }));

      setTransactions(updatedData);
    } catch (error) {
      console.error(error);

      if (error.status === 401) {
        alert("Session expired. Please login again.");
        navigate("/login");
      } else {
        setError(error.message || "Failed to load transactions");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const formatTime = (timestamp) => {
    if (!timestamp) return "—";
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? timestamp : date.toLocaleString();
  };

  return (
    <BackgroundWrapper>
      <AppLayout>
        <div style={styles.page}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>Transaction History</h1>
              <p style={styles.subtitle}>All transfers in and out of your wallet</p>
            </div>

            <div style={styles.kycRow}>
              <span style={styles.kycLabel}>KYC status</span>
              <StatusBadge status={kycStatus} />
            </div>
          </div>

          <div style={styles.card}>
            {loading && (
              <div style={styles.centerMessage}>
                <Loader />
                <p style={styles.loadingText}>Loading transactions…</p>
              </div>
            )}

            {!loading && error && (
              <div style={styles.errorBox}>
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            {!loading && !error && transactions.length === 0 && (
              <div style={styles.emptyState}>
                <p style={styles.emptyTitle}>No transactions yet</p>
                <p style={styles.emptyText}>
                  Transactions you send or receive will show up here.
                </p>
              </div>
            )}

            {!loading && !error && transactions.length > 0 && (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Tx Hash</th>
                      <th style={styles.th}>Amount</th>
                      <th style={styles.th}>Sender</th>
                      <th style={styles.th}>Recipient</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Time</th>
                    </tr>
                  </thead>

                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.txHash} style={styles.tr}>
                        <td style={styles.tdMono} title={tx.txHash}>
                          {tx.txHash ? `${tx.txHash.slice(0, 10)}…` : "—"}
                        </td>

                        <td style={styles.td}>₹{tx.amount || 0}</td>
                        <td style={styles.td}>{tx.sender || "Unknown"}</td>
                        <td style={styles.td}>{tx.recipient || "Unknown"}</td>

                        <td style={styles.td}>
                          <StatusBadge status={tx.status} />
                        </td>

                        <td style={styles.tdMuted}>
                          {formatTime(tx.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
    maxWidth: 960,
    margin: "0 auto",
    padding: "10px 4px 40px",
    color: colors.text,
    fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 22,
  },

  title: { fontSize: 22, fontWeight: 800, margin: 0 },

  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
  },

  kycRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  kycLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: 600,
  },

  card: {
    padding: 8,
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
    padding: "40px 0",
  },

  loadingText: { color: colors.textMuted, fontSize: 12 },

  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    margin: 16,
    padding: "10px 12px",
    borderRadius: 10,
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.25)",
    color: "#f87171",
    fontSize: 13,
  },

  emptyState: {
    padding: "50px 20px",
    textAlign: "center",
  },

  emptyTitle: { fontSize: 15, fontWeight: 700, margin: 0 },

  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
  },

  tableWrapper: { overflowX: "auto" },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    padding: "14px 16px",
    textAlign: "left",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: colors.textMuted,
    borderBottom: `1px solid ${colors.border}`,
    whiteSpace: "nowrap",
  },

  tr: {
    borderBottom: "1px solid rgba(148,163,184,0.06)",
  },

  td: {
    padding: "14px 16px",
    fontSize: 13,
    color: colors.text,
  },

  tdMono: {
    padding: "14px 16px",
    fontSize: 12,
    fontFamily: "monospace",
    color: colors.text,
  },

  tdMuted: {
    padding: "14px 16px",
    fontSize: 12,
    color: colors.textMuted,
    whiteSpace: "nowrap",
  },
};