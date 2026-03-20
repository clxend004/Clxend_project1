import React, { useEffect, useState } from "react";
import { getTransactions } from "../services/transactionService";

export default function TransactionHistoryScreen() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Status style function (clean & reusable)
  const getStatusStyle = (status) => {
    switch (status) {
      case "Confirmed":
        return { backgroundColor: "#4CAF50" };
      case "Pending":
        return { backgroundColor: "#FF9800" };
      case "Failed":
        return { backgroundColor: "#F44336" };
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
    <div style={{ padding: 30 }}>
      <h2 style={{ textAlign: "center", marginBottom: 25 }}>
        Transaction History
      </h2>

      {/* ✅ Loading */}
      {loading && (
        <p style={{ textAlign: "center", marginTop: 20 }}>
          Loading transactions...
        </p>
      )}

      {/* ✅ Empty State */}
      {!loading && transactions.length === 0 && (
        <p style={{ textAlign: "center" }}>No transactions found</p>
      )}

      {/* ✅ Table */}
      {!loading && transactions.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: 20,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th style={{ ...thStyle, width: "20%" }}>Tx Hash</th>
                <th style={{ ...thStyle, width: "10%" }}>Amount</th>
                <th style={{ ...thStyle, width: "15%" }}>Sender</th>
                <th style={{ ...thStyle, width: "15%" }}>Recipient</th>
                <th style={{ ...thStyle, width: "15%" }}>Status</th>
                <th style={{ ...thStyle, width: "25%" }}>Time</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((tx, index) => (
                <tr
                  key={tx.id}
                  style={{
                    backgroundColor:
                      index % 2 === 0 ? "#ffffff" : "#fafafa",
                    transition: "0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f1f1f1")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      index % 2 === 0 ? "#ffffff" : "#fafafa")
                  }
                >
                  {/* Tx Hash */}
                  <td style={tdStyle} title={tx.txHash}>
                    {tx.txHash.slice(0, 10)}...
                  </td>

                  {/* Amount */}
                  <td style={tdStyle}>₹{tx.amount}</td>

                  {/* Sender */}
                  <td style={tdStyle}>{tx.sender}</td>

                  {/* Recipient */}
                  <td style={tdStyle}>{tx.recipient}</td>

                  {/* Status */}
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

                  {/* Timestamp */}
                  <td style={tdStyle}>{tx.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}