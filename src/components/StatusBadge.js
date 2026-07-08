export default function StatusBadge({ status }) {
  const styles = {
    Pending: { color: "orange" },
    Approved: { color: "green" },
    Rejected: { color: "red" },
    "Manual review": { color: "blue" },
  };

  return (
    <span style={{ fontWeight: "bold", ...(styles[status] || {}) }}>
      {status}
    </span>
  );
}