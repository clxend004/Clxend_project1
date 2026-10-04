import React from "react";

export default function CustomButton({
  title,
  onClick,
  disabled,
  loading = false,
  style = {},
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: "100%",
        height: 52,
        padding: "0 12px",
        borderRadius: 11,

        background:
          disabled || loading
            ? "#475569"
            : "linear-gradient(135deg, #8b5cf6, #2563eb)",

        color: "#ffffff",
        fontWeight: 700,
        fontSize: 15,

        border: "none",

        cursor:
          disabled || loading
            ? "not-allowed"
            : "pointer",

        marginTop: 10,

        opacity:
          disabled || loading
            ? 0.5
            : 1,

        boxShadow:
          "0 10px 25px rgba(59,130,246,0.25)",

        transition: "0.3s",

        ...style,
      }}
    >
      {loading ? "Loading..." : title}
    </button>
  );
}