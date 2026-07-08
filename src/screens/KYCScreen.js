import React, { useState, useRef, useEffect } from "react";
import AppLayout from "../components/AppLayout";
import { useNavigate } from "react-router-dom";
import { generateOTP, verifyOTP, saveKYC } from "../services/kycService";
import BackgroundWrapper from "../components/BackgroundWrapper";

export default function KYCScreen() {
  const navigate = useNavigate();

  const [govIdType, setGovIdType] = useState("");
  const [govIdNumber, setGovIdNumber] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [documentFile, setDocumentFile] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [progress, setProgress] = useState(0);
  const [govIdError, setGovIdError] = useState("");

  const [message, setMessage] = useState(""); 
  const [errorMessage, setErrorMessage] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const selfieInputRef = useRef(null);

 // ================= Gov id change =================
const handleGovIdChange = (value) => {

  let error = "";

  // Remove spaces
  value = value.trim();

  if (govIdType === "aadhaar") {
    value = value.replace(/\D/g, ""); // only numbers

    if (value.length > 12) return;

    if (value && value.length !== 12) {
      error = "Aadhaar must be 12 digits";
    }
  }

  if (govIdType === "pan") {
    value = value.toUpperCase();

    if (value.length > 10) return;

    if (value && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) {
      error = "PAN format: ABCDE1234F";
    }
  }

  if (govIdType === "voter") {
    value = value.toUpperCase();

    if (value.length > 10) return;

    if (value && !/^[A-Z0-9]{10}$/.test(value)) {
      error = "Voter ID must be 10 alphanumeric characters";
    }
  }

  setGovIdNumber(value);
  setGovIdError(error);
};

  // ================= OTP GENERATION =================
const handleGenerateOTP = async () => {
  if (!govIdType) {
    alert("Select Government ID Type");
    return;
  }

  if (!govIdNumber) {
    alert("Enter Government ID Number");
    return;
  }

  if (govIdError) {
    alert("Fix ID errors first");
    return;
  }

  try {
    const response = await generateOTP();
    console.log("Generated OTP:", response.otp);
    setOtpSent(true);
  } catch (error) {
    console.error("OTP Error:", error);
  }
};
  // ================= OTP VERIFY =================
  const handleVerifyOtp = async () => {
  // ✅ check empty
  if (!enteredOtp) {
    setErrorMessage("Enter OTP");
    return;
  }

  try {
    await verifyOTP(enteredOtp);

    setOtpVerified(true);

    setMessage("OTP Verified Successfully ✅");
    setErrorMessage(""); // clear error

  } catch (error) {
    setErrorMessage(error.message || "Invalid OTP ❌");
    setMessage(""); // clear success
  }
};

  // ================= DOCUMENT PICK =================
  const pickDocument = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      window.alert("Only PDF, JPG, PNG files allowed");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      window.alert("File must be less than 2MB");
      return;
    }

    setDocumentFile(file);
  };

  // ================= START CAMERA =================
  const startCamera = async () => {
    try {
      setCameraOn(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 200);

    } catch (error) {
      console.error(error);
      window.alert("Unable to access camera.");
    }
  };

  // ================= STOP CAMERA =================
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // ================= CAPTURE SELFIE =================
  const captureSelfie = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;
    if (!video.srcObject) return;

    const context = canvas.getContext("2d");

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    if (!videoWidth || !videoHeight) return;

    const size = 300;
    canvas.width = size;
    canvas.height = size;

    const minSide = Math.min(videoWidth, videoHeight);
    const sx = (videoWidth - minSide) / 2;
    const sy = (videoHeight - minSide) / 2;

    context.drawImage(
      video,
      sx,
      sy,
      minSide,
      minSide,
      0,
      0,
      size,
      size
    );

    const imageData = canvas.toDataURL("image/png");

    setSelfie(imageData);

    stopCamera();
    setCameraOn(false);
  };

  // ================= HANDLE SELFIE BUTTON =================
  const handleSelfieOption = () => {
    const choice = window.confirm(
      "Press OK to open Camera\nPress Cancel to Upload Image"
    );

    if (choice) {
      startCamera();
    } else {
      if (selfieInputRef.current) {
        selfieInputRef.current.click();
      }
    }
  };

  // ================= HANDLE SELFIE UPLOAD =================
  const handleSelfieUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const allowedTypes = ["image/jpeg", "image/png"];

  // File type validation
  if (!allowedTypes.includes(file.type)) {
    window.alert("Only JPG or PNG images allowed");
    return;
  }

  // File size validation (2MB)
  if (file.size > 2 * 1024 * 1024) {
    window.alert("Selfie must be less than 2MB");
    return;
  }

  const reader = new FileReader();
  reader.onloadend = () => {
    setSelfie(reader.result);
  };
  reader.readAsDataURL(file);
};

  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // ================= FINAL SUBMIT =================
  const handleFinalSubmit = async () => {
    if (!govIdType) {
  alert("Select Government ID Type");
  return;
}

if (!govIdNumber) {
  alert("Enter Government ID Number");
  return;
}

if (govIdType === "aadhaar" && govIdNumber.length !== 12) {
  alert("Aadhaar must be 12 digits");
  return;
}

if (govIdType === "pan" && govIdNumber.length !== 10) {
  alert("PAN must be 10 characters");
  return;
}
  if (!documentFile || !selfie) {
    window.alert("Upload document and capture selfie");
    return;
  }

  setLoading(true);
  setStatus("Pending");

  try {
    let progressValue = 0;

    const interval = setInterval(() => {
      progressValue += 20;
      setProgress(progressValue);

      if (progressValue === 100) {
        clearInterval(interval);

        setTimeout(async () => {
  if (otpVerified) {

  const response = await saveKYC({
  govId: govIdNumber,
});

const backendStatus = response.status;
setStatus(backendStatus);
localStorage.setItem("kycStatus", backendStatus);

  if (backendStatus === "Approved") {
  navigate("/verification-result");   // or /dashboard
} else if (backendStatus === "Pending") {
  // stay here
  console.log("KYC is pending...");
} else {
  console.log("KYC rejected");
}

// Store data for next screen
localStorage.setItem("kycResult", JSON.stringify({
  status: "verified",
  faceMatchScore: 85,
  liveness: true,
  selfie: selfie,
  ocrData: {
    name: "Vimalashwari",
    idNumber: govIdNumber,
  },
}));

} else {

  setStatus("Rejected");

  // ✅ ADD THIS LINE (IMPORTANT)
  localStorage.setItem("kycStatus", "Rejected");
}
  setLoading(false);
}, 500);
      }
    }, 300);

  } catch (error) {
    window.alert(error.message || "KYC submission failed");
    setStatus("Rejected");
    setLoading(false);
  }
};

