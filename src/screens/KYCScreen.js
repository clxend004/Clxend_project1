import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function KYCScreen() {
  const navigate = useNavigate();

  const [govId, setGovId] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [documentFile, setDocumentFile] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);

  const [message, setMessage] = useState(""); // ⭐ added for temporary messages

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const selfieInputRef = useRef(null);

  // ================= OTP GENERATION =================
  const handleGenerateOtp = () => {
    if (!govId) {
      setMessage("Please enter Aadhaar / PAN number");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(otp);
    setOtpSent(true);

    console.log("Generated OTP:", otp);

    setMessage("OTP generated! Check console.");
    setTimeout(() => setMessage(""), 3000);
  };

  // ================= OTP VERIFY =================
  const handleVerifyOtp = () => {
    if (enteredOtp === generatedOtp) {
      setOtpVerified(true);

      setMessage("OTP Verified Successfully");
      setTimeout(() => setMessage(""), 3000);

    } else {
      setMessage("Invalid OTP");
      setTimeout(() => setMessage(""), 3000);
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
  const handleFinalSubmit = () => {
    if (!documentFile || !selfie) {
      window.alert("Upload document and capture selfie");
      return;
    }

    setLoading(true);
    setStatus("Pending");

    setTimeout(() => {
      const finalStatus = "Approved";
      setStatus(finalStatus);
      setLoading(false);
    }, 3000);
  };

  const getStatusColor = () => {
    if (status === "Approved") return "green";
    if (status === "Rejected") return "red";
    if (status === "Pending") return "orange";
    return "black";
  };

  return (
    <div
      style={{
        padding: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#fff",
      }}
    >
      <h2 style={{ marginBottom: 20 }}>KYC Verification</h2>

      {/* ⭐ Temporary Message */}
      {message && (
        <p
          style={{
            marginBottom: 10,
            fontWeight: "bold",
          }}
        >
          {message}
        </p>
      )}

      <input
        type="text"
        placeholder="Enter Aadhaar / PAN"
        value={govId}
        onChange={(e) => setGovId(e.target.value)}
        style={{
          width: "85%",
          padding: 10,
          borderRadius: 8,
          border: "1px solid #ccc",
          marginBottom: 10,
        }}
      />

      {!otpSent && (
        <button
          onClick={handleGenerateOtp}
          style={{
            width: "85%",
            padding: 12,
            borderRadius: 8,
            backgroundColor: "#4CAF50",
            color: "#fff",
            fontWeight: "bold",
            fontSize: 16,
            cursor: "pointer",
            marginBottom: 10,
          }}
        >
          Generate OTP
        </button>
      )}

      {otpSent && !otpVerified && (
        <>
          <input
            type="number"
            placeholder="Enter OTP"
            value={enteredOtp}
            onChange={(e) => setEnteredOtp(e.target.value)}
            style={{
              width: "85%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
              marginBottom: 10,
            }}
          />
          <button
            onClick={handleVerifyOtp}
            style={{
              width: "85%",
              padding: 12,
              borderRadius: 8,
              backgroundColor: "#4CAF50",
              color: "#fff",
              fontWeight: "bold",
              fontSize: 16,
              cursor: "pointer",
              marginBottom: 10,
            }}
          >
            Verify OTP
          </button>
        </>
      )}

      {otpVerified && (
        <>
          <label
            style={{
              width: "85%",
              display: "block",
              marginBottom: 10,
              cursor: "pointer",
              textAlign: "center",
              backgroundColor: "#4CAF50",
              padding: 12,
              color: "#fff",
              borderRadius: 8,
              fontWeight: "bold",
            }}
          >
            {documentFile ? "Change Document" : "Upload ID Document"}
            <input
              type="file"
              accept=".pdf,image/jpeg,image/png"
              onChange={pickDocument}
              style={{ display: "none" }}
            />
          </label>

          {documentFile && (
            <p style={{ marginBottom: 10 }}>
              Uploaded: {documentFile.name}
            </p>
          )}

          {!cameraOn && !selfie && (
            <>
              <button
                onClick={handleSelfieOption}
                style={{
                  width: "85%",
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: "#4CAF50",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 16,
                  cursor: "pointer",
                  marginBottom: 10,
                }}
              >
                Capture Selfie
              </button>

              <input
                ref={selfieInputRef}
                type="file"
                accept="image/*"
                onChange={handleSelfieUpload}
                style={{ display: "none" }}
              />
            </>
          )}

          {cameraOn && (
            <>
              <div
                style={{
                  width: 150,
                  height: 150,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid #4CAF50",
                  marginTop: 15,
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>

              <button
                onClick={captureSelfie}
                style={{
                  width: "85%",
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: "#4CAF50",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 16,
                  cursor: "pointer",
                  marginTop: 10,
                }}
              >
                Capture Now
              </button>
            </>
          )}

          <canvas ref={canvasRef} style={{ display: "none" }} />

          {selfie && !cameraOn && (
            <>
              <img
                src={selfie}
                alt="Selfie"
                style={{
                  width: 150,
                  height: 150,
                  borderRadius: "50%",
                  marginTop: 15,
                  border: "2px solid #4CAF50",
                  objectFit: "cover",
                }}
              />
              <button
                onClick={() => {
                  setSelfie(null);
                }}
                style={{
                  width: "85%",
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: "#4CAF50",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 16,
                  cursor: "pointer",
                  marginTop: 10,
                }}
              >
                Retake Selfie
              </button>
            </>
          )}

          <button
            onClick={handleFinalSubmit}
            style={{
              width: "85%",
              padding: 12,
              borderRadius: 8,
              backgroundColor: "#4CAF50",
              color: "#fff",
              fontWeight: "bold",
              fontSize: 16,
              cursor: "pointer",
              marginTop: 10,
            }}
          >
            Submit KYC
          </button>
        </>
      )}

      {loading && <p style={{ marginTop: 20 }}>Loading...</p>}

      {status && (
        <p
          style={{
            marginTop: 20,
            fontSize: 18,
            fontWeight: "bold",
            color: getStatusColor(),
          }}
        >
          KYC Status: {status}
        </p>
      )}

      {status === "Approved" && (
        <button
          onClick={() => navigate("/wallet")}
          style={{
            width: "85%",
            padding: 12,
            borderRadius: 8,
            backgroundColor: "#4CAF50",
            color: "#fff",
            fontWeight: "bold",
            fontSize: 16,
            cursor: "pointer",
            marginTop: 10,
          }}
        >
          Go to Wallet
        </button>
      )}
    </div>
  );
}