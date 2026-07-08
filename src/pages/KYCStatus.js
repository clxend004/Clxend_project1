import { useLocation, useNavigate } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";

export default function KYCStatus() {
  const location = useLocation();
  const navigate = useNavigate();

  const status = location.state?.status || "Pending";
  const message = location.state?.message || "";

  const getStatusMessage = () => {
    switch (status) {
      case "Approved":
        return "✅ Your KYC is approved!";
      case "Rejected":
        return "❌ KYC rejected. Please try again.";
      case "Manual review":
        return "🕒 Your KYC is under manual review.";
      default:
        return "⏳ KYC is pending verification.";
    }
  };

  return (
    <div style={styles.container}>
      <h2>KYC Status</h2>

      <p>
        Status: <StatusBadge status={status} />
      </p>

      <p>{getStatusMessage()}</p>
      {message && <p>{message}</p>}

      {status === "Rejected" && (
        <button onClick={() => navigate("/kyc")} style={styles.retry}>
          Re-upload KYC
        </button>
      )}
    </div>
  );
}

const styles = {
  container: {
    textAlign: "center",
    marginTop: "50px",
  },
  retry: {
    marginTop: "20px",
    padding: "10px 20px",
    backgroundColor: "red",
    color: "white",
    border: "none",
  },
};