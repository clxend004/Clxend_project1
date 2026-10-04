import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";

import { getWallet } from "../services/walletService";
import {
  getTransactions,
} from "../services/transactionService";

export default function DashboardScreen() {
  const navigate = useNavigate();

  const userEmail =
    localStorage.getItem("userEmail") || "User";

  const kycStatus =
    localStorage.getItem("kycStatus") || "Pending";

  const isKYCApproved = kycStatus === "Approved";

  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // ================= LOAD DASHBOARD DATA =================
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const [
          walletResponse,
          transactionsResponse,
        ] = await Promise.all([
          getWallet(),
          getTransactions(),
        ]);

        console.log(
          "DASHBOARD WALLET:",
          walletResponse
        );

        console.log(
          "DASHBOARD TRANSACTIONS:",
          transactionsResponse
        );

        setWallet(walletResponse);

        setTransactions(
          Array.isArray(transactionsResponse)
            ? transactionsResponse
            : []
        );

      } catch (error) {
        console.error(
          "DASHBOARD API ERROR:",
          error
        );

        setErrorMessage(
          error.message ||
            "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // ================= FORMAT BLOCKCHAIN BALANCE =================
const getBalanceValue = () => {
  if (!wallet) {
    return "0.000000 ETH";
  }

  const value = Number(wallet.balance ?? 0);

  if (Number.isNaN(value)) {
    return "0.000000 ETH";
  }

  return `${value.toFixed(6)} ETH`;
};

const getINRBalanceValue = () => {
  if (!wallet) {
    return "≈ ₹0.00";
  }

  const value = Number(wallet.balanceInr ?? 0);

  if (Number.isNaN(value)) {
    return "≈ ₹0.00";
  }

  return `≈ ₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

  // ================= WALLET ADDRESS =================
  const getWalletAddress = () => {
    if (!wallet) {
      return "Wallet information unavailable";
    }

    return (
      wallet.walletAddress ||
      wallet.address ||
      wallet.walletId ||
      wallet.id ||
      "Wallet connected"
    );
  };

  // ================= TRANSACTION DATA =================
  const recentTransactions =
    Array.isArray(transactions)
      ? transactions.slice(0, 5)
      : [];

  // ================= LOADING =================
  if (loading) {
    return (
      <AppLayout>
        <div style={styles.centerMessage}>
          <div style={styles.loadingSpinner}>
            Loading...
          </div>

          <p style={styles.loadingText}>
            Loading your dashboard
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={styles.page}>

        {/* ================= HEADER ================= */}
        <div style={styles.header}>

          <div>
            <h1 style={styles.title}>
              Welcome back 👋
            </h1>

            <p style={styles.subtitle}>
              Manage your CLXEND wallet securely from one place.
            </p>
          </div>

          <div style={styles.statusBadge}>
            <span
              style={{
                ...styles.statusDot,
                background:
                  isKYCApproved
                    ? "#34d399"
                    : "#fbbf24",
              }}
            />

            KYC: {kycStatus}
          </div>

        </div>

        {/* ================= ERROR ================= */}
        {errorMessage && (
          <div style={styles.errorBox}>
            <span>⚠</span>

            <span>
              {errorMessage}
            </span>
          </div>
        )}

        {/* ================= USER CARD ================= */}
        <div style={styles.userCard}>

          <div style={styles.avatar}>
            {userEmail
              .charAt(0)
              .toUpperCase()}
          </div>

          <div style={styles.userInfo}>

            <div style={styles.userLabel}>
              Logged in account
            </div>

            <div style={styles.userEmail}>
              {userEmail}
            </div>

          </div>

        </div>

        {/* ================= SUMMARY CARDS ================= */}
        <div style={styles.cardGrid}>

          {/* BALANCE */}
          <div style={styles.card}>

            <div style={styles.cardIcon}>
              ₹
            </div>

            <div style={styles.cardTitle}>
              Available Balance
            </div>

            <div style={styles.balanceValue}>
              {getBalanceValue()}
            </div>

            <div style={styles.inrBalance}>
              {getINRBalanceValue()}
            </div>

            <div style={styles.cardDescription}>
              Current available wallet balance.
            </div>

            <button
              type="button"
              style={styles.primaryButton}
              onClick={() => {
                if (isKYCApproved) {
                  navigate("/wallet");
                } else {
                  navigate("/kyc");
                }
              }}
            >
              {isKYCApproved
                ? "Open Wallet"
                : "Complete KYC"}
            </button>

          </div>

          {/* WALLET */}
          <div style={styles.card}>

            <div style={styles.cardIcon}>
              ◈
            </div>

            <div style={styles.cardTitle}>
              Wallet
            </div>

            <div style={styles.cardValue}>
              {wallet
                ? "Connected"
                : "Unavailable"}
            </div>

            <div style={styles.cardDescription}>
              {getWalletAddress()}
            </div>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => {
                if (isKYCApproved) {
                  navigate("/wallet");
                } else {
                  navigate("/kyc");
                }
              }}
            >
              Open Wallet
            </button>

          </div>

          {/* TRANSACTIONS */}
          <div style={styles.card}>

            <div style={styles.cardIcon}>
              ↔
            </div>

            <div style={styles.cardTitle}>
              Transactions
            </div>

            <div style={styles.cardValue}>
              {transactions.length}
            </div>

            <div style={styles.cardDescription}>
              Total transactions available in your account.
            </div>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => {
                if (isKYCApproved) {
                  navigate("/transactions");
                } else {
                  navigate("/kyc");
                }
              }}
            >
              View Transactions
            </button>

          </div>

          {/* SEND */}
          <div style={styles.card}>

            <div style={styles.cardIcon}>
              ↗
            </div>

            <div style={styles.cardTitle}>
              Send Money
            </div>

            <div style={styles.cardValue}>
              Transfer
            </div>

            <div style={styles.cardDescription}>
              Send money securely from your wallet.
            </div>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => {
                if (isKYCApproved) {
                  navigate("/send");
                } else {
                  navigate("/kyc");
                }
              }}
            >
              Send Money
            </button>

          </div>

        </div>

        {/* ================= RECENT TRANSACTIONS ================= */}
        <div style={styles.transactionsCard}>

          <div style={styles.sectionHeader}>

            <div>
              <div style={styles.sectionTitle}>
                Recent Transactions
              </div>

              <div style={styles.sectionSubtitle}>
                Latest wallet activity
              </div>
            </div>

            <button
              type="button"
              style={styles.viewAllButton}
              onClick={() => {
                if (isKYCApproved) {
                  navigate("/transactions");
                } else {
                  navigate("/kyc");
                }
              }}
            >
              View All
            </button>

          </div>

          {recentTransactions.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>
                ↔
              </div>

              <div style={styles.emptyTitle}>
                No transactions yet
              </div>

              <div style={styles.emptyText}>
                Your recent transactions will appear here.
              </div>
            </div>
          ) : (
            <div style={styles.transactionList}>

              {recentTransactions.map(
                (transaction, index) => {

                  const amount =
                    transaction.amount ??
                    transaction.value ??
                    0;

                  const receiver =
                    transaction.receiver ??
                    transaction.to ??
                    "Unknown";

                  return (
                    <div
                      key={
                        transaction.id ||
                        index
                      }
                      style={styles.transactionRow}
                    >

                      <div
                        style={
                          styles.transactionIcon
                        }
                      >
                        ↗
                      </div>

                      <div
                        style={
                          styles.transactionInfo
                        }
                      >
                        <div
                          style={
                            styles.transactionName
                          }
                        >
                          {receiver}
                        </div>

                        <div
                          style={
                            styles.transactionDate
                          }
                        >
                          {transaction.date ||
                            transaction.createdAt ||
                            "Recent transaction"}
                        </div>
                      </div>

                      <div
                        style={
                          styles.transactionAmount
                        }
                      >
                        ₹
                        {Number(amount).toFixed(2)}
                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </div>

        {/* ================= KYC ================= */}
        <div style={styles.kycCard}>

          <div>

            <div style={styles.kycTitle}>
              KYC Verification
            </div>

            <p style={styles.kycDescription}>
              {isKYCApproved
                ? "Your identity has been successfully verified. Wallet services are available."
                : "Complete identity verification to unlock wallet and transaction features."}
            </p>

          </div>

          <button
            type="button"
            style={styles.kycButton}
            onClick={() =>
              navigate("/kyc")
            }
          >
            {isKYCApproved
              ? "View KYC"
              : "Complete KYC"}
          </button>

        </div>

      </div>
    </AppLayout>
  );
}

const styles = {
  page: {
    width: "100%",
    maxWidth: 1200,
    margin: "0 auto",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    marginBottom: 25,
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    fontSize: 30,
    fontWeight: 800,
    color: "#ffffff",
  },

  subtitle: {
    marginTop: 7,
    marginBottom: 0,
    color: "#94a3b8",
    fontSize: 14,
  },

  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "9px 13px",
    borderRadius: 10,
    background: "rgba(148,163,184,0.08)",
    border:
      "1px solid rgba(148,163,184,0.14)",
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: 600,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
  },

  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "11px 13px",
    marginBottom: 18,
    borderRadius: 10,
    background:
      "rgba(248,113,113,0.08)",
    border:
      "1px solid rgba(248,113,113,0.18)",
    color: "#fca5a5",
    fontSize: 12,
  },

  centerMessage: {
    minHeight: "70vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingSpinner: {
    fontSize: 15,
    fontWeight: 700,
    color: "#a78bfa",
  },

  loadingText: {
    color: "#64748b",
    fontSize: 12,
  },

  userCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: 20,
    marginBottom: 24,
    borderRadius: 16,
    background:
      "linear-gradient(145deg, #182338, #111827)",
    border:
      "1px solid rgba(148,163,184,0.14)",
    boxShadow:
      "0 15px 40px rgba(0,0,0,0.20)",
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #8b5cf6, #2563eb)",
    color: "#ffffff",
    fontSize: 18,
    fontWeight: 800,
  },

  userInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },

  userLabel: {
    color: "#64748b",
    fontSize: 11,
  },

  userEmail: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 600,
  },

  cardGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 18,
  },

  card: {
    padding: 22,
    borderRadius: 16,
    background:
      "linear-gradient(145deg, #182338, #111827)",
    border:
      "1px solid rgba(148,163,184,0.13)",
    boxShadow:
      "0 15px 35px rgba(0,0,0,0.18)",
  },

  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #8b5cf6, #2563eb)",
    color: "#ffffff",
    fontSize: 17,
    fontWeight: 700,
    marginBottom: 15,
  },

  cardTitle: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: 600,
  },

  cardValue: {
    marginTop: 6,
    color: "#ffffff",
    fontSize: 21,
    fontWeight: 800,
  },

  balanceValue: {
    marginTop: 6,
    color: "#34d399",
    fontSize: 22,
    fontWeight: 800,
  },

  inrBalance: {
  marginTop: 4,
  color: "#94a3b8",
  fontSize: 12,
  fontWeight: 500,
},

  cardDescription: {
    marginTop: 7,
    minHeight: 38,
    color: "#64748b",
    fontSize: 12,
    lineHeight: 1.5,
    wordBreak: "break-word",
  },

  primaryButton: {
    width: "100%",
    height: 42,
    marginTop: 17,
    border: "none",
    borderRadius: 9,
    background:
      "linear-gradient(135deg, #8b5cf6, #2563eb)",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
  },

  secondaryButton: {
    width: "100%",
    height: 42,
    marginTop: 17,
    border:
      "1px solid rgba(139,92,246,0.35)",
    borderRadius: 9,
    background:
      "rgba(139,92,246,0.08)",
    color: "#c4b5fd",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
  },

  transactionsCard: {
    marginTop: 22,
    padding: 22,
    borderRadius: 16,
    background:
      "linear-gradient(145deg, #182338, #111827)",
    border:
      "1px solid rgba(148,163,184,0.13)",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 15,
  },

  sectionTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: 700,
  },

  sectionSubtitle: {
    marginTop: 4,
    color: "#64748b",
    fontSize: 11,
  },

  viewAllButton: {
    border: "none",
    background: "transparent",
    color: "#60a5fa",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
  },

  emptyState: {
    textAlign: "center",
    padding: "35px 10px",
  },

  emptyIcon: {
    fontSize: 25,
    color: "#475569",
  },

  emptyTitle: {
    marginTop: 10,
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: 600,
  },

  emptyText: {
    marginTop: 5,
    color: "#64748b",
    fontSize: 11,
  },

  transactionList: {
    marginTop: 15,
  },

  transactionRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "13px 0",
    borderTop:
      "1px solid rgba(148,163,184,0.08)",
  },

  transactionIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(139,92,246,0.10)",
    color: "#a78bfa",
    fontSize: 14,
  },

  transactionInfo: {
    flex: 1,
    minWidth: 0,
  },

  transactionName: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: 600,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  transactionDate: {
    marginTop: 3,
    color: "#64748b",
    fontSize: 10,
  },

  transactionAmount: {
    color: "#34d399",
    fontSize: 12,
    fontWeight: 700,
  },

  kycCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    marginTop: 22,
    padding: 22,
    borderRadius: 16,
    background:
      "linear-gradient(145deg, #182338, #111827)",
    border:
      "1px solid rgba(148,163,184,0.13)",
    flexWrap: "wrap",
  },

  kycTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: 700,
  },

  kycDescription: {
    margin: "7px 0 0",
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 1.5,
    maxWidth: 650,
  },

  kycButton: {
    minWidth: 140,
    height: 42,
    padding: "0 16px",
    border: "none",
    borderRadius: 9,
    background:
      "linear-gradient(135deg, #8b5cf6, #2563eb)",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
  },
};