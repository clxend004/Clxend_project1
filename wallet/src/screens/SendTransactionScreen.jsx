import { useState } from "react";
import AppLayout from "../components/AppLayout";
import BackgroundWrapper from "../components/BackgroundWrapper";
import { saveTransaction } from "../services/transactionService";
import { useNavigate } from "react-router-dom";

export default function SendTransactionScreen() {
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSend = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!receiver) {
      setErrorMessage("Enter the receiver's wallet address");
      return;
    }

    if (!amount) {
      setErrorMessage("Enter an amount");
      return;
    }

    if (Number(amount) <= 0) {
      setErrorMessage("Enter a valid amount greater than 0");
      return;
    }

    setLoading(true);

    try {
      const tx = await saveTransaction({
        receiver,
        amount: Number(amount),
      });

      setSuccessMessage(`Transaction sent — Tx: ${tx.txHash}`);

      setTimeout(() => {
        navigate("/transactions");
      }, 1500);
    } catch (err) {
      setErrorMessage(err.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackgroundWrapper>
      <AppLayout>
        <div style={styles.page}>
          <div style={styles.header}>
            <h1 style={styles.title}>Send</h1>
            <p style={styles.subtitle}>
              Transfer funds to another wallet address
            </p>
          </div>

          <div style={styles.card}>
            <label style={styles.label}>Receiver wallet address</label>
            <input
              type="text"
              placeholder="0x..."
              value={receiver}
              onChange={(e) => {
                setReceiver(e.target.value);
                setErrorMessage("");
              }}
              style={styles.input}
            />

            <label style={styles.label}>Amount</label>
            <div style={styles.amountWrapper}>
              <span style={styles.amountPrefix}>₹</span>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErrorMessage("");
                }}
                style={styles.amountInput}
              />
            </div>

            {errorMessage && (
              <div style={styles.errorBox}>
                <span>⚠</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div style={styles.successBox}>
                <span>✓</span>
                <span style={styles.successText}>{successMessage}</span>
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={loading || !receiver || !amount}
              style={{
                ...styles.primaryButton,
                opacity: loading || !receiver || !amount ? 0.6 : 1,
                cursor:
                  loading || !receiver || !amount
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {loading ? "Sending…" : "Send"}
            </button>

            <button
              onClick={() => navigate("/transactions")}
              style={styles.secondaryButton}
            >
              View Transactions
            </button>
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
  inputBorder: "rgba(148,163,184,0.18)",
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

  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 16,
  },

  input: {
    width: "100%",
    height: 48,
    boxSizing: "border-box",
    borderRadius: 10,
    border: `1px solid ${colors.inputBorder}`,
    background: "#0b1120",
    color: colors.text,
    fontSize: 14,
    padding: "0 14px",
  },

  amountWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    border: `1px solid ${colors.inputBorder}`,
    background: "#0b1120",
    padding: "0 14px",
  },

  amountPrefix: {
    fontSize: 15,
    fontWeight: 700,
    color: colors.textMuted,
  },

  amountInput: {
    flex: 1,
    height: 48,
    border: "none",
    outline: "none",
    background: "transparent",
    color: colors.text,
    fontSize: 14,
  },

  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    padding: "10px 12px",
    borderRadius: 10,
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.25)",
    color: "#f87171",
    fontSize: 13,
  },

  successBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    padding: "10px 12px",
    borderRadius: 10,
    background: "rgba(52,211,153,0.10)",
    border: "1px solid rgba(52,211,153,0.25)",
    color: "#34d399",
    fontSize: 13,
  },

  successText: { wordBreak: "break-all" },

  primaryButton: {
    width: "100%",
    height: 48,
    marginTop: 20,
    border: "none",
    borderRadius: 10,
    background: "linear-gradient(135deg, #8b5cf6, #2563eb)",
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 700,
  },

  secondaryButton: {
    width: "100%",
    height: 44,
    marginTop: 10,
    border: "1px solid rgba(139,92,246,0.35)",
    borderRadius: 10,
    background: "rgba(139,92,246,0.08)",
    color: "#c4b5fd",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
};