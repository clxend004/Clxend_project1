import { useState } from "react";
import { loginUser } from "../services/authService";
import { useNavigate } from "react-router-dom";

export default function LoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const validateEmailFormat = (email) => /\S+@\S+\.\S+/.test(email);

  const handleEmailBlur = () => {
    if (!email) {
      setEmailError("Email is required");
    } else if (!validateEmailFormat(email)) {
      setEmailError("Enter valid email");
    } else {
      setEmailError("");
    }
  };

  const handlePasswordBlur = () => {
    if (!password) {
      setPasswordError("Password is required");
    } else {
      setPasswordError("");
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage("All fields are required");
      return;
    }

    try {
      await loginUser({ email, password });

      // ✅ Show success message
      setSuccessMessage("Login Successful!");
      setErrorMessage("");

      // ✅ Navigate after 2 seconds
      setTimeout(() => {
        navigate("/kyc");
      }, 2000);

    } catch (err) {
      setErrorMessage("Username or password is wrong");
      setSuccessMessage("");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: 20,
        backgroundColor: "#ffffff",
      }}
    >
      <h2 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 25 }}>
        Login
      </h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={handleEmailBlur}
        style={{
          width: "40%",
          padding: 10,
          borderRadius: 8,
          border: "1px solid #ccc",
          marginBottom: 5,
        }}
      />
      {emailError && (
        <p style={{ color: "red", width: "40%", marginBottom: 15, fontSize: 14 }}>
          {emailError}
        </p>
      )}

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onBlur={handlePasswordBlur}
        style={{
          width: "40%",
          padding: 10,
          borderRadius: 8,
          border: "1px solid #ccc",
          marginBottom: 5,
        }}
      />
      {passwordError && (
        <p style={{ color: "red", width: "40%", marginBottom: 15, fontSize: 14 }}>
          {passwordError}
        </p>
      )}

      {/* ✅ Success Message */}
      {successMessage && (
        <p style={{ color: "green", marginBottom: 15, fontWeight: "bold" }}>
          {successMessage}
        </p>
      )}

      {/* ❌ Error Message */}
      {errorMessage && (
        <p style={{ color: "red", marginBottom: 15, fontWeight: "bold" }}>
          {errorMessage}
        </p>
      )}

      <button
        onClick={handleLogin}
        style={{
          width: "35%",
          padding: 12,
          borderRadius: 8,
          backgroundColor: "#2196F3",
          color: "#fff",
          fontWeight: "bold",
          fontSize: 16,
          cursor: "pointer",
          marginTop: 10,
        }}
      >
        Login
      </button>
    </div>
  );
}