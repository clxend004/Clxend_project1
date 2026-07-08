import { useState } from "react";
import { submitKYC } from "../services/kycService";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";

export default function KYCUpload() {
  const [idFile, setIdFile] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const validateFile = (file) => {
    if (!file) return false;

    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG/PNG files allowed");
      return false;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("File size must be less than 2MB");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setError("");

    if (!idFile || !selfie) {
      return setError("⚠️ Please upload both ID and Selfie");
    }

    if (!validateFile(idFile) || !validateFile(selfie)) return;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("idFile", idFile);
      formData.append("selfie", selfie);

      const response = await submitKYC(formData);

      navigate("/kyc-status", {
        state: {
          status: response.status,
          message: response.message,
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.detail || "❌ KYC submission failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>KYC Verification</h2>

      <div style={styles.uploadBox}>
        <label>Upload ID Proof:</label>
        <input type="file" onChange={(e) => setIdFile(e.target.files[0])} />
      </div>

      <div style={styles.uploadBox}>
        <label>Upload Selfie:</label>
        <input type="file" onChange={(e) => setSelfie(e.target.files[0])} />
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {loading ? (
        <Loader />
      ) : (
        <button style={styles.button} onClick={handleSubmit}>
          Submit KYC
        </button>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "400px",
    margin: "auto",
    textAlign: "center",
  },
  uploadBox: {
    marginBottom: "15px",
  },
  button: {
    padding: "10px 20px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
  error: {
    color: "red",
  },
};