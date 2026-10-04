import React, { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import BackgroundWrapper from "../components/BackgroundWrapper";
import { useLocation, useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import { maskGovId } from "../utils/sensitiveData";

export default function VerificationResultScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  const passedData = location.state;

  // Get logged-in user email
  const userEmail = localStorage.getItem("userEmail");

  // Extract username from email
  const userName = userEmail
    ? userEmail.split("@")[0]
    : "Unknown User";

  useEffect(() => {
    if (passedData) {
      setData(passedData);

      /*
        SECURITY:
        Only a minimal verification summary is stored.
        Raw selfie and raw ID number are not persisted.
      */
      localStorage.setItem(
        "kycResult",
        JSON.stringify({
          status: passedData.status,

          faceMatchScore:
            passedData.faceMatchScore ?? null,

          liveness:
            passedData.liveness ?? null,

          livenessScore:
            passedData.livenessScore ?? 0,

          livenessStatus:
            passedData.livenessStatus || "",

          overallScore:
            passedData.overallScore ?? null,

          livenessResult:
            passedData.livenessResult ?? null,

          maskedIdNumber:
            passedData.maskedIdNumber ||
            maskGovId(passedData.ocrData?.idNumber),

          name:
            passedData.name ||
            passedData.ocrData?.name,

          submittedAt:
            passedData.submittedAt ||
            new Date().toISOString(),

          reasons:
            passedData.reasons || [],
        })
      );

      localStorage.setItem(
        "kycStatus",
        passedData.status
      );

      setLoading(false);
    } else {
      const saved = localStorage.getItem("kycResult");

      if (saved) {
        try {
          setData(JSON.parse(saved));
        } catch (error) {
          console.error("Unable to read saved KYC result:", error);
        }
      }

      setLoading(false);
    }
  }, [passedData]);

  if (loading) {
    return <Loader />;
  }

  if (!data) {
    return (
      <BackgroundWrapper>
        <AppLayout>
          <div style={styles.page}>
            <div style={styles.emptyBox}>
              <div style={styles.emptyIcon}>!</div>

              <h2 style={styles.title}>
                No Verification Data
              </h2>

              <p style={styles.subtitle}>
                No KYC verification result was found.
              </p>

              <button
                style={styles.primaryButton}
                onClick={() => navigate("/kyc")}
              >
                Go to KYC →
              </button>
            </div>
          </div>
        </AppLayout>
      </BackgroundWrapper>
    );
  }

  /*
    Normalize once and compare using lowercase values.
  */
  const normalizedStatus = String(
    data?.status || "Pending"
  ).toLowerCase();
  const isVerified = normalizedStatus === "approved";
  const isRejected = normalizedStatus === "rejected";
  const isManualReview =
     normalizedStatus === "manual_review" ||
     normalizedStatus === "manual review";

  const isPending =
     !isVerified && !isRejected && !isManualReview;

  const canContinue = data?.canContinue === true;

  const hasLiveness =
    Boolean(data.livenessStatus) ||
    (data.liveness !== null && data.liveness !== undefined);

  const livenessPassed =
    String(data.livenessStatus || "").toUpperCase() === "PASSED" ||
    data.liveness === true ||
    String(data.liveness).toUpperCase() === "REAL";

  const faceScore =
    data.faceMatchScore !== null &&
    data.faceMatchScore !== undefined
      ? Number(data.faceMatchScore)
      : null;

  const displayStatus = isVerified
    ? "Verified"
    : isRejected
    ? "Verification Failed"
    : isManualReview
    ? "Manual Review"
    : "Verification Pending";

  return (
    <BackgroundWrapper>
      <AppLayout>
        <div style={styles.page}>

          {/* MAIN RESULT PANEL */}
          <div style={styles.resultPanel}>

            {/* HEADER */}
            <div style={styles.header}>
              <div style={styles.headerIcon}>
                ✓
              </div>

              <div>
                <p style={styles.smallHeading}>
                  CLXEND IDENTITY
                </p>

                <h1 style={styles.title}>
                  Verification Result
                </h1>
              </div>
            </div>

            {/* STATUS SECTION */}
            <div
              style={{
                ...styles.statusSection,
                ...(isVerified
                  ? styles.statusApproved
                  : isRejected
                  ? styles.statusRejected
                  : styles.statusPending),
              }}
            >
              <div style={styles.statusIcon}>
                {isVerified
                  ? "✓"
                  : isRejected
                  ? "!"
                  : isManualReview
                  ? "!"
                  : "…"}
              </div>

              <div style={styles.statusContent}>
                <span style={styles.statusLabel}>
                  VERIFICATION STATUS
                </span>

                <h2 style={styles.statusTitle}>
                  {displayStatus}
                </h2>

                <p style={styles.statusDescription}>
                  {isVerified
                    ? "Your identity has been successfully verified."
                    : isRejected
                    ? "Your identity verification was not successful."
                    : isManualReview
                    ? "Your verification requires additional review."
                    : "Your KYC information has been submitted and is awaiting verification."}
                </p>
              </div>
            </div>

            {/* USER */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                Account Information
              </h3>

              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>
                    User
                  </span>

                  <strong style={styles.infoValue}>
                    {userName}
                  </strong>
                </div>

                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>
                    Name
                  </span>

                  <strong style={styles.infoValue}>
                    {data.name ||
                      data.ocrData?.name ||
                      userName}
                  </strong>
                </div>

                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>
                    ID Number
                  </span>

                  <strong style={styles.infoValue}>
                    {data.maskedIdNumber ||
                      maskGovId(data.ocrData?.idNumber) ||
                      "Not available"}
                  </strong>
                </div>
              </div>
            </div>

            {/* VERIFICATION CHECKS */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                Verification Checks
              </h3>

              <div style={styles.checkList}>

                {/* LIVENESS */}
                <div style={styles.checkRow}>
                  <div style={styles.checkLeft}>
                    <div
                      style={{
                        ...styles.checkIcon,
                        ...(hasLiveness && livenessPassed
                          ? styles.checkPassed
                          : styles.checkNeutral),
                      }}
                    >
                      {hasLiveness && livenessPassed
                        ? "✓"
                        : "•"}
                    </div>

                    <div>
                      <strong style={styles.checkTitle}>
                        Liveness Detection
                      </strong>

                      <span style={styles.checkDescription}>
                        Facial presence verification
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      ...styles.checkStatus,
                      ...(hasLiveness && livenessPassed
                        ? styles.passText
                        : styles.neutralText),
                    }}
                  >
                    {hasLiveness
                      ? livenessPassed
                        ? data.livenessScore !== null &&
                          data.livenessScore !== undefined
                          ? `Passed · ${Number(data.livenessScore).toFixed(0)}%`
                          : "Passed"
                        : "Failed"
                      : "Pending"}
                  </span>
                </div>

                {/* FACE MATCH */}
                <div style={styles.checkRow}>
                  <div style={styles.checkLeft}>
                    <div
                      style={{
                        ...styles.checkIcon,
                        ...(faceScore !== null
                          ? styles.checkPassed
                          : styles.checkNeutral),
                      }}
                    >
                      {faceScore !== null
                        ? "✓"
                        : "•"}
                    </div>

                    <div>
                      <strong style={styles.checkTitle}>
                        Face Match
                      </strong>

                      <span style={styles.checkDescription}>
                        Selfie and identity document comparison
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      ...styles.scoreText,
                      ...(faceScore !== null &&
                      faceScore >= 70
                        ? styles.passText
                        : styles.neutralText),
                    }}
                  >
                    {faceScore !== null
                      ? `${faceScore}%`
                      : "Pending"}
                  </span>
                </div>

                {/* OVERALL SCORE */}
                <div style={styles.checkRow}>
                  <div style={styles.checkLeft}>
                    <div
                      style={{
                        ...styles.checkIcon,
                        ...(data.overallScore !== null &&
                        data.overallScore !== undefined
                          ? styles.checkPassed
                          : styles.checkNeutral),
                      }}
                    >
                      {data.overallScore !== null &&
                      data.overallScore !== undefined
                        ? "✓"
                        : "•"}
                    </div>

                    <div>
                      <strong style={styles.checkTitle}>
                        Overall Verification Score
                      </strong>

                      <span style={styles.checkDescription}>
                        Combined identity verification assessment
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      ...styles.scoreText,
                      ...(data.overallScore !== null &&
                      data.overallScore !== undefined
                        ? styles.passText
                        : styles.neutralText),
                    }}
                  >
                    {data.overallScore !== null &&
                    data.overallScore !== undefined
                      ? `${Number(data.overallScore).toFixed(0)}%`
                      : "Pending"}
                  </span>
                </div>

                {/* ID */}
                <div style={styles.checkRow}>
                  <div style={styles.checkLeft}>
                    <div
                      style={{
                        ...styles.checkIcon,
                        ...styles.checkPassed,
                      }}
                    >
                      ✓
                    </div>

                    <div>
                      <strong style={styles.checkTitle}>
                        Identity Document
                      </strong>

                      <span style={styles.checkDescription}>
                        Government ID submitted
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      ...styles.checkStatus,
                      ...styles.passText,
                    }}
                  >
                    Submitted
                  </span>
                </div>
              </div>
            </div>

            {/* FAILURE REASON */}
            {isRejected && (
              <div style={styles.errorBox}>
                <div style={styles.errorIcon}>
                  !
                </div>

                <div>
                  <strong style={styles.errorTitle}>
                    Verification Issue
                  </strong>

                  <p style={styles.errorText}>
                    {data.reasons?.length
                      ? data.reasons.join(", ")
                      : data.error ||
                        "Verification failed. Please review your information and try again."}
                  </p>
                </div>
              </div>
            )}

            {/* MANUAL REVIEW */}
            {isManualReview && (
              <div style={styles.reviewBox}>
                <div style={styles.reviewIcon}>
                  !
                </div>

                <div>
                  <strong style={styles.reviewTitle}>
                    Additional Review Required
                  </strong>

                  <p style={styles.reviewText}>
                    Your submitted information has been received.
                    The verification team may need to review it
                    before your KYC status is finalized.
                  </p>
                </div>
              </div>
            )}

            {/* PENDING */}
            {isPending && (
              <div style={styles.pendingBox}>
                <div style={styles.pendingIcon}>
                  …
                </div>

                <div>
                  <strong style={styles.pendingTitle}>
                    Verification in Progress
                  </strong>

                  <p style={styles.pendingText}>
                    Your KYC submission has been received and is
                    currently pending verification.
                  </p>
                </div>
              </div>
            )}

            {/* ACTION */}
            
              <div style={styles.actions}>
                 {canContinue ? (
                   <button
                      style={styles.primaryButton}
                      onClick={() => navigate("/wallet")}
                  >
                    Continue to Wallet →
                   </button>
                ) : (
                   <button
                     style={styles.secondaryButton}
                     onClick={() => navigate("/kyc")}
                   >
                    ← Back to KYC
                    </button>
                  )}
              </div>

          </div>
        </div>
      </AppLayout>
    </BackgroundWrapper>
  );
}

