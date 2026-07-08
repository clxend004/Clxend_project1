import React from "react";

export default function CustomButton({ title, onClick, disabled }) {
  return (
    <button
    type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: 12,
        borderRadius: 10,
        background: "linear-gradient(135deg, #43e97b, #38f9d7)",
        color: "#fff",
        fontWeight: "bold",
        border: "none",
        cursor: "pointer",
        marginTop: 10,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {title}
    </button>
  );
}