import { useState, useEffect } from "react";
import AppLayout from "../components/AppLayout";
import { loginUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import BackgroundWrapper from "../components/BackgroundWrapper";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase";

export default function LoginScreen() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [loading, setLoading] = useState(false);
  useEffect(() => {
  setPassword("");
}, []);

  // 🔥 OTP STATES
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(30);

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

  // 🔐 NORMAL LOGIN
  const handleLogin = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!email || !password) {
      setErrorMessage("All fields are required");
      return;
    }

    if (emailError || passwordError) return;

    try {
      setLoading(true);

      const response = await loginUser({ email, password });

      console.log("LOGIN RESPONSE FULL:", JSON.stringify(response, null, 2));

      if (response?.success) {

  // ✅ SAVE TOKEN HERE
  localStorage.setItem("token", response.token);
  localStorage.setItem("userEmail", response.user.email);

  setSuccessMessage(response.message || "Login Successful!");

  setEmail("");
  setPassword("");

  setTimeout(() => {
  navigate("/kyc");
}, 1500);
}
 else {
        setErrorMessage(response.message || "Login failed");
      }
    } catch (err) {
      setErrorMessage(err.message || "Username or password is wrong");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 GENERATE OTP
  const generateOtp = (email) => {
    const otpValue = Math.floor(100000 + Math.random() * 900000);

    setGeneratedOtp(otpValue.toString());
    setShowOtpInput(true);
    setOtpValues(["", "", "", "", "", ""]);
    setTimer(30);

    alert(`OTP sent to ${email}: ${otpValue}`);
  };

  // 🔥 GOOGLE LOGIN
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      setEmail(user.email);
      generateOtp(user.email);

    } catch (err) {
      console.error(err);
    }
  };

  // 🔥 OTP INPUT CHANGE
  const handleOtpChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  // 🔥 BACKSPACE SUPPORT
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  // 🔥 VERIFY OTP
  const verifyOtp = () => {
    const enteredOtp = otpValues.join("");

    if (!enteredOtp) {
    setErrorMessage("Enter OTP");
    return;
  }
    if (enteredOtp === generatedOtp) {
      setSuccessMessage("OTP Verified Successfully");
      setTimeout(() => navigate("/kyc"), 1000);
    } else {
      setErrorMessage("Invalid OTP");
    }
  };

  // 🔥 TIMER
  useEffect(() => {
  if (!showOtpInput) return;

  const interval = setInterval(() => {
    setTimer((prev) => {
      if (prev <= 1) {
        clearInterval(interval);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(interval);
}, [showOtpInput]);

  // 🔥 RESEND OTP
  const handleResendOtp = () => {
    generateOtp(email);
  };

  return (
    <BackgroundWrapper>
  <AppLayout>
        <div style={styles.wrapper}>
    <div style={styles.card}>
      <h2 style={styles.title}>Login</h2>

        <CustomInput
          type="email"
          placeholder="Email"
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={handleEmailBlur}
        />

        {emailError && <p style={{ color: "red" }}>{emailError}</p>}

        <CustomInput
          type="password"
          placeholder="Password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={handlePasswordBlur}
        />

        {passwordError && <p style={{ color: "red" }}>{passwordError}</p>}

        {loading && <Loader />}

        {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
        {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}

        <CustomButton
  title="Login"
  onClick={handleLogin}
  disabled={!email || !password}
/>

        <CustomButton 
  title="Continue with Google"
  onClick={handleGoogleLogin}
  style={{ backgroundColor: "#db4437", color: "#fff" }}
/>

        {/* 🔥 NEW OTP UI */}
        {showOtpInput && (
          <div style={{ marginTop: 20, textAlign: "center" }}>
            <p><b>Enter OTP sent to {email}</b></p>

            <div
  style={{
    display: "flex",
    justifyContent: "center",
    gap: "8px", // 🔥 controls spacing between boxes
    marginTop: 10,
  }}
>
  {otpValues.map((digit, index) => (
    <input
      key={index}
      id={`otp-${index}`}
      value={digit}
      onChange={(e) => handleOtpChange(e.target.value, index)}
      onKeyDown={(e) => handleKeyDown(e, index)}
      maxLength={1}
      style={{
        width: 35,        // 🔥 smaller width
        height: 40,       // 🔥 smaller height
        textAlign: "center",
        fontSize: 16,
        borderRadius: 6,
        border: "1px solid #ccc",
        background: "rgba(255,255,255,0.7)",
      }}
    />
  ))}
</div>

            <p style={{ marginTop: 10 }}>
              {timer > 0 ? `Resend OTP in ${timer}s` : "Didn't receive OTP?"}
            </p>

            {timer === 0 && (
              <button onClick={handleResendOtp}>
                Resend OTP
              </button>
            )}

            <CustomButton title="Verify OTP" onClick={verifyOtp} />
          </div>
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
    maxWidth: "380px",
    padding: "25px 20px",
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
};