const styles = {
  page: {
    width: "100%",
    minHeight: "calc(100vh - 80px)",
    padding: "35px 20px 50<div style={styles.actions}>px",
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "center",
  },

  resultPanel: {
    width: "100%",
    maxWidth: "760px",
    padding: "32px",
    borderRadius: "24px",
    background:
      "linear-gradient(145deg, rgba(15,23,42,0.97), rgba(30,41,59,0.94))",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow:
      "0 25px 70px rgba(0,0,0,0.30)",
    color: "#ffffff",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "28px",
  },

  headerIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#ffffff",
    fontSize: "24px",
    fontWeight: "700",
    flexShrink: 0,
  },

  smallHeading: {
    margin: 0,
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "1.5px",
    color: "#94a3b8",
  },

  title: {
    margin: "3px 0 0",
    fontSize: "28px",
    fontWeight: "700",
    color: "#ffffff",
  },

  subtitle: {
    color: "#94a3b8",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  statusSection: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    padding: "22px",
    borderRadius: "18px",
    marginBottom: "28px",
    border: "1px solid rgba(255,255,255,0.10)",
  },

  statusApproved: {
    background:
      "rgba(34,197,94,0.12)",
  },

  statusRejected: {
    background:
      "rgba(239,68,68,0.12)",
  },

  statusPending: {
    background:
      "rgba(245,158,11,0.12)",
  },

  statusIcon: {
    width: "54px",
    height: "54px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(255,255,255,0.10)",
    color: "#ffffff",
    fontSize: "25px",
    fontWeight: "700",
    flexShrink: 0,
  },

  statusContent: {
    minWidth: 0,
  },

  statusLabel: {
    display: "block",
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "1.3px",
    color: "#94a3b8",
    marginBottom: "3px",
  },

  statusTitle: {
    margin: 0,
    fontSize: "22px",
    color: "#ffffff",
  },

  statusDescription: {
    margin: "6px 0 0",
    color: "#cbd5e1",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  section: {
    marginTop: "25px",
  },

  sectionTitle: {
    margin: "0 0 13px",
    fontSize: "15px",
    color: "#f8fafc",
    fontWeight: "700",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "12px",
  },

  infoItem: {
    padding: "15px",
    borderRadius: "14px",
    background:
      "rgba(255,255,255,0.055)",
    border: "1px solid rgba(255,255,255,0.08)",
  },

  infoLabel: {
    display: "block",
    color: "#94a3b8",
    fontSize: "11px",
    marginBottom: "6px",
  },

  infoValue: {
    display: "block",
    color: "#f8fafc",
    fontSize: "14px",
    wordBreak: "break-word",
  },

  checkList: {
    borderRadius: "16px",
    overflow: "hidden",
    border:
      "1px solid rgba(255,255,255,0.08)",
  },

  checkRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    padding: "17px",
    borderBottom:
      "1px solid rgba(255,255,255,0.07)",
  },

  checkLeft: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    minWidth: 0,
  },

  checkIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontWeight: "700",
  },

  checkPassed: {
    background:
      "rgba(34,197,94,0.15)",
    color: "#4ade80",
  },

  checkNeutral: {
    background:
      "rgba(148,163,184,0.12)",
    color: "#94a3b8",
  },

  checkTitle: {
    display: "block",
    color: "#f8fafc",
    fontSize: "13px",
  },

  checkDescription: {
    display: "block",
    color: "#94a3b8",
    fontSize: "11px",
    marginTop: "3px",
  },

  checkStatus: {
    fontSize: "12px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  scoreText: {
    fontSize: "14px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  passText: {
    color: "#4ade80",
  },

  neutralText: {
    color: "#fbbf24",
  },

  errorBox: {
    display: "flex",
    gap: "13px",
    marginTop: "25px",
    padding: "16px",
    borderRadius: "14px",
    background:
      "rgba(239,68,68,0.10)",
    border:
      "1px solid rgba(239,68,68,0.25)",
  },

  errorIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#ef4444",
    color: "#ffffff",
    fontWeight: "700",
    flexShrink: 0,
  },

  errorTitle: {
    display: "block",
    color: "#fca5a5",
    fontSize: "13px",
  },

  errorText: {
    margin: "5px 0 0",
    color: "#fecaca",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  reviewBox: {
    display: "flex",
    gap: "13px",
    marginTop: "25px",
    padding: "16px",
    borderRadius: "14px",
    background:
      "rgba(245,158,11,0.10)",
    border:
      "1px solid rgba(245,158,11,0.25)",
  },

  reviewIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f59e0b",
    color: "#ffffff",
    fontWeight: "700",
    flexShrink: 0,
  },

  reviewTitle: {
    display: "block",
    color: "#fcd34d",
    fontSize: "13px",
  },

  reviewText: {
    margin: "5px 0 0",
    color: "#fde68a",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  pendingBox: {
    display: "flex",
    gap: "13px",
    marginTop: "25px",
    padding: "16px",
    borderRadius: "14px",
    background:
      "rgba(59,130,246,0.10)",
    border:
      "1px solid rgba(59,130,246,0.25)",
  },

  pendingIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#3b82f6",
    color: "#ffffff",
    fontWeight: "700",
    flexShrink: 0,
  },

  pendingTitle: {
    display: "block",
    color: "#93c5fd",
    fontSize: "13px",
  },

  pendingText: {
    margin: "5px 0 0",
    color: "#bfdbfe",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  actions: {
    marginTop: "30px",
  },

  primaryButton: {
    width: "100%",
    border: "none",
    borderRadius: "12px",
    padding: "14px 18px",
    background:
      "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow:
      "0 8px 25px rgba(102,126,234,0.25)",
  },

  secondaryButton: {
    width: "100%",
    border:
      "1px solid rgba(255,255,255,0.15)",
    borderRadius: "12px",
    padding: "14px 18px",
    background:
      "rgba(255,255,255,0.06)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  emptyBox: {
    width: "100%",
    maxWidth: "500px",
    alignSelf: "flex-start",
    margin: "50px auto",
    padding: "35px",
    borderRadius: "22px",
    background:
      "rgba(15,23,42,0.95)",
    border:
      "1px solid rgba(255,255,255,0.10)",
    textAlign: "center",
    color: "#ffffff",
  },

  emptyIcon: {
    width: "50px",
    height: "50px",
    margin: "0 auto 15px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f59e0b",
    color: "#ffffff",
    fontSize: "22px",
    fontWeight: "700",
  },
};