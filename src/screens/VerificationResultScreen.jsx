import React, { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import BackgroundWrapper from "../components/BackgroundWrapper";
import { useLocation, useNavigate } from "react-router-dom";
import Loader from "../components/Loader";

export default function VerificationResultScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  const passedData = location.state;

  // ✅ GET LOGGED-IN USER EMAIL
  const userEmail = localStorage.getItem("userEmail");

  // ✅ EXTRACT NAME FROM EMAIL
  const userName = userEmail
    ? userEmail.split("@")[0]
    : "Unknown User";

  useEffect(() => {
    if (passedData) {
      setData(passedData);

      // ✅ SAVE RESULT
      localStorage.setItem(
        "kycResult",
        JSON.stringify(passedData)
      );

      // ✅ SAVE STATUS
      localStorage.setItem(
        "kycStatus",
        passedData.status
      );

      setLoading(false);

    } else {
      const saved = localStorage.getItem("kycResult");

      if (saved) {
        setData(JSON.parse(saved));
      }

      setLoading(false);
    }
  }, [passedData]);

  if (loading) return <Loader />;

  if (!data) {
    return (
      <BackgroundWrapper>
        <div style={{ textAlign: "center", marginTop: 50 }}>
          <p>No verification data found</p>

          <button
            className="btn"
            onClick={() => navigate("/kyc")}
          >
            Go to KYC
          </button>
        </div>
      </BackgroundWrapper>
    );
  }

  const isVerified = data?.status === "verified";

  return (
    <BackgroundWrapper>
      <AppLayout>
        <div style={styles.container}>

          {/* TITLE */}
          <h2 style={styles.title}>
            Verification Result
          </h2>

          {/* USER */}
          <div style={styles.userBox}>
            <strong>Verified User:</strong> {userName}
          </div>

          {/* VERIFIED ICON */}
          {isVerified && (
            <div style={{ marginBottom: 15 }}>
              <div style={styles.verifiedIcon}>
                ✔
              </div>
            </div>
          )}

          {/* STATUS */}
          <div style={{ marginBottom: 15 }}>
            <span
              style={{
                ...styles.statusBadge,
                background:
                  data.status === "verified"
                    ? "#4CAF50"
                    : data.status === "failed"
                    ? "#f44336"
                    : "#FFC107",
              }}
            >
              {data.status === "verified"
                ? "Verified ✅"
                : data.status === "failed"
                ? "Failed ❌"
                : "Pending ⏳"}
            </span>
          </div>

          {/* INFO */}
          <div style={styles.infoBox}>
            <strong>Liveness:</strong>{" "}
            {data.liveness ? "✅ Passed" : "❌ Failed"}
          </div>

          <div style={styles.infoBox}>
            <strong>Face Match:</strong>{" "}
            <span
              style={{
                color:
                  data.faceMatchScore > 70
                    ? "green"
                    : "red",
              }}
            >
              {data.faceMatchScore}%
            </span>
          </div>

          {/* ✅ CHANGED HERE */}
          <div style={styles.infoBox}>
            <strong>Name:</strong> {userName}
          </div>

          <div style={styles.infoBox}>
            <strong>ID Number:</strong>{" "}
            {data.ocrData?.idNumber}
          </div>

          {/* SELFIE */}
          {data.selfie && (
            <div style={{ marginTop: 15 }}>
              <img
                src={data.selfie}
                alt="Selfie"
                style={styles.selfie}
              />
            </div>
          )}

          {/* FAILED */}
          {data.status === "failed" && (
            <div style={styles.errorBox}>
              {data.error || "Verification Failed"}
            </div>
          )}

          {/* BUTTON */}
          {data.status === "verified" && (
            <button
              className="btn"
              style={{
                marginTop: 20,
                width: "100%",
              }}
              onClick={() => navigate("/wallet")}
            >
              Continue to Wallet
            </button>
          )}
        </div>
      </AppLayout>
    </BackgroundWrapper>
  );
}

const styles = {
  container: {
    width: "100%",
    maxWidth: "380px", // ✅ smaller card
    margin: "0 auto",
    padding: "18px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.9)",
    boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
    textAlign: "center",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },

  userBox: {
    marginBottom: 14,
    padding: "10px",
    borderRadius: 10,
    background: "rgba(255,255,255,0.6)",
    fontSize: 14,
  },

  verifiedIcon: {
    width: 55,
    height: 55,
    borderRadius: "50%",
    backgroundColor: "#4CAF50",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto",
    fontSize: 28,
    color: "#fff",
  },

  statusBadge: {
    padding: "8px 14px",
    borderRadius: 30,
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },

  infoBox: {
    marginBottom: 12,
    padding: 10,
    borderRadius: 10,
    background: "rgba(255,255,255,0.6)",
    textAlign: "left",
    fontSize: 14,
  },

  selfie: {
    width: 90,
    height: 90,
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid #4CAF50",
  },

  errorBox: {
    marginTop: 15,
    padding: 10,
    borderRadius: 10,
    background: "#ffebee",
    color: "#d32f2f",
    fontSize: 14,
  },
};