import React from "react";

export default function TransactionCard({ tx }) {

  const getStatusColor = (status) => {
    if (status === "Confirmed") return "green";
    if (status === "Pending") return "orange";
    if (status === "Failed") return "red";
  };

  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: "15px",
        marginBottom: "10px",
        borderRadius: "8px",
        background: "#f9f9f9"
      }}
    >
      <p><b>Amount:</b> ₹{tx.amount}</p>
      <p><b>Sender:</b> {tx.sender}</p>
      <p><b>Recipient:</b> {tx.recipient}</p>

      <p>
        <b>Status:</b>
        <span style={{ color: getStatusColor(tx.status), marginLeft: 5 }}>
          {tx.status}
        </span>
      </p>

      <p><b>Timestamp:</b> {tx.timestamp}</p>
    </div>
  );
}