const getStatusColor = () => {
  if (status === "Approved") return "green";
  if (status === "Rejected") return "red";
  if (status === "Pending") return "orange";
  return "black";
};

 return (
  <BackgroundWrapper>
  <AppLayout>
     <div style={styles.wrapper}>
    <div style={styles.card}>

      <h2 style={styles.title}>KYC Verification</h2>

      {/* Message */}
      {message && (
  <p style={{ color: "green", marginBottom: 10, fontWeight: "bold" }}>
    {message}
  </p>
)}

{errorMessage && (
  <p style={{ color: "red", marginBottom: 10, fontWeight: "bold" }}>
    {errorMessage}
  </p>
)}

      {/* ID TYPE */}
      <select
        value={govIdType}
        onChange={(e) => {
          setGovIdType(e.target.value);
          setGovIdNumber("");
        }}
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 10,
          marginBottom: 10,
          background: "rgba(255,255,255,0.6)",
          border: "none",
        }}
      >
        <option value="">Select Government ID Type</option>
        <option value="aadhaar">Aadhaar</option>
        <option value="pan">PAN</option>
        <option value="voter">Voter ID</option>
      </select>

      {/* ID INPUT */}
      <input
        type="text"
        placeholder="Enter ID Number"
        value={govIdNumber}
        onChange={(e) => handleGovIdChange(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 10,
          border: govIdError
            ? "1px solid red"
            : "none",
          background: "rgba(255,255,255,0.6)",
          marginBottom: 10,
        }}
      />
      <input
         type="file"
         accept="image/jpeg,image/png"
         ref={selfieInputRef}
         onChange={handleSelfieUpload}
         style={{ display: "none" }}
       />

      {govIdError && (
        <p style={{ color: "red", fontSize: 12 }}>
          {govIdError}
        </p>
      )}

      {/* OTP */}
      {!otpSent && (
        <button className="btn" onClick={handleGenerateOTP}>
          Generate OTP
        </button>
      )}

      {otpSent && !otpVerified && (
        <>
          <input
            type="number"
            placeholder="Enter OTP"
            value={enteredOtp}
            onChange={(e) => {
  setEnteredOtp(e.target.value);
  setErrorMessage(""); // clear error while typing
}}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 10,
              background: "rgba(255,255,255,0.6)",
              border: "none",
              marginBottom: 10,
            }}
          />

          <button className="btn" onClick={handleVerifyOtp}>
            Verify OTP
          </button>
        </>
      )}

      {/* AFTER OTP */}
      {otpVerified && (
        <>
          {/* Upload */}
          <label style={styles.primaryBtn}>
            {documentFile ? "Change Document" : "Upload Document"}
            <input
              type="file"
              accept=".pdf,image/jpeg,image/png"
              onChange={pickDocument}
              style={{ display: "none" }}
            />
          </label>

          {documentFile && <p>{documentFile.name}</p>}

          {/* SELFIE */}
          {!cameraOn && !selfie && (
            <button style={styles.primaryBtn} onClick={handleSelfieOption}>
  Capture Selfie
</button>
          )}

          {cameraOn && (
            <>
              <video
                ref={videoRef}
                autoPlay
                style={{ width: "100%", borderRadius: 10 }}
              />
              <button style={styles.primaryBtn} onClick={captureSelfie}>
  Capture Now
</button>
            </>
          )}

          <canvas ref={canvasRef} style={{ display: "none" }} />

          {selfie && (
            <>
              <img
                src={selfie}
                alt="Selfie"
                style={{
                  width: 120,
                  borderRadius: "50%",
                  marginTop: 10,
                }}
              />
              <button style={styles.secondaryBtn} onClick={() => setSelfie(null)}>
  Retake
</button>
            </>
          )}

          <button
  style={styles.submitBtn}
  onClick={handleFinalSubmit}
  disabled={loading}
>
  {loading ? "Processing..." : "🚀 Submit KYC"}
</button>
        </>
      )}

      {/* LOADING */}
      {loading && <p>Uploading... {progress}%</p>}

      {/* STATUS */}
      {status && (
        <p
          style={{
            fontWeight: "bold",
            marginTop: 10,
            color: getStatusColor(),
          }}
        >
          KYC Status: {status}
        </p>
      )}

      </div>
  </div>
    </AppLayout>
  </BackgroundWrapper>
  );
}
const styles = {
  wrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "80vh",
  },

  card: {
    width: "100%",
    maxWidth: "420px",
    padding: "20px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.9)",
    boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
  },

  title: {
    textAlign: "center",
    marginBottom: 20,
    fontSize: 22,
    fontWeight: "bold",
  },

  primaryBtn: {
    width: "100%",
    padding: "12px",
    marginBottom: "10px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "16px",        
    lineHeight: "20px",
    color: "#fff",
    background: "linear-gradient(135deg, #43e97b, #38f9d7)",
    boxSizing: "border-box", 
  display: "block",        
  textAlign: "center", 
  },

  secondaryBtn: {
    width: "100%",
    padding: "12px",
    marginBottom: "10px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    cursor: "pointer",
    fontWeight: "bold",
    background: "#fff",
    color: "#333",
    boxSizing: "border-box", 
  display: "block",        
  textAlign: "center", 
  },

  submitBtn: {
    width: "100%",
    padding: "14px",
    marginTop: "10px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "20px",
    color: "#fff",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
    boxSizing: "border-box", 
  display: "block",        
  textAlign: "center", 
  },
};