import { useState } from "react";
import { loginUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";

export default function LoginScreen() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [loading, setLoading] = useState(false);

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
    // Clear previous messages
    setErrorMessage("");
    setSuccessMessage("");

    // Validate before API call
    if (!email || !password) {
      setErrorMessage("All fields are required");
      return;
    }

    if (emailError || passwordError) {
      return;
    }

    try {
      setLoading(true);

      const response = await loginUser({ email, password });

      if (response.success) {
        setSuccessMessage(response.message || "Login Successful!");

        setTimeout(() => {
          navigate("/kyc");
        }, 2000);
      } else {
        setErrorMessage(response.message || "Login failed");
      }

    } catch (err) {
      setErrorMessage(err.message || "Username or password is wrong");
    } finally {
      setLoading(false);
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

      {loading && <Loader />}

      {successMessage && (
        <p style={{ color: "green", marginBottom: 15, fontWeight: "bold" }}>
          {successMessage}
        </p>
      )}

      {errorMessage && (
        <p style={{ color: "red", marginBottom: 15, fontWeight: "bold" }}>
          {errorMessage}
        </p>
      )}

      <button
        onClick={handleLogin}
        disabled={loading}
        style={{
          width: "35%",
          padding: 12,
          borderRadius: 8,
          backgroundColor: "#2196F3",
          color: "#fff",
          fontWeight: "bold",
          fontSize: 16,
          cursor: loading ? "not-allowed" : "pointer",
          marginTop: 10,
        }}
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </div>
  );
}