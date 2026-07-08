import React, { useEffect, useState, useCallback } from "react";
import AppLayout from "../components/AppLayout";
import { getTransactions } from "../services/transactionService";
import BackgroundWrapper from "../components/BackgroundWrapper";
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

  // ================= STATUS COLORS =================
  const getStatusStyle = (status) => {
    switch (status) {
      case "Approved":
      case "Confirmed":
        return { backgroundColor: "#4CAF50" };

      case "Rejected":
      case "Failed":
        return { backgroundColor: "#F44336" };

      case "Pending":
        return { backgroundColor: "#FF9800" };

      case "Manual review":
        return { backgroundColor: "#2196F3" };

      default:
        return { backgroundColor: "#999" };
    }
  };

  const getKYCStyle = (status) => {
    switch (status) {
      case "Approved":
        return { backgroundColor: "#4CAF50" };
      case "Rejected":
        return { backgroundColor: "#F44336" };
      case "Pending":
        return { backgroundColor: "#FF9800" };
      default:
        return { backgroundColor: "#999" };
    }
  };

  const thStyle = {
    padding: 14,
    borderBottom: "2px solid #ddd",
    fontWeight: "bold",
    textAlign: "center",
  };

  const tdStyle = {
    padding: 14,
    borderBottom: "1px solid #eee",
    textAlign: "center",
  };

  return (
    <BackgroundWrapper>
      <AppLayout>
        <div
          style={{
            width: "95%",
            maxWidth: "1000px",
            margin: "0 auto",
            padding: "20px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.9)",
            boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ textAlign: "center", marginBottom: 20 }}>
            Transaction History
          </h2>

          {/* ✅ KYC STATUS */}
          <div style={{ textAlign: "center", marginBottom: 15 }}>
            <span
              style={{
                ...getKYCStyle(kycStatus),
                padding: "6px 14px",
                borderRadius: 20,
                color: "#fff",
                fontWeight: "bold",
              }}
            >
              KYC: {kycStatus}
            </span>
          </div>

          {/* ✅ ERROR */}
          {error && (
            <p style={{ color: "red", textAlign: "center" }}>
              {error}
            </p>
          )}

          {/* ✅ LOADING */}
          {loading && (
            <p style={{ textAlign: "center" }}>
              Loading transactions...
            </p>
          )}

          {/* ✅ EMPTY */}
          {!loading && transactions.length === 0 && !error && (
            <p style={{ textAlign: "center" }}>
              No transactions found
            </p>
          )}

          {/* ✅ TABLE */}
          {!loading && transactions.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "rgba(255,255,255,0.4)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.6)" }}>
                    <th style={thStyle}>Tx Hash</th>
                    <th style={thStyle}>Amount</th>
                    <th style={thStyle}>Sender</th>
                    <th style={thStyle}>Recipient</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Time</th>
                  </tr>
                </thead>

                <tbody>
                  {transactions.map((tx, index) => (
                    <tr
                      key={tx.txHash}
                      style={{
                        background:
                          index % 2 === 0
                            ? "rgba(255,255,255,0.3)"
                            : "rgba(255,255,255,0.2)",
                      }}
                    >
                      <td style={tdStyle} title={tx.txHash}>
                        {tx.txHash?.slice(0, 10)}...
                      </td>

                      <td style={tdStyle}>₹{tx.amount}</td>
                      <td style={tdStyle}>{tx.sender}</td>
                      <td style={tdStyle}>{tx.recipient}</td>

                      <td style={tdStyle}>
                        <span
                          style={{
                            ...getStatusStyle(tx.status),
                            padding: "6px 12px",
                            borderRadius: 20,
                            color: "#fff",
                            fontWeight: "bold",
                            fontSize: 13,
                          }}
                        >
                          {tx.status}
                        </span>
                      </td>

                      <td style={tdStyle}>{tx.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AppLayout>
    </BackgroundWrapper>
  );
}