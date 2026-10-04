export default function StatusBadge({ status }) {
  const normalized = status?.toLowerCase();

  const config = {
    approved: {
      label: "Approved",
      color: "#34d399",
      background: "rgba(52,211,153,0.10)",
    },

    confirmed: {
      label: "Confirmed",
      color: "#34d399",
      background: "rgba(52,211,153,0.10)",
    },

    completed: {
      label: "Completed",
      color: "#34d399",
      background: "rgba(52,211,153,0.10)",
    },

    pending: {
      label: "Pending",
      color: "#f59e0b",
      background: "rgba(245,158,11,0.10)",
    },

    "manual review": {
      label: "Manual Review",
      color: "#f59e0b",
      background: "rgba(245,158,11,0.10)",
    },

    rejected: {
      label: "Rejected",
      color: "#f87171",
      background: "rgba(248,113,113,0.10)",
    },

    failed: {
      label: "Failed",
      color: "#f87171",
      background: "rgba(248,113,113,0.10)",
    },

    cancelled: {
      label: "Cancelled",
      color: "#94a3b8",
      background: "rgba(148,163,184,0.10)",
    },
  };

  const current = config[normalized] || {
    label: status || "Unknown",
    color: "#94a3b8",
    background: "rgba(148,163,184,0.10)",
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "5px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        color: current.color,
        background: current.background,
      }}
    >
      {current.label}
    </span>
  );
}