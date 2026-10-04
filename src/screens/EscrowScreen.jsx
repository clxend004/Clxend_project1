import { useState } from "react";
import AppLayout from "../components/AppLayout";
import BackgroundWrapper from "../components/BackgroundWrapper";
import {
  createEscrowTransaction,
  depositEscrow,
  releaseEscrow,
  refundEscrow,
  syncEscrow,
} from "../services/escrowService";

import { getWallet } from "../services/walletService";

export default function EscrowScreen() {
  const [seller, setSeller] = useState("");
  const [amount, setAmount] = useState("");
  const [escrowId, setEscrowId] = useState("");
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const clearMessages = () => {
    setMessage("");
    setError("");
  };

  const handleCreate = async () => {
    clearMessages();

    if (!seller) {
      setError("Enter the seller wallet address");
      return;
    }

    if (!seller.startsWith("0x") || seller.length !== 42) {
      setError("Enter a valid Ethereum wallet address");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError("Enter a valid amount greater than 0");
      return;
    }

    setLoading(true);

    try {
      /*
       * TODO:
       * Replace this temporary sender with the
       * logged-in user's wallet address.
       *
       * We will connect getWallet() after testing
       * the basic escrow API flow.
       */
      const wallet = await getWallet();

      const sender =
         wallet.wallet_address ||
         wallet.address ||
         wallet.walletAddress;

      if (!sender) {
        throw new Error(
           "Wallet address not found."
        );
      }

      const result = await createEscrowTransaction({
        sender,
        seller,
        amount,
      });

      const escrow = result.escrow;

      setEscrowId(escrow.escrow_id);
      setStatus(escrow.status);
      setMessage(
        `Escrow created successfully. ID: ${escrow.escrow_id}`
      );
    } catch (err) {
      setError(err.message || "Failed to create escrow");
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    clearMessages();
    setLoading(true);

    try {
      const result = await depositEscrow(escrowId);

      setStatus(result.escrow?.status || "Funded");
      setMessage("Escrow deposit successful.");
    } catch (err) {
      setError(err.message || "Escrow deposit failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async () => {
    clearMessages();
    setLoading(true);

    try {
      const result = await releaseEscrow(escrowId);

      setStatus(result.escrow?.status || "Released");
      setMessage("Escrow released successfully.");
    } catch (err) {
      setError(err.message || "Escrow release failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    clearMessages();
    setLoading(true);

    try {
      const result = await refundEscrow(escrowId);

      setStatus(result.escrow?.status || "Refunded");
      setMessage("Escrow refunded successfully.");
    } catch (err) {
      setError(err.message || "Escrow refund failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    clearMessages();
    setLoading(true);

    try {
      const result = await syncEscrow(escrowId);

      setStatus(result.escrow?.blockchain_status || "Unknown");
      setMessage("Escrow status refreshed.");
    } catch (err) {
      setError(err.message || "Failed to fetch escrow");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackgroundWrapper>
      <AppLayout>
        <div style={styles.page}>
          <div style={styles.header}>
            <h1 style={styles.title}>Escrow</h1>
            <p style={styles.subtitle}>
              Create and manage a blockchain escrow
            </p>
          </div>

          <div style={styles.card}>
            {!escrowId && (
              <>
                <label style={styles.label}>
                  Seller wallet address
                </label>

                <input
                  type="text"
                  placeholder="0x..."
                  value={seller}
                  onChange={(e) => {
                    setSeller(e.target.value);
                    clearMessages();
                  }}
                  style={styles.input}
                />

                <label style={styles.label}>
                  Amount (ETH)
                </label>

                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="0.001"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    clearMessages();
                  }}
                  style={styles.input}
                />

                <button
                  onClick={handleCreate}
                  disabled={loading}
                  style={styles.primaryButton}
                >
                  {loading ? "Creating..." : "Create Escrow"}
                </button>
              </>
            )}

            {escrowId && (
              <>
                <div style={styles.infoBox}>
                  <div>
                    <strong>Escrow ID</strong>
                  </div>

                  <div style={styles.breakText}>
                    {escrowId}
                  </div>
                </div>

                <div style={styles.statusBox}>
                  <strong>Status:</strong> {status}
                </div>

                {status === "Created" && (
                  <button
                    onClick={handleDeposit}
                    disabled={loading}
                    style={styles.primaryButton}
                  >
                    {loading ? "Processing..." : "Deposit"}
                  </button>
                )}

                {status === "Funded" && (
                  <>
                    <button
                      onClick={handleRelease}
                      disabled={loading}
                      style={styles.primaryButton}
                    >
                      {loading ? "Processing..." : "Release"}
                    </button>

                    <button
                      onClick={handleRefund}
                      disabled={loading}
                      style={styles.secondaryButton}
                    >
                      {loading ? "Processing..." : "Refund"}
                    </button>
                  </>
                )}

                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  style={styles.secondaryButton}
                >
                  Refresh Status
                </button>
              </>
            )}

            {error && (
              <div style={styles.errorBox}>
                {error}
              </div>
            )}

            {message && (
              <div style={styles.successBox}>
                {message}
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </BackgroundWrapper>
  );
}

const styles = {
  page: {
    width: "100%",
    maxWidth: 460,
    margin: "0 auto",
    padding: "10px 4px 40px",
    color: "#f8fafc",
    fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
  },

  header: {
    marginBottom: 22,
  },

  title: {
    fontSize: 22,
    fontWeight: 800,
    margin: 0,
  },

  subtitle: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 6,
  },

  card: {
    padding: 24,
    borderRadius: 18,
    background: "linear-gradient(145deg, #182338, #111827)",
    border: "1px solid rgba(148,163,184,0.13)",
    boxShadow: "0 15px 40px rgba(0,0,0,0.20)",
  },

  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "#94a3b8",
    marginBottom: 6,
    marginTop: 16,
  },

  input: {
    width: "100%",
    height: 48,
    boxSizing: "border-box",
    borderRadius: 10,
    border: "1px solid rgba(148,163,184,0.18)",
    background: "#0b1120",
    color: "#f8fafc",
    fontSize: 14,
    padding: "0 14px",
  },

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
    cursor: "pointer",
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

  infoBox: {
    padding: 12,
    borderRadius: 10,
    background: "rgba(59,130,246,0.08)",
    border: "1px solid rgba(59,130,246,0.20)",
    fontSize: 13,
  },

  breakText: {
    marginTop: 6,
    wordBreak: "break-all",
    color: "#94a3b8",
  },

  statusBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    background: "rgba(52,211,153,0.08)",
    color: "#34d399",
    fontSize: 14,
  },

  errorBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.25)",
    color: "#f87171",
    fontSize: 13,
  },

  successBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    background: "rgba(52,211,153,0.10)",
    border: "1px solid rgba(52,211,153,0.25)",
    color: "#34d399",
    fontSize: 13,
  },
};