import { useState, useEffect, useRef } from "react";

import AppLayout from "../components/AppLayout";

import {
  loginUser,
  googleLogin,
  syncKycStatus,
} from "../services/authService";

import { useNavigate } from "react-router-dom";

import Loader from "../components/Loader";

import BackgroundWrapper from "../components/BackgroundWrapper";

import countries from "../constants/countries";

import { getEmailSuggestions } from "../constants/emailDomains";

import ReactCountryFlag from "react-country-flag";

import {
  isPasskeySupported,
  loginWithPasskey,
} from "../services/webauthnService";

import clxendLogo from "../assets/clxend-logo.png";


export default function LoginScreen() {

  const navigate = useNavigate();

  // ================= LOGIN METHOD (EMAIL / MOBILE) =================

  const [method, setMethod] = useState("email"); // "email" | "mobile"

  // ================= PROGRESSIVE STEP =================
  // "identifier" -> email
  // "password"   -> password

  const [step, setStep] = useState("identifier");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");

  const [passwordError, setPasswordError] = useState("");

  const emailRef = useRef(null);

  const passwordRef = useRef(null);

  const [emailSuggestions, setEmailSuggestions] = useState([]);

  const [showPassword, setShowPassword] = useState(false);

  const [capsLockOn, setCapsLockOn] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  const [loading, setLoading] = useState(false);


  // ================= FACE ID / PASSKEY =================

  const [passkeySupported, setPasskeySupported] = useState(false);

  const [passkeyLoading, setPasskeyLoading] = useState(false);


  // ================= FORGOT PASSWORD =================

  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [resetEmail, setResetEmail] = useState("");

  const [resetEmailError, setResetEmailError] = useState("");

  const [resetMessage, setResetMessage] = useState("");

  const [resetLoading, setResetLoading] = useState(false);


  // ================= MOBILE LOGIN =================

  const [selectedCountry, setSelectedCountry] = useState(
    countries[0]
  );

  const [showCountrySelector, setShowCountrySelector] =
    useState(false);

  const [mobile, setMobile] = useState("");

  const [mobileError, setMobileError] = useState("");

  const countrySelectorRef = useRef(null);


  // ================= MOBILE OTP =================
  //
  // IMPORTANT:
  // These states are now ONLY for the existing
  // mobile-login OTP flow.
  //
  // Google login does NOT use this OTP anymore.

  const [generatedOtp, setGeneratedOtp] = useState("");

  const [showOtpInput, setShowOtpInput] = useState(false);

  const [otpValues, setOtpValues] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  const [timer, setTimer] = useState(30);

  const [otpTarget, setOtpTarget] = useState("");


  // ================= CLEAR FIELDS ON PAGE OPEN =================

  useEffect(() => {

    setEmail("");

    setPassword("");

    setEmailError("");

    setPasswordError("");

    setErrorMessage("");

    setSuccessMessage("");

  }, []);


  // ================= FACE ID / PASSKEY SUPPORT CHECK =================

  useEffect(() => {

    let isMounted = true;

    isPasskeySupported().then((supported) => {

      if (isMounted) {
        setPasskeySupported(supported);
      }

    });

    return () => {

      isMounted = false;

    };

  }, []);


  // ================= CLOSE COUNTRY DROPDOWN =================

  useEffect(() => {

    const handleClick = (e) => {

      if (
        countrySelectorRef.current &&
        !countrySelectorRef.current.contains(e.target)
      ) {

        setShowCountrySelector(false);

      }

    };

    document.addEventListener(
      "mousedown",
      handleClick
    );

    return () => {

      document.removeEventListener(
        "mousedown",
        handleClick
      );

    };

  }, []);


  // ================= VALIDATION =================

  const normalizeEmail = (value) =>
    value.trim().toLowerCase();


  const validateEmailFormat = (value) => {

    const normalized = normalizeEmail(value);

    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(
      normalized
    );

  };


  const validateEmail = (value) => {

    const normalizedEmail = normalizeEmail(value);

    if (!normalizedEmail) {
      return "Email address is required";
    }

    if (normalizedEmail.length > 254) {
      return "Email address is too long";
    }

    if (!validateEmailFormat(normalizedEmail)) {
      return "Enter a valid email address";
    }

    return "";

  };


  const validatePassword = (value) => {

    if (!value) {
      return "Password is required";
    }

    if (value.length < 8) {
      return "Password must be at least 8 characters";
    }

    if (value.length > 128) {
      return "Password is too long";
    }

    return "";

  };


  const validateMobile = (value) => {

    const digits = value.replace(/\D/g, "");

    if (!digits) {
      return "Mobile number is required";
    }

    if (
      selectedCountry.minLength &&
      digits.length < selectedCountry.minLength
    ) {

      return `Enter a valid ${selectedCountry.minLength}-digit mobile number`;

    }

    if (
      selectedCountry.maxLength &&
      digits.length > selectedCountry.maxLength
    ) {

      return `Maximum ${selectedCountry.maxLength} digits allowed`;

    }

    if (
      selectedCountry.localPattern &&
      !selectedCountry.localPattern.test(digits)
    ) {

      return "Enter a valid mobile number";

    }

    return "";

  };


  // ================= STEP 1 -> STEP 2 =================

  const handleContinue = () => {

    const currentEmailError =
      validateEmail(email);

    setEmailError(currentEmailError);

    if (currentEmailError) {

      emailRef.current?.focus();

      return;

    }

    setErrorMessage("");

    setEmailSuggestions([]);

    setStep("password");

  };


  const handleBackToIdentifier = () => {

    setStep("identifier");

    setPassword("");

    setPasswordError("");

    setErrorMessage("");

  };


  // ================= NORMAL LOGIN =================

  const handleLogin = async () => {

    setErrorMessage("");

    const normalizedEmail =
      normalizeEmail(email);

    const enteredPassword = password;

    const currentPasswordError =
      validatePassword(enteredPassword);

    setPasswordError(currentPasswordError);

    if (currentPasswordError) {

      passwordRef.current?.focus();

      return;

    }

    try {

      setLoading(true);

      const response = await loginUser({
        email: normalizedEmail,
        password: enteredPassword,
      });

      if (response?.success) {

        localStorage.setItem(
          "token",
          response.token
        );

        localStorage.setItem(
          "userEmail",
          response.user?.email || normalizedEmail
        );

        setSuccessMessage(
          response.message ||
            "Login Successful!"
        );

        setEmail("");

        setPassword("");

        setTimeout(() => {

          navigate("/dashboard");

        }, 1200);

      } else {

        setErrorMessage(
          response?.message ||
            "Login failed"
        );

      }

    } catch (err) {

      console.error(
        "NORMAL LOGIN ERROR:",
        err
      );

      setErrorMessage(
        err?.message ||
          "The email or password is incorrect."
      );

      setSuccessMessage("");

    } finally {

      setLoading(false);

    }

  };


  // =========================================================
  // MOBILE OTP GENERATION
  // =========================================================

  const generateOtp = (target) => {

    const otpValue =
      Math.floor(
        100000 +
        Math.random() * 900000
      );

    setGeneratedOtp(
      otpValue.toString()
    );

    setShowOtpInput(true);

    setOtpTarget(target);

    setOtpValues([
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

    setTimer(30);

    setSuccessMessage(
      "OTP generated successfully."
    );

    console.log(
      "Generated OTP:",
      otpValue
    );

  };


  // =========================================================
  // MOBILE: SEND OTP
  // =========================================================

  const handleSendMobileOtp = () => {

    const currentMobileError =
      validateMobile(mobile);

    setMobileError(
      currentMobileError
    );

    if (currentMobileError) {
      return;
    }

    setErrorMessage("");

    generateOtp(
      `${selectedCountry.dialCode} ${mobile}`
    );

  };


  // =========================================================
  // GOOGLE LOGIN
  // =========================================================
  //
  // CURRENT TEMPORARY FLOW:
  //
  // Google
  //   ↓
  // Firebase
  //   ↓
  // Firebase ID token
  //   ↓
  // /auth/google
  //   ↓
  // Backend verifies Firebase token
  //   ↓
  // VECTRO JWT
  //   ↓
  // KYC status sync
  //   ↓
  // Dashboard
  //
  // IMPORTANT:
  //
  // There is NO Google OTP here.
  //
  // =========================================================

  const handleGoogleLogin = async () => {

    setErrorMessage("");

    setSuccessMessage("");

    try {

      setLoading(true);

      // -----------------------------------------------------
      // googleLogin() now completes the entire Google login.
      //
      // It returns:
      //
      // {
      //   success: true,
      //   token: "...",
      //   user: {...}
      // }
      //
      // -----------------------------------------------------

      const response =
        await googleLogin();

      if (
        !response?.success ||
        !response?.token
      ) {

        throw new Error(
          response?.message ||
            "Google login failed."
        );

      }

      // -----------------------------------------------------
      // JWT has already been saved by authService.js.
      //
      // User information has also been saved.
      // KYC status has already been synchronized.
      // -----------------------------------------------------

      setSuccessMessage(
        response.message ||
          "Google login successful!"
      );

      // -----------------------------------------------------
      // Make sure no mobile OTP state remains active.
      // -----------------------------------------------------

      setShowOtpInput(false);

      setGeneratedOtp("");

      setOtpValues([
        "",
        "",
        "",
        "",
        "",
        "",
      ]);

      setOtpTarget("");

      // -----------------------------------------------------
      // Go to dashboard.
      // -----------------------------------------------------

      setTimeout(() => {

        navigate("/dashboard");

      }, 900);

    } catch (err) {

      console.error(
        "GOOGLE LOGIN ERROR:",
        err
      );

      setErrorMessage(
        err?.message ||
          "Google login failed. Please try again."
      );

      setSuccessMessage("");

    } finally {

      setLoading(false);

    }

  };


  // =========================================================
  // OTP INPUT
  //
  // IMPORTANT:
  // This is now ONLY for mobile OTP.
  // =========================================================

  const handleOtpChange = (
    value,
    index
  ) => {

    if (!/^[0-9]?$/.test(value)) {
      return;
    }

    const newOtp = [
      ...otpValues,
    ];

    newOtp[index] = value;

    setOtpValues(newOtp);

    if (
      value &&
      index < 5
    ) {

      document
        .getElementById(
          `otp-${index + 1}`
        )
        ?.focus();

    }

  };


  const handleKeyDown = (
    e,
    index
  ) => {

    if (
      e.key === "Backspace" &&
      !otpValues[index] &&
      index > 0
    ) {

      document
        .getElementById(
          `otp-${index - 1}`
        )
        ?.focus();

    }

  };


  // =========================================================
  // VERIFY MOBILE OTP
  // =========================================================

  const verifyOtp = async () => {

    const enteredOtp =
      otpValues.join("");

    if (!enteredOtp) {

      setErrorMessage(
        "Enter OTP"
      );

      return;

    }

    if (
      !/^\d{6}$/.test(
        enteredOtp
      )
    ) {

      setErrorMessage(
        "Enter the complete 6-digit OTP"
      );

      return;

    }

    // -------------------------------------------------------
    // MOBILE OTP ONLY
    // -------------------------------------------------------

    if (
      enteredOtp ===
      generatedOtp
    ) {

      setSuccessMessage(
        "OTP Verified Successfully"
      );

      setErrorMessage("");

      setTimeout(() => {

        navigate("/dashboard");

      }, 900);

    } else {

      setErrorMessage(
        "Invalid OTP"
      );

    }

  };


  // =========================================================
  // MOBILE OTP TIMER
  // =========================================================

  useEffect(() => {

    if (!showOtpInput) {
      return;
    }

    const interval =
      setInterval(() => {

        setTimer((prev) => {

          if (prev <= 1) {

            clearInterval(
              interval
            );

            return 0;

          }

          return prev - 1;

        });

      }, 1000);

    return () =>
      clearInterval(interval);

  }, [showOtpInput]);


  // =========================================================
  // RESEND MOBILE OTP
  // =========================================================

  const handleResendOtp = () => {

    setErrorMessage("");

    setSuccessMessage("");

    // -------------------------------------------------------
    // Mobile OTP only.
    //
    // There is no Google OTP resend anymore.
    // -------------------------------------------------------

    generateOtp(
      otpTarget
    );

  };


  // =========================================================
  // BIOMETRIC / PASSKEY LOGIN
  // =========================================================

  const handleBiometricLogin =
    async () => {

      setErrorMessage("");

      setSuccessMessage("");

      setPasskeyLoading(true);

      try {

        // If the user has already typed an email,
        // scope the passkey challenge to that account.
        //
        // Otherwise this relies on discoverable/
        // resident-key credentials.

        const response =
          await loginWithPasskey(
            method === "email" &&
            email
              ? email
              : undefined
          );

        localStorage.setItem(
          "token",
          response.token
        );

        localStorage.setItem(
          "userEmail",
          response.user?.email ||
            email
        );

        await syncKycStatus(
          response.user?.id ||
          response.user?.userId ||
          response.user?._id
        );

        setSuccessMessage(
          response.message
        );

        setTimeout(() => {

          navigate("/dashboard");

        }, 900);

      } catch (err) {

        setErrorMessage(
          err.message ||
            "Passkey login failed. Please try again."
        );

      } finally {

        setPasskeyLoading(false);

      }

    };


  // =========================================================
  // LOGIN METHOD CHANGE
  // =========================================================

  const handleMethodChange = (
    nextMethod
  ) => {

    setMethod(
      nextMethod
    );

    setStep(
      "identifier"
    );

    setShowOtpInput(
      false
    );

    // Clear OTP state.

    setGeneratedOtp("");

    setOtpValues([
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

    setOtpTarget("");

    setTimer(30);

    setErrorMessage("");

    setSuccessMessage("");

    setEmailSuggestions([]);

  };


  const canSubmitReset =
    resetEmail &&
    !resetEmailError;


  return (

    <BackgroundWrapper>

      <AppLayout>

        <div style={styles.page}>

          <div style={styles.authContainer}>

            {/* ================= BRAND ================= */}

            <div style={styles.brand}>

              <div style={styles.logo}>

                <img
                  src={clxendLogo}
                  alt="CLXEND"
                  style={styles.logoImage}
                />

              </div>

              <div style={styles.brandText}>

                <div style={styles.brandName}>
                  CLXEND
                </div>

                <div style={styles.brandSubtitle}>
                  Secure Digital Wallet
                </div>

              </div>

            </div>


            {/* ================= LOGIN CARD ================= */}

            <div style={styles.card}>

              <div style={styles.headingSection}>

                <h1 style={styles.title}>
                  Log in
                </h1>

                <p style={styles.subtitle}>
                  Welcome back to your CLXEND wallet
                </p>

              </div>


              {/* ================= METHOD TABS ================= */}

              {!showOtpInput && (

                <div
                  style={styles.tabs}
                  role="tablist"
                >

                  <button
                    type="button"
                    role="tab"
                    aria-selected={
                      method === "email"
                    }
                    onClick={() =>
                      handleMethodChange(
                        "email"
                      )
                    }
                    style={{
                      ...styles.tab,
                      ...(method === "email"
                        ? styles.tabActive
                        : {}),
                    }}
                  >
                    Email
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={
                      method === "mobile"
                    }
                    onClick={() =>
                      handleMethodChange(
                        "mobile"
                      )
                    }
                    style={{
                      ...styles.tab,
                      ...(method === "mobile"
                        ? styles.tabActive
                        : {}),
                    }}
                  >
                    Mobile
                  </button>

                </div>

              )}


              {/* ================= OTP VERIFICATION VIEW ================= */}

              {showOtpInput ? (

                <div style={styles.otpContainer}>

                  <p style={styles.otpTitle}>
                    Enter verification code
                  </p>

                  <p style={styles.otpSubtitle}>

                    We sent a 6-digit code to{" "}

                    <strong
                      style={{
                        color: "#e5e7eb",
                      }}
                    >
                      {otpTarget}
                    </strong>

                  </p>


                  <div style={styles.otpBoxes}>

                    {otpValues.map(
                      (
                        digit,
                        index
                      ) => (

                        <input
                          key={index}
                          id={`otp-${index}`}
                          value={digit}
                          inputMode="numeric"
                          onChange={(e) =>
                            handleOtpChange(
                              e.target.value,
                              index
                            )
                          }
                          onKeyDown={(e) =>
                            handleKeyDown(
                              e,
                              index
                            )
                          }
                          maxLength={1}
                          style={
                            styles.otpInput
                          }
                        />

                      )
                    )}

                  </div>


                  <p style={styles.timer}>

                    {timer > 0
                      ? `Resend code in ${timer}s`
                      : "Didn't receive the code?"}

                  </p>


                  {timer === 0 && (

                    <button
                      onClick={
                        handleResendOtp
                      }
                      style={
                        styles.resend
                      }
                    >
                      Resend code
                    </button>

                  )}


                  {successMessage && (

                    <p
                      style={
                        styles.success
                      }
                    >
                      ✓ {successMessage}
                    </p>

                  )}


                  {errorMessage && (

                    <div
                      role="alert"
                      style={
                        styles.errorBox
                      }
                    >

                      <span
                        style={
                          styles.errorIcon
                        }
                      >
                        ⚠
                      </span>

                      <span>
                        {errorMessage}
                      </span>

                    </div>

                  )}


                  <button
                    onClick={
                      verifyOtp
                    }
                    style={
                      styles.primaryButton
                    }
                  >
                    Verify &amp; continue
                  </button>


                  <button
                    type="button"
                    onClick={() => {

                      setShowOtpInput(
                        false
                      );

                      setGeneratedOtp("");

                      setOtpValues([
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                      ]);

                      setOtpTarget("");

                      setErrorMessage("");

                      setSuccessMessage("");

                    }}
                    style={
                      styles.backLink
                    }
                  >
                    ← Back
                  </button>

                </div>

              ) : method === "email" ? (

                <>

                  {step === "identifier" ? (

                    /* ================= STEP 1: EMAIL ================= */

                    <>

                      <label style={styles.label}>
                        Email address
                      </label>


                      <div
                        style={{
                          ...styles.inputWrapper,
                          ...(emailError
                            ? styles.inputWrapperError
                            : {}),
                        }}
                      >

                        <span
                          style={
                            styles.inputIcon
                          }
                        >
                          ✉
                        </span>


                        <input
                          ref={emailRef}
                          type="email"
                          name="email"
                          placeholder="you@example.com"
                          autoComplete="username"
                          autoFocus
                          value={email}
                          onChange={(e) => {

                            const value =
                              e.target.value;

                            setEmail(value);

                            setEmailError("");

                            setErrorMessage("");

                            setEmailSuggestions(
                              getEmailSuggestions(
                                value
                              )
                            );

                          }}
                          onBlur={() =>
                            setEmailError(
                              validateEmail(
                                email
                              )
                            )
                          }
                          onKeyDown={(e) => {

                            if (
                              e.key ===
                              "Enter"
                            ) {

                              handleContinue();

                            }

                          }}
                          style={
                            styles.input
                          }
                        />

                      </div>


                      {emailSuggestions.length >
                        0 && (

                        <div
                          style={
                            styles.suggestionBox
                          }
                        >

                          {emailSuggestions.map(
                            (
                              suggestion
                            ) => (

                              <div
                                key={
                                  suggestion
                                }
                                style={
                                  styles.suggestionItem
                                }
                                onMouseDown={() => {

                                  setEmail(
                                    suggestion
                                  );

                                  setEmailSuggestions(
                                    []
                                  );

                                  setEmailError(
                                    ""
                                  );

                                }}
                              >
                                {suggestion}
                              </div>

                            )
                          )}

                        </div>

                      )}


                      {emailError && (

                        <p
                          style={
                            styles.fieldError
                          }
                        >
                          {emailError}
                        </p>

                      )}


                      <button
                        type="button"
                        onClick={
                          handleContinue
                        }
                        style={
                          styles.primaryButton
                        }
                      >
                        Continue
                      </button>


                      {errorMessage && (

                        <div
                          role="alert"
                          style={
                            styles.errorBox
                          }
                        >

                          <span
                            style={
                              styles.errorIcon
                            }
                          >
                            ⚠
                          </span>

                          <span>
                            {errorMessage}
                          </span>

                        </div>

                      )}


                      <div
                        style={
                          styles.dividerContainer
                        }
                      >

                        <div
                          style={
                            styles.line
                          }
                        />

                        <span
                          style={
                            styles.orText
                          }
                        >
                          OR
                        </span>

                        <div
                          style={
                            styles.line
                          }
                        />

                      </div>


                      {/* ================= GOOGLE LOGIN ================= */}

                      <button
                        type="button"
                        onClick={
                          handleGoogleLogin
                        }
                        disabled={
                          loading
                        }
                        style={{
                          ...styles.googleButton,
                          opacity:
                            loading
                              ? 0.7
                              : 1,
                          cursor:
                            loading
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >

                        <span
                          style={
                            styles.googleIcon
                          }
                        >
                          G
                        </span>

                        {loading
                          ? "Signing in with Google…"
                          : "Continue with Google"}

                      </button>


                      {passkeySupported && (

                        <>

                          <button
                            type="button"
                            onClick={
                              handleBiometricLogin
                            }
                            disabled={
                              passkeyLoading ||
                              loading
                            }
                            style={{
                              ...styles.biometricButton,
                              opacity:
                                passkeyLoading ||
                                loading
                                  ? 0.7
                                  : 1,
                              cursor:
                                passkeyLoading ||
                                loading
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >

                            <span
                              style={
                                styles.biometricIcon
                              }
                            >
                              🔐
                            </span>

                            {passkeyLoading
                              ? "Waiting for Face ID / Passkey…"
                              : "Continue with Face ID / Passkey"}

                          </button>


                          <p
                            style={
                              styles.biometricInfo
                            }
                          >
                            Use fingerprint, Face ID or device passkey
                          </p>

                        </>

                      )}

                    </>

                  ) : (

                    /* ================= STEP 2: PASSWORD ================= */

                    <>

                      <div
                        style={
                          styles.identifierChip
                        }
                      >

                        <span
                          style={
                            styles.identifierChipIcon
                          }
                        >
                          ✉
                        </span>

                        <span
                          style={
                            styles.identifierChipText
                          }
                        >
                          {email}
                        </span>

                        <button
                          type="button"
                          onClick={
                            handleBackToIdentifier
                          }
                          style={
                            styles.changeLink
                          }
                        >
                          Change
                        </button>

                      </div>


                      <label style={styles.label}>
                        Password
                      </label>


                      <div
                        style={{
                          ...styles.inputWrapper,
                          ...(passwordError
                            ? styles.inputWrapperError
                            : {}),
                        }}
                      >

                        <span
                          style={
                            styles.inputIcon
                          }
                        >
                          🔒
                        </span>


                        <input
                          ref={passwordRef}
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          name="password"
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          autoFocus
                          value={password}
                          onChange={(e) => {

                            setPassword(
                              e.target.value
                            );

                            setErrorMessage("");

                          }}
                          onKeyDown={(e) => {

                            setCapsLockOn(
                              e.getModifierState(
                                "CapsLock"
                              )
                            );

                            if (
                              e.key ===
                              "Enter"
                            ) {

                              handleLogin();

                            }

                          }}
                          style={
                            styles.input
                          }
                        />


                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              (prev) =>
                                !prev
                            )
                          }
                          style={
                            styles.eyeButton
                          }
                          aria-label={
                            showPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showPassword
                            ? "🙈"
                            : "👁"}
                        </button>

                      </div>


                      {passwordError && (

                        <p
                          style={
                            styles.fieldError
                          }
                        >
                          {passwordError}
                        </p>

                      )}


                      {capsLockOn && (

                        <p
                          style={
                            styles.capsLockWarning
                          }
                        >
                          ⚠ Caps Lock is on
                        </p>

                      )}


                      <div
                        style={
                          styles.forgotRow
                        }
                      >

                        <span
                          style={
                            styles.forgot
                          }
                          onClick={() => {

                            setShowForgotPassword(
                              true
                            );

                            setResetEmail(
                              email
                            );

                            setResetEmailError(
                              ""
                            );

                            setResetMessage(
                              ""
                            );

                            setErrorMessage(
                              ""
                            );

                          }}
                        >
                          Forgot password?
                        </span>

                      </div>


                      <button
                        type="button"
                        onClick={
                          handleLogin
                        }
                        disabled={
                          loading
                        }
                        style={{
                          ...styles.primaryButton,
                          opacity:
                            loading
                              ? 0.7
                              : 1,
                          cursor:
                            loading
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >

                        {loading
                          ? "Signing in…"
                          : "Sign in"}

                      </button>


                      {loading && (

                        <div
                          style={
                            styles.loader
                          }
                        >
                          <Loader />
                        </div>

                      )}


                      {successMessage && (

                        <p
                          style={
                            styles.success
                          }
                        >
                          ✓ {successMessage}
                        </p>

                      )}


                      {errorMessage && (

                        <div
                          role="alert"
                          style={
                            styles.errorBox
                          }
                        >

                          <span
                            style={
                              styles.errorIcon
                            }
                          >
                            ⚠
                          </span>

                          <span>
                            {errorMessage}
                          </span>

                        </div>

                      )}

                    </>

                  )}

                </>

              ) : (

                /* ================= MOBILE TAB ================= */

                <>

                  <label style={styles.label}>
                    Mobile number
                  </label>


                  <div
                    style={{
                      ...styles.inputWrapper,
                      ...styles.mobileWrapper,
                      ...(mobileError
                        ? styles.inputWrapperError
                        : {}),
                    }}
                  >

                    <div
                      ref={
                        countrySelectorRef
                      }
                      style={
                        styles.countrySelectorAnchor
                      }
                    >

                      <button
                        type="button"
                        onClick={() =>
                          setShowCountrySelector(
                            (prev) =>
                              !prev
                          )
                        }
                        style={
                          styles.countryTrigger
                        }
                      >

                        <ReactCountryFlag
                          countryCode={
                            selectedCountry.code
                          }
                          svg
                          style={
                            styles.flagIcon
                          }
                          aria-label={
                            selectedCountry.code
                          }
                        />

                        {
                          selectedCountry.dialCode
                        }

                        <span
                          style={
                            styles.countryCaret
                          }
                        >
                          ▾
                        </span>

                      </button>


                      {showCountrySelector && (

                        <div
                          style={
                            styles.countryDropdown
                          }
                        >

                          {countries.map(
                            (c) => (

                              <button
                                key={c.code}
                                type="button"
                                onClick={() => {

                                  setSelectedCountry(
                                    c
                                  );

                                  setShowCountrySelector(
                                    false
                                  );

                                  setMobile("");

                                  setMobileError(
                                    ""
                                  );

                                }}
                                style={
                                  styles.countryOption
                                }
                              >

                                <span
                                  style={
                                    styles.countryOptionLeft
                                  }
                                >

                                  <ReactCountryFlag
                                    countryCode={
                                      c.code
                                    }
                                    svg
                                    style={
                                      styles.flagIconSmall
                                    }
                                    aria-label={
                                      c.code
                                    }
                                  />

                                  <span
                                    style={
                                      styles.countryOptionName
                                    }
                                  >
                                    {c.name}
                                  </span>

                                </span>


                                <span
                                  style={
                                    styles.countryOptionDial
                                  }
                                >
                                  {c.dialCode}
                                </span>

                              </button>

                            )
                          )}

                        </div>

                      )}

                    </div>


                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="Mobile number"
                      autoFocus
                      value={mobile}
                      onChange={(e) => {

                        const digits =
                          e.target.value
                            .replace(
                              /\D/g,
                              ""
                            )
                            .slice(
                              0,
                              selectedCountry.maxLength ||
                                15
                            );

                        setMobile(
                          digits
                        );

                        setMobileError("");

                        setErrorMessage("");

                      }}
                      onBlur={() =>
                        setMobileError(
                          validateMobile(
                            mobile
                          )
                        )
                      }
                      onKeyDown={(e) => {

                        if (
                          e.key ===
                          "Enter"
                        ) {

                          handleSendMobileOtp();

                        }

                      }}
                      style={
                        styles.mobileInput
                      }
                    />

                  </div>


                  {mobileError && (

                    <p
                      style={
                        styles.fieldError
                      }
                    >
                      {mobileError}
                    </p>

                  )}


                  <button
                    type="button"
                    onClick={
                      handleSendMobileOtp
                    }
                    style={
                      styles.primaryButton
                    }
                  >
                    Send OTP
                  </button>


                  {errorMessage && (

                    <div
                      role="alert"
                      style={
                        styles.errorBox
                      }
                    >

                      <span
                        style={
                          styles.errorIcon
                        }
                      >
                        ⚠
                      </span>

                      <span>
                        {errorMessage}
                      </span>

                    </div>

                  )}

                </>

              )}


              {/* ================= REGISTER ================= */}

              {!showOtpInput && (

                <div
                  style={
                    styles.registerRow
                  }
                >

                  <span
                    style={
                      styles.registerText
                    }
                  >
                    Don't have an account?
                  </span>

                  <span
                    style={
                      styles.registerLink
                    }
                    onClick={() =>
                      navigate(
                        "/register"
                      )
                    }
                  >
                    Create account
                  </span>

                </div>

              )}

            </div>


            {/* ================= FORGOT PASSWORD MODAL ================= */}

            {showForgotPassword && (

              <div
                style={
                  styles.resetOverlay
                }
              >

                <div
                  style={
                    styles.resetCard
                  }
                >

                  <div
                    style={
                      styles.resetHeader
                    }
                  >

                    <h2
                      style={
                        styles.resetTitle
                      }
                    >
                      Reset password
                    </h2>

                    <button
                      type="button"
                      onClick={() =>
                        setShowForgotPassword(
                          false
                        )
                      }
                      style={
                        styles.closeButton
                      }
                    >
                      ×
                    </button>

                  </div>


                  <p
                    style={
                      styles.resetSubtitle
                    }
                  >
                    Enter your registered email address. We'll send you a
                    verification code to reset your password.
                  </p>


                  <label style={styles.label}>
                    Email address
                  </label>


                  <div
                    style={
                      styles.inputWrapper
                    }
                  >

                    <span
                      style={
                        styles.inputIcon
                      }
                    >
                      ✉
                    </span>

                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(e) => {

                        setResetEmail(
                          e.target.value
                        );

                        setResetEmailError("");

                        setResetMessage("");

                      }}
                      style={
                        styles.input
                      }
                    />

                  </div>


                  {resetEmailError && (

                    <p
                      style={
                        styles.fieldError
                      }
                    >
                      {resetEmailError}
                    </p>

                  )}


                  {resetMessage && (

                    <p
                      style={
                        styles.success
                      }
                    >
                      ✓ {resetMessage}
                    </p>

                  )}


                  <button
                    type="button"
                    disabled={
                      resetLoading ||
                      !canSubmitReset
                    }
                    onClick={async () => {

                      const normalizedEmail =
                        resetEmail
                          .trim()
                          .toLowerCase();

                      if (!normalizedEmail) {

                        setResetEmailError(
                          "Email address is required"
                        );

                        return;

                      }

                      if (
                        !validateEmailFormat(
                          normalizedEmail
                        )
                      ) {

                        setResetEmailError(
                          "Enter a valid email address"
                        );

                        return;

                      }

                      try {

                        setResetLoading(
                          true
                        );

                        setResetEmailError(
                          ""
                        );

                        setResetMessage(
                          ""
                        );

                        // Temporary frontend simulation.
                        // FastAPI reset API will be connected here.

                        await new Promise(
                          (resolve) =>
                            setTimeout(
                              resolve,
                              1000
                            )
                        );

                        setResetMessage(
                          "If this email is registered, a reset code will be sent."
                        );

                      } catch (error) {

                        setResetEmailError(
                          "Unable to process your request. Please try again."
                        );

                      } finally {

                        setResetLoading(
                          false
                        );

                      }

                    }}
                    style={{
                      ...styles.primaryButton,
                      opacity:
                        resetLoading
                          ? 0.7
                          : 1,
                    }}
                  >

                    {resetLoading
                      ? "Sending…"
                      : "Send reset code"}

                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      setShowForgotPassword(
                        false
                      )
                    }
                    style={
                      styles.backButton
                    }
                  >
                    Back to login
                  </button>

                </div>

              </div>

            )}


            {/* ================= SECURITY FOOTER ================= */}

            <div
              style={
                styles.securityFooter
              }
            >
              🔒 Your account is protected with secure authentication
            </div>

          </div>

        </div>

      </AppLayout>

    </BackgroundWrapper>

  );

}


/* =========================================================
   DESIGN TOKENS
========================================================= */

const colors = {

  cardBg:
    "rgba(15, 20, 33, 0.72)",

  cardBorder:
    "rgba(148,163,184,0.12)",

  inputBg:
    "#0b1120",

  inputBorder:
    "rgba(148,163,184,0.18)",

  inputBorderFocus:
    "#3b82f6",

  textPrimary:
    "#f8fafc",

  textSecondary:
    "#94a3b8",

  textMuted:
    "#64748b",

  accentFrom:
    "#8b5cf6",

  accentTo:
    "#2563eb",

  error:
    "#f87171",

  success:
    "#34d399",

};


const styles = {

  page: {

    minHeight: "90vh",

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    padding: "30px 20px",

    background:
      "radial-gradient(circle at top, #172554 0%, #0b1120 45%, #050816 100%)",

    color:
      colors.textPrimary,

    borderRadius: 20,

  },


  authContainer: {

    width: "100%",

    maxWidth: "440px",

  },


  brand: {

    width: "100%",

    display: "flex",

    alignItems: "center",

    gap: 12,

    marginBottom: 22,

  },


  brandText: {

    display: "flex",

    flexDirection: "column",

  },


  logo: {

    width: 44,

    height: 44,

    borderRadius: 12,

    display: "flex",

    justifyContent: "center",

    alignItems: "center",

    overflow: "hidden",

    background: "#ffffff",

    boxShadow:
      "0 8px 25px rgba(59,130,246,0.35)",

  },


  logoImage: {

    width: "100%",

    height: "100%",

    objectFit: "contain",

    display: "block",

  },


  brandName: {

    fontSize: 18,

    fontWeight: 800,

    letterSpacing: 1.2,

  },


  brandSubtitle: {

    fontSize: 11,

    color: colors.textMuted,

    marginTop: 1,

  },


  card: {

    width: "100%",

    padding: "28px 26px",

    borderRadius: 20,

    background:
      colors.cardBg,

    border:
      `1px solid ${colors.cardBorder}`,

    backdropFilter:
      "blur(20px)",

    WebkitBackdropFilter:
      "blur(20px)",

    boxSizing:
      "border-box",

    boxShadow:
      "0 20px 60px rgba(0,0,0,0.35)",

  },


  headingSection: {

    marginBottom: 20,

  },


  title: {

    fontSize: 24,

    fontWeight: 800,

    margin: 0,

    letterSpacing: -0.3,

  },


  subtitle: {

    fontSize: 13,

    color:
      colors.textSecondary,

    marginTop: 6,

  },


  // ================= TABS =================

  tabs: {

    display: "flex",

    gap: 4,

    padding: 4,

    marginBottom: 20,

    borderRadius: 12,

    background:
      "rgba(255,255,255,0.04)",

    border:
      `1px solid ${colors.cardBorder}`,

  },


  tab: {

    flex: 1,

    padding: "9px 0",

    borderRadius: 9,

    border: "none",

    background: "transparent",

    color:
      colors.textSecondary,

    fontSize: 13,

    fontWeight: 700,

    cursor: "pointer",

    transition: "0.2s",

  },


  tabActive: {

    background:
      `linear-gradient(135deg, ${colors.accentFrom}, ${colors.accentTo})`,

    color: "#ffffff",

    boxShadow:
      "0 6px 16px rgba(37,99,235,0.35)",

  },


  // ================= IDENTIFIER CHIP =================

  identifierChip: {

    display: "flex",

    alignItems: "center",

    gap: 10,

    padding: "10px 14px",

    marginBottom: 18,

    borderRadius: 11,

    background:
      "rgba(255,255,255,0.04)",

    border:
      `1px solid ${colors.cardBorder}`,

  },


  identifierChipIcon: {

    fontSize: 14,

    color:
      colors.textMuted,

  },


  identifierChipText: {

    flex: 1,

    fontSize: 13,

    fontWeight: 600,

    color:
      colors.textPrimary,

    overflow: "hidden",

    textOverflow:
      "ellipsis",

    whiteSpace:
      "nowrap",

  },


  changeLink: {

    background:
      "transparent",

    border:
      "none",

    color:
      "#60a5fa",

    fontSize: 12,

    fontWeight: 700,

    cursor:
      "pointer",

    padding: 0,

  },


  label: {

    display: "block",

    fontSize: 12,

    fontWeight: 700,

    color:
      colors.textSecondary,

    marginBottom: 6,

    marginTop: 14,

  },


  inputWrapper: {

    display: "flex",

    alignItems: "center",

    gap: 10,

    padding: "0 14px",

    borderRadius: 11,

    border:
      `1px solid ${colors.inputBorder}`,

    background:
      colors.inputBg,

    transition: "0.2s",

  },


  inputWrapperError: {

    borderColor:
      colors.error,

  },


  inputIcon: {

    fontSize: 14,

    color:
      colors.textMuted,

  },


  input: {

    flex: 1,

    height: 50,

    border: "none",

    outline: "none",

    background: "transparent",

    color:
      colors.textPrimary,

    fontSize: 14,

  },


  eyeButton: {

    background:
      "transparent",

    border:
      "none",

    cursor:
      "pointer",

    fontSize: 15,

    color:
      colors.textMuted,

    padding: 4,

  },


  fieldError: {

    color:
      colors.error,

    fontSize: 12,

    marginTop: 6,

    marginBottom: 0,

  },


  suggestionBox: {

    background:
      "#0b1220",

    border:
      `1px solid ${colors.inputBorder}`,

    borderRadius: 9,

    marginTop: 4,

    overflow: "hidden",

    position: "relative",

    zIndex: 10,

    boxShadow:
      "0 10px 25px rgba(0,0,0,0.25)",

  },


  suggestionItem: {

    padding: "9px 11px",

    fontSize: 12,

    color:
      "#e2e8f0",

    cursor:
      "pointer",

    borderBottom:
      "1px solid rgba(148,163,184,0.07)",

    transition:
      "background 0.15s ease",

  },


  capsLockWarning: {

    color:
      "#fbbf24",

    fontSize: 12,

    marginTop: 6,

  },


  forgotRow: {

    display: "flex",

    justifyContent:
      "flex-end",

    marginTop: 10,

  },


  forgot: {

    fontSize: 12,

    fontWeight: 700,

    color:
      "#60a5fa",

    cursor:
      "pointer",

  },


  primaryButton: {

    width: "100%",

    height: 50,

    marginTop: 18,

    borderRadius: 11,

    border: "none",

    background:
      `linear-gradient(135deg, ${colors.accentFrom}, ${colors.accentTo})`,

    color:
      "#ffffff",

    fontWeight: 700,

    fontSize: 15,

    cursor:
      "pointer",

    boxShadow:
      "0 10px 25px rgba(59,130,246,0.25)",

    transition:
      "0.2s",

  },


  loader: {

    display: "flex",

    justifyContent:
      "center",

    marginTop: 14,

  },


  success: {

    color:
      colors.success,

    fontSize: 13,

    fontWeight: 600,

    marginTop: 14,

    textAlign:
      "center",

  },


  errorBox: {

    display: "flex",

    alignItems: "center",

    gap: 8,

    marginTop: 14,

    padding: "10px 12px",

    borderRadius: 10,

    background:
      "rgba(248,113,113,0.08)",

    border:
      "1px solid rgba(248,113,113,0.25)",

    color:
      colors.error,

    fontSize: 13,

  },


  errorIcon: {

    fontSize: 14,

  },


  dividerContainer: {

    display: "flex",

    alignItems: "center",

    gap: 10,

    margin: "20px 0",

  },


  line: {

    flex: 1,

    height: 1,

    background:
      colors.cardBorder,

  },


  orText: {

    fontSize: 11,

    fontWeight: 700,

    color:
      colors.textMuted,

    letterSpacing: 1,

  },


  googleButton: {

    width: "100%",

    height: 48,

    borderRadius: 11,

    border:
      `1px solid ${colors.inputBorder}`,

    background:
      "#ffffff",

    color:
      "#111827",

    fontWeight: 700,

    fontSize: 14,

    cursor:
      "pointer",

    display: "flex",

    alignItems: "center",

    justifyContent:
      "center",

    gap: 10,

    marginBottom: 10,

  },


  googleIcon: {

    color:
      "#2563eb",

    fontWeight: 900,

    fontSize: 15,

  },


  biometricButton: {

    width: "100%",

    height: 48,

    borderRadius: 11,

    border:
      `1px solid rgba(139,92,246,0.25)`,

    background:
      "rgba(139,92,246,0.08)",

    color:
      "#c4b5fd",

    fontWeight: 700,

    fontSize: 14,

    cursor:
      "pointer",

    display: "flex",

    alignItems: "center",

    justifyContent:
      "center",

    gap: 10,

  },


  biometricIcon: {

    fontSize: 14,

  },


  biometricInfo: {

    fontSize: 11,

    color:
      colors.textMuted,

    textAlign:
      "center",

    marginTop: 8,

  },


  // ================= MOBILE TAB =================

  mobileWrapper: {

    padding:
      "0 6px 0 0",

    position:
      "relative",

  },


  countrySelectorAnchor: {

    position:
      "relative",

  },


  countryTrigger: {

    height: 50,

    display: "flex",

    alignItems: "center",

    gap: 6,

    padding:
      "0 10px 0 14px",

    border: "none",

    borderRight:
      `1px solid ${colors.inputBorder}`,

    background:
      "transparent",

    color:
      colors.textPrimary,

    fontSize: 14,

    fontWeight: 700,

    cursor:
      "pointer",

    whiteSpace:
      "nowrap",

  },


  flagIcon: {

    width: 18,

    height: 18,

    borderRadius:
      "50%",

    objectFit:
      "cover",

    display:
      "block",

  },


  flagIconSmall: {

    width: 16,

    height: 16,

    borderRadius:
      "50%",

    objectFit:
      "cover",

    display:
      "block",

    flexShrink: 0,

  },


  countryCaret: {

    fontSize: 10,

    color:
      colors.textMuted,

  },


  countryDropdown: {

    position:
      "absolute",

    top:
      "calc(100% + 8px)",

    left: 0,

    width: 240,

    maxHeight: 260,

    overflowY: "auto",

    borderRadius: 12,

    background:
      "#0f1521",

    border:
      `1px solid ${colors.cardBorder}`,

    boxShadow:
      "0 20px 50px rgba(0,0,0,0.45)",

    zIndex: 20,

    padding: 6,

  },


  countryOption: {

    width: "100%",

    display: "flex",

    alignItems: "center",

    justifyContent:
      "space-between",

    padding:
      "9px 10px",

    borderRadius: 8,

    background:
      "transparent",

    border: "none",

    color:
      colors.textPrimary,

    fontSize: 13,

    cursor:
      "pointer",

    textAlign:
      "left",

  },


  countryOptionLeft: {

    display: "flex",

    alignItems: "center",

    gap: 8,

    minWidth: 0,

  },


  countryOptionName: {

    color:
      colors.textPrimary,

    overflow:
      "hidden",

    textOverflow:
      "ellipsis",

    whiteSpace:
      "nowrap",

  },


  countryOptionDial: {

    color:
      colors.textMuted,

  },


  mobileInput: {

    flex: 1,

    height: 50,

    border: "none",

    outline: "none",

    background:
      "transparent",

    color:
      colors.textPrimary,

    fontSize: 14,

    paddingLeft: 4,

  },


  // ================= OTP =================

  otpContainer: {

    marginTop: 4,

  },


  otpTitle: {

    fontSize: 15,

    fontWeight: 700,

    margin: 0,

  },


  otpSubtitle: {

    fontSize: 12,

    color:
      colors.textSecondary,

    marginTop: 6,

    marginBottom: 18,

  },


  otpBoxes: {

    display: "flex",

    gap: 8,

    justifyContent:
      "space-between",

  },


  otpInput: {

    width: 44,

    height: 52,

    textAlign:
      "center",

    fontSize: 18,

    fontWeight: 700,

    borderRadius: 11,

    border:
      `1px solid ${colors.inputBorder}`,

    background:
      colors.inputBg,

    color:
      colors.textPrimary,

    outline:
      "none",

  },


  timer: {

    fontSize: 12,

    color:
      colors.textMuted,

    marginTop: 14,

    textAlign:
      "center",

  },


  resend: {

    display: "block",

    margin:
      "6px auto 0",

    background:
      "transparent",

    border:
      "none",

    color:
      "#60a5fa",

    fontWeight: 700,

    fontSize: 12,

    cursor:
      "pointer",

  },


  backLink: {

    display: "block",

    width: "100%",

    marginTop: 14,

    background:
      "transparent",

    border:
      "none",

    color:
      colors.textMuted,

    fontSize: 12,

    fontWeight: 700,

    cursor:
      "pointer",

    textAlign:
      "center",

  },


  registerRow: {

    display: "flex",

    justifyContent:
      "center",

    gap: 6,

    marginTop: 22,

  },


  registerText: {

    fontSize: 13,

    color:
      colors.textSecondary,

  },


  registerLink: {

    fontSize: 13,

    fontWeight: 700,

    color:
      "#60a5fa",

    cursor:
      "pointer",

  },


  securityFooter: {

    display: "flex",

    justifyContent:
      "center",

    gap: 6,

    marginTop: 20,

    fontSize: 12,

    color:
      colors.textMuted,

  },


  // ================= FORGOT PASSWORD MODAL =================

  resetOverlay: {

    position: "fixed",

    inset: 0,

    display: "flex",

    justifyContent:
      "center",

    alignItems:
      "center",

    padding: "20px",

    background:
      "rgba(0,0,0,0.65)",

    backdropFilter:
      "blur(6px)",

    WebkitBackdropFilter:
      "blur(6px)",

    zIndex: 1000,

  },


  resetCard: {

    width: "100%",

    maxWidth: "430px",

    padding: "28px",

    borderRadius: 20,

    boxSizing:
      "border-box",

    background:
      "linear-gradient(145deg, #182338, #111827)",

    border:
      `1px solid ${colors.cardBorder}`,

  },


  resetHeader: {

    display: "flex",

    justifyContent:
      "space-between",

    alignItems:
      "center",

  },


  resetTitle: {

    fontSize: 18,

    fontWeight: 800,

    margin: 0,

  },


  closeButton: {

    background:
      "transparent",

    border:
      "none",

    color:
      colors.textSecondary,

    fontSize: 22,

    cursor:
      "pointer",

    lineHeight: 1,

  },


  resetSubtitle: {

    fontSize: 13,

    color:
      colors.textSecondary,

    marginTop: 10,

    marginBottom: 4,

  },


  backButton: {

    display: "block",

    width: "100%",

    marginTop: 12,

    background:
      "transparent",

    border:
      "none",

    color:
      colors.textMuted,

    fontSize: 13,

    fontWeight: 700,

    cursor:
      "pointer",

    textAlign:
      "center",

  },

};