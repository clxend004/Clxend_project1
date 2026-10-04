import React, { useEffect, useRef, useState } from "react";
import AppLayout from "../components/AppLayout";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";
import Loader from "../components/Loader";
import BackgroundWrapper from "../components/BackgroundWrapper";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import ReactCountryFlag from "react-country-flag";
import countries from "../constants/countries";
import { getEmailSuggestions } from "../constants/emailDomains";
import clxendLogo from "../assets/clxend-logo.png";

export default function RegisterScreen() {
  const navigate = useNavigate();

  /* =========================================================
     FORM
  ========================================================= */

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    mobile: "",
    termsAccepted: false,
  });

  const [errors, setErrors] = useState({});
  const [validMessages, setValidMessages] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  /* =========================================================
     FIELD TOUCH STATE
  ========================================================= */

  const [touched, setTouched] = useState({
    email: false,
    mobile: false,
    password: false,
    confirmPassword: false,
  });

  /* =========================================================
     PASSWORD
  ========================================================= */

  const [passwordStrength, setPasswordStrength] = useState("");
  const [passwordChecks, setPasswordChecks] = useState({});

  /* =========================================================
     COUNTRY
  ========================================================= */

  const [selectedCountry, setSelectedCountry] = useState(
    countries[0]
  );

  const [countrySearch, setCountrySearch] = useState("");
  const [showCountrySelector, setShowCountrySelector] =
    useState(false);

  /* =========================================================
     EMAIL
  ========================================================= */

  const [emailSuggestions, setEmailSuggestions] = useState([]);

  /* =========================================================
     REFS
  ========================================================= */

  const validTimers = useRef({});
  const navigationTimer = useRef(null);
  const countrySelectorRef = useRef(null);

  /* =========================================================
     COUNTRY SEARCH
  ========================================================= */

  const filteredCountries = countries.filter((country) => {
    const search = countrySearch.toLowerCase().trim();

    if (!search) return true;

    return (
      country.name.toLowerCase().includes(search) ||
      country.code.toLowerCase().includes(search) ||
      country.dialCode.includes(search)
    );
  });

  /* =========================================================
     COUNTRY FLAG
  ========================================================= */

  const CountryFlag = ({ countryCode, size = 20 }) => (
    <ReactCountryFlag
      countryCode={countryCode}
      svg
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        objectFit: "cover",
        display: "block",
      }}
      aria-label={countryCode}
    />
  );

  /* =========================================================
     CLOSE COUNTRY DROPDOWN
  ========================================================= */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        countrySelectorRef.current &&
        !countrySelectorRef.current.contains(event.target)
      ) {
        setShowCountrySelector(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  /* =========================================================
     VALID MESSAGE
  ========================================================= */

  const showValidMessage = (field, message) => {
    if (validTimers.current[field]) {
      clearTimeout(validTimers.current[field]);
    }

    setValidMessages((prev) => ({
      ...prev,
      [field]: message,
    }));

    validTimers.current[field] = setTimeout(() => {
      setValidMessages((prev) => ({
        ...prev,
        [field]: "",
      }));

      delete validTimers.current[field];
    }, 2000);
  };

  const clearValidMessage = (field) => {
    if (validTimers.current[field]) {
      clearTimeout(validTimers.current[field]);
      delete validTimers.current[field];
    }

    setValidMessages((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  /* =========================================================
     COUNTRY DETECTION
  ========================================================= */

  const detectCountryFromNumber = (value) => {
    const cleaned = value.replace(/\s/g, "");

    if (!cleaned) {
      return null;
    }

    if (cleaned.startsWith("+91")) {
      return countries.find(
        (country) => country.code === "IN"
      );
    }

    if (cleaned.startsWith("+1")) {
      return countries.find(
        (country) => country.code === "US"
      );
    }

    if (cleaned.startsWith("+44")) {
      return countries.find(
        (country) => country.code === "GB"
      );
    }

    if (cleaned.startsWith("+61")) {
      return countries.find(
        (country) => country.code === "AU"
      );
    }

    if (cleaned.startsWith("+65")) {
      return countries.find(
        (country) => country.code === "SG"
      );
    }

    if (cleaned.startsWith("+971")) {
      return countries.find(
        (country) => country.code === "AE"
      );
    }

    if (cleaned.startsWith("+966")) {
      return countries.find(
        (country) => country.code === "SA"
      );
    }

    if (cleaned.startsWith("+974")) {
      return countries.find(
        (country) => country.code === "QA"
      );
    }

    if (cleaned.startsWith("+49")) {
      return countries.find(
        (country) => country.code === "DE"
      );
    }

    if (cleaned.startsWith("+33")) {
      return countries.find(
        (country) => country.code === "FR"
      );
    }

    if (/^[6-9]/.test(cleaned)) {
      return countries.find(
        (country) => country.code === "IN"
      );
    }

    return null;
  };

  /* =========================================================
     COUNTRY SELECT
  ========================================================= */

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setShowCountrySelector(false);
    setCountrySearch("");

    setForm((prev) => ({
      ...prev,
      mobile: "",
    }));

    setErrors((prev) => ({
      ...prev,
      mobile: "",
    }));

    setTouched((prev) => ({
      ...prev,
      mobile: false,
    }));

    clearValidMessage("mobile");
  };

  /* =========================================================
     MOBILE CHANGE
  ========================================================= */

  const handleMobileChange = (value) => {
    const originalValue = value.replace(/\s/g, "");

    if (originalValue.startsWith("+")) {
      const detected =
        detectCountryFromNumber(originalValue);

      if (detected) {
        setSelectedCountry(detected);

        let digits = originalValue
          .replace(detected.dialCode, "")
          .replace(/\D/g, "");

        digits = digits.slice(
          0,
          detected.maxLength
        );

        setForm((prev) => ({
          ...prev,
          mobile: digits,
        }));

        setErrors((prev) => ({
          ...prev,
          mobile: "",
        }));

        clearValidMessage("mobile");

        return;
      }
    }

    let digits = value.replace(/\D/g, "");

    if (/^[6-9]/.test(digits)) {
      const india = countries.find(
        (country) => country.code === "IN"
      );

      if (selectedCountry.code !== "IN") {
        setSelectedCountry(india);
      }
    }

    digits = digits.slice(
      0,
      selectedCountry.maxLength
    );

    setForm((prev) => ({
      ...prev,
      mobile: digits,
    }));

    setErrors((prev) => ({
      ...prev,
      mobile: "",
    }));

    clearValidMessage("mobile");
  };

  /* =========================================================
     MOBILE BLUR VALIDATION
  ========================================================= */

  const validateMobile = () => {
    const digits = form.mobile.replace(/\D/g, "");

    if (!digits) {
      return "Mobile number is required";
    }

    if (
      digits.length <
      selectedCountry.minLength
    ) {
      return `Enter ${selectedCountry.minLength}-digit mobile number`;
    }

    if (
      digits.length >
      selectedCountry.maxLength
    ) {
      return `Maximum ${selectedCountry.maxLength} digits allowed`;
    }

    if (selectedCountry.code === "IN") {
      if (!/^[6-9][0-9]{9}$/.test(digits)) {
        return "Enter a valid 10-digit Indian mobile number";
      }
    }

    if (
      selectedCountry.code === "US" ||
      selectedCountry.code === "CA"
    ) {
      if (!/^[2-9][0-9]{9}$/.test(digits)) {
        return "Enter a valid 10-digit phone number";
      }
    }

    return "";
  };

  /* =========================================================
     EMAIL SUGGESTIONS
  ========================================================= */

  const handleEmailChange = (value) => {
    const emailValue = value.toLowerCase();

    setEmailSuggestions(getEmailSuggestions(emailValue));

    setForm((prev) => ({
      ...prev,
      email: emailValue,
    }));

    setErrors((prev) => ({
      ...prev,
      email: "",
    }));

    clearValidMessage("email");
  };

  const selectEmailSuggestion = (email) => {
    setForm((prev) => ({
      ...prev,
      email,
    }));

    setEmailSuggestions([]);

    setErrors((prev) => ({
      ...prev,
      email: "",
    }));

    setTouched((prev) => ({
      ...prev,
      email: true,
    }));

    showValidMessage(
      "email",
      "✔ Valid Email"
    );
  };

  /* =========================================================
     PASSWORD
  ========================================================= */

  const checkPasswordStrength = (password) => {
    let strength = 0;

    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;

    if (strength <= 2) return "Weak";
    if (strength === 3 || strength === 4)
      return "Medium";
    if (strength === 5) return "Strong";

    return "";
  };

  const getPasswordChecks = (password) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
    };
  };

  /* =========================================================
     GENERAL CHANGE
  ========================================================= */

  const handleChange = (name, value) => {
    if (name === "email") {
      value = value.toLowerCase();

      setForm((prev) => ({
        ...prev,
        email: value,
      }));

      setErrors((prev) => ({
        ...prev,
        email: "",
      }));

      clearValidMessage("email");

      return;
    }

    if (name === "password") {
      const strength =
        checkPasswordStrength(value);

      const checks =
        getPasswordChecks(value);

      setPasswordStrength(strength);
      setPasswordChecks(
        value ? checks : {}
      );

      setForm((prev) => ({
        ...prev,
        password: value,
      }));

      setErrors((prev) => ({
        ...prev,
        password: "",
        confirmPassword:
          prev.confirmPassword,
      }));

      clearValidMessage("password");

      if (form.confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword:
            form.confirmPassword !== value
              ? "Passwords do not match"
              : "",
        }));
      }

      return;
    }

    if (name === "confirmPassword") {
      setForm((prev) => ({
        ...prev,
        confirmPassword: value,
      }));

      setErrors((prev) => ({
        ...prev,
        confirmPassword: "",
      }));

      clearValidMessage(
        "confirmPassword"
      );

      return;
    }

    if (name === "termsAccepted") {
      setForm((prev) => ({
        ...prev,
        termsAccepted: value,
      }));

      setErrors((prev) => ({
        ...prev,
        termsAccepted: "",
      }));

      return;
    }
  };

  /* =========================================================
     BLUR VALIDATION
  ========================================================= */

  const handleBlur = (name) => {
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    let error = "";

    switch (name) {
      case "email":
        if (!form.email.trim()) {
          error = "Email is required";
        } else if (
          !/^\S+@\S+\.\S+$/.test(
            form.email.trim()
          )
        ) {
          error = "Enter a valid email address";
        }
        break;

      case "mobile":
        error = validateMobile();
        break;

      case "password": {
        if (!form.password) {
          error = "Password is required";
        } else {
          const checks =
            getPasswordChecks(
              form.password
            );

          if (
            !checks.length ||
            !checks.uppercase ||
            !checks.lowercase ||
            !checks.number ||
            !checks.special
          ) {
            error =
              "Password must meet all requirements";
          }
        }

        break;
      }

      case "confirmPassword":
        if (!form.confirmPassword) {
          error =
            "Confirm password is required";
        } else if (
          form.confirmPassword !==
          form.password
        ) {
          error =
            "Passwords do not match";
        }
        break;

      default:
        break;
    }

    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));

    if (!error && form[name]) {
      const validText = {
        email: "✔ Valid Email",
        mobile: "✔ Valid Mobile Number",
        password: "✔ Valid Password",
        confirmPassword:
          "✔ Passwords Match",
      };

      if (validText[name]) {
        showValidMessage(
          name,
          validText[name]
        );
      }
    } else {
      clearValidMessage(name);
    }
  };

  /* =========================================================
     VALIDATE FORM
  ========================================================= */

  const validateForm = () => {
    const newErrors = {};

    if (!form.email.trim()) {
      newErrors.email =
        "Email is required";
    } else if (
      !/^\S+@\S+\.\S+$/.test(
        form.email.trim()
      )
    ) {
      newErrors.email =
        "Enter a valid email address";
    }

    const mobileError =
      validateMobile();

    if (mobileError) {
      newErrors.mobile =
        mobileError;
    }

    if (!form.password) {
      newErrors.password =
        "Password is required";
    } else {
      const checks =
        getPasswordChecks(
          form.password
        );

      if (
        !checks.length ||
        !checks.uppercase ||
        !checks.lowercase ||
        !checks.number ||
        !checks.special
      ) {
        newErrors.password =
          "Password must meet all requirements";
      }
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword =
        "Confirm password is required";
    } else if (
      form.confirmPassword !==
      form.password
    ) {
      newErrors.confirmPassword =
        "Passwords do not match";
    }

    if (!form.termsAccepted) {
      newErrors.termsAccepted =
        "You must accept the Terms & Conditions";
    }

    setErrors(newErrors);

    setTouched({
      email: true,
      mobile: true,
      password: true,
      confirmPassword: true,
    });

    return (
      Object.keys(newErrors).length === 0
    );
  };

  /* =========================================================
     REGISTER
  ========================================================= */

  const handleRegister = async () => {
    if (loading) return;

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      /* -----------------------------------------------------
         CLEAN EMAIL
      ----------------------------------------------------- */

      const registeredEmail =
        form.email.trim().toLowerCase();

      /* -----------------------------------------------------
         CLEAN MOBILE NUMBER
         Example:
         selected country = India
         mobile = 9876543210

         storedMobile = +919876543210
      ----------------------------------------------------- */

      const localMobile =
        form.mobile.replace(/\D/g, "");

      const registeredMobile =
        `${selectedCountry.dialCode}${localMobile}`;

      /* -----------------------------------------------------
         COMPLETE USER DATA
         This is what gets sent to authService.
      ----------------------------------------------------- */

      const cleanedForm = {
        ...form,

        email: registeredEmail,

        mobile: registeredMobile,

        /* Keep useful country information */
        countryCode: selectedCountry.code,

        countryName: selectedCountry.name,

        dialCode: selectedCountry.dialCode,
      };

      /* -----------------------------------------------------
         REGISTER USER
      ----------------------------------------------------- */

      const response =
        await registerUser(cleanedForm);

      /* -----------------------------------------------------
         STORE REGISTERED USER DETAILS
         IMPORTANT FOR KYC PAGE
      ----------------------------------------------------- */

      /*
        These keys make the registered information
        available to the KYC screen immediately after
        registration/login.

        DO NOT store the password.
      */

      localStorage.setItem(
        "registeredEmail",
        registeredEmail
      );

      localStorage.setItem(
        "registeredMobile",
        registeredMobile
      );

      localStorage.setItem(
        "userEmail",
        registeredEmail
      );

      localStorage.setItem(
        "userMobile",
        registeredMobile
      );

      localStorage.setItem(
        "userCountryCode",
        selectedCountry.code
      );

      localStorage.setItem(
        "userDialCode",
        selectedCountry.dialCode
      );

      /* -----------------------------------------------------
         STORE COMPLETE REGISTERED USER
         WITHOUT PASSWORD
      ----------------------------------------------------- */

      const registeredUser = {
        email: registeredEmail,
        mobile: registeredMobile,
        countryCode: selectedCountry.code,
        countryName: selectedCountry.name,
        dialCode: selectedCountry.dialCode,
      };

      localStorage.setItem(
        "registeredUser",
        JSON.stringify(registeredUser)
      );

      /* -----------------------------------------------------
         IF BACKEND RETURNS USER DATA, STORE IT TOO
      ----------------------------------------------------- */

      if (response?.user) {
        const backendUser = {
          ...response.user,

          /*
            Always keep the values entered during
            registration as the primary values.
          */
          email:
            response.user.email ||
            registeredEmail,

          mobile:
            response.user.mobile ||
            registeredMobile,
        };

        /*
          Never save password from backend response.
        */
        delete backendUser.password;

        localStorage.setItem(
          "currentUser",
          JSON.stringify(backendUser)
        );
      } else {
        localStorage.setItem(
          "currentUser",
          JSON.stringify(registeredUser)
        );
      }

      /* -----------------------------------------------------
         SUCCESS
      ----------------------------------------------------- */

      setSuccessMessage(
        response?.message ||
          "Registered successfully!"
      );

      if (navigationTimer.current) {
        clearTimeout(
          navigationTimer.current
        );
      }

      navigationTimer.current =
        setTimeout(() => {
          navigate("/login");
        }, 1800);

    } catch (err) {
      setErrorMessage(
        err?.message ||
          "Registration failed"
      );

      setSuccessMessage("");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     CLEANUP
  ========================================================= */

  useEffect(() => {
    const timers = validTimers.current;

    return () => {
      Object.values(timers).forEach((timer) => {
        clearTimeout(timer);
      });

      if (navigationTimer.current) {
        clearTimeout(navigationTimer.current);
      }
    };
  }, []);

  /* =========================================================
     UI
  ========================================================= */

  return (
    <BackgroundWrapper>
      <AppLayout>
        <div style={styles.wrapper}>
          <div style={styles.authContainer}>
            <div style={styles.brand}>
              <div style={styles.logo}>
                <img
                  src={clxendLogo}
                  alt="CLXEND"
                  style={styles.logoImage}
                />
              </div>

              <div style={styles.brandText}>
                <div style={styles.brandName}>CLXEND</div>
                <div style={styles.brandSubtitle}>Secure Digital Wallet</div>
              </div>
            </div>

            <div style={styles.card}>

            <h1 style={styles.title}>
              Create Your CLXEND Account
            </h1>

            <p style={styles.subtitle}>
              Register securely to access your
              digital wallet
            </p>

            <label style={styles.label}>
              Email
            </label>

            <CustomInput
              name="email"
              placeholder="Enter your email"
              type="email"
              value={form.email}
              autoComplete="off"
              style={styles.input}
              onChange={(e) =>
                handleEmailChange(
                  e.target.value
                )
              }
              onBlur={() =>
                handleBlur("email")
              }
            />

            {emailSuggestions.length > 0 && (
              <div style={styles.suggestionBox}>
                {emailSuggestions.map(
                  (email) => (
                    <div
                      key={email}
                      style={styles.suggestionItem}
                      onMouseDown={() =>
                        selectEmailSuggestion(
                          email
                        )
                      }
                    >
                      {email}
                    </div>
                  )
                )}
              </div>
            )}

            {touched.email &&
              errors.email && (
                <p style={styles.errorText}>
                  {errors.email}
                </p>
              )}

            {!errors.email &&
              validMessages.email && (
                <p style={styles.successText}>
                  {validMessages.email}
                </p>
              )}

            <label style={styles.label}>
              Mobile Number
            </label>

            <div style={styles.phoneWrapper}>
              <div
                ref={countrySelectorRef}
                style={
                  styles.countrySelectorContainer
                }
              >
                <button
                  type="button"
                  style={styles.countryButton}
                  onClick={() =>
                    setShowCountrySelector(
                      (prev) => !prev
                    )
                  }
                >
                  <CountryFlag
                    countryCode={
                      selectedCountry.code
                    }
                    size={22}
                  />

                  <span style={styles.dialCode}>
                    {selectedCountry.dialCode}
                  </span>

                  <span style={styles.arrow}>
                    {showCountrySelector
                      ? "▲"
                      : "▼"}
                  </span>
                </button>

                {showCountrySelector && (
                  <div style={styles.countryDropdown}>
                    <input
                      type="text"
                      value={countrySearch}
                      placeholder="Search country"
                      autoFocus
                      style={styles.countrySearch}
                      onChange={(e) =>
                        setCountrySearch(
                          e.target.value
                        )
                      }
                    />

                    <div style={styles.countryList}>
                      {filteredCountries.map(
                        (country) => (
                          <button
                            type="button"
                            key={country.code}
                            style={styles.countryItem}
                            onClick={() =>
                              handleCountrySelect(
                                country
                              )
                            }
                          >
                            <CountryFlag
                              countryCode={
                                country.code
                              }
                              size={22}
                            />

                            <span
                              style={
                                styles.countryItemName
                              }
                            >
                              {country.name}
                            </span>

                            <span
                              style={
                                styles.countryItemCode
                              }
                            >
                              {country.dialCode}
                            </span>
                          </button>
                        )
                      )}

                      {filteredCountries.length ===
                        0 && (
                        <div style={styles.noCountries}>
                          No country found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <CustomInput
                name="mobile"
                placeholder="Enter mobile number"
                type="tel"
                value={form.mobile}
                autoComplete="off"
                inputMode="numeric"
                style={styles.phoneInput}
                onChange={(e) =>
                  handleMobileChange(
                    e.target.value
                  )
                }
                onBlur={() =>
                  handleBlur("mobile")
                }
              />
            </div>

            <div style={styles.selectedCountryText}>
              <CountryFlag
                countryCode={
                  selectedCountry.code
                }
                size={16}
              />

              <span>
                {selectedCountry.name}
              </span>
            </div>

            {touched.mobile &&
              errors.mobile && (
                <p style={styles.errorText}>
                  {errors.mobile}
                </p>
              )}

            {!errors.mobile &&
              validMessages.mobile && (
                <p style={styles.successText}>
                  {validMessages.mobile}
                </p>
              )}

            <label style={styles.label}>
              Password
            </label>

            <CustomInput
              name="password"
              type="password"
              placeholder="Create a strong password"
              value={form.password}
              autoComplete="new-password"
              style={styles.input}
              onChange={(e) =>
                handleChange(
                  "password",
                  e.target.value
                )
              }
              onBlur={() =>
                handleBlur("password")
              }
            />

            {passwordStrength && (
              <p
                style={{
                  ...styles.strength,
                  color:
                    passwordStrength ===
                    "Weak"
                      ? "#f87171"
                      : passwordStrength ===
                        "Medium"
                      ? "#fbbf24"
                      : "#34d399",
                }}
              >
                Strength: {passwordStrength}
              </p>
            )}

            {form.password && (
              <div style={styles.passwordChecks}>
                <p style={styles.passwordTitle}>
                  Password must contain:
                </p>

                <PasswordCheck
                  valid={passwordChecks.length}
                  text="At least 8 characters"
                />

                <PasswordCheck
                  valid={passwordChecks.uppercase}
                  text="Uppercase letter"
                />

                <PasswordCheck
                  valid={passwordChecks.lowercase}
                  text="Lowercase letter"
                />

                <PasswordCheck
                  valid={passwordChecks.number}
                  text="Number"
                />

                <PasswordCheck
                  valid={passwordChecks.special}
                  text="Special character"
                />
              </div>
            )}

            {touched.password &&
              errors.password && (
                <p style={styles.errorText}>
                  {errors.password}
                </p>
              )}

            <label style={styles.label}>
              Confirm Password
            </label>

            <CustomInput
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={form.confirmPassword}
              autoComplete="new-password"
              style={styles.input}
              onChange={(e) =>
                handleChange(
                  "confirmPassword",
                  e.target.value
                )
              }
              onBlur={() =>
                handleBlur(
                  "confirmPassword"
                )
              }
            />

            {touched.confirmPassword &&
              errors.confirmPassword && (
                <p style={styles.errorText}>
                  {errors.confirmPassword}
                </p>
              )}

            {!errors.confirmPassword &&
              validMessages.confirmPassword && (
                <p style={styles.successText}>
                  {validMessages.confirmPassword}
                </p>
              )}

            <div style={styles.termsRow}>
              <button
                type="button"
                onClick={() =>
                  handleChange(
                    "termsAccepted",
                    !form.termsAccepted
                  )
                }
                style={{
                  ...styles.customCheckbox,
                  background: form.termsAccepted
                    ? "linear-gradient(135deg, #8b5cf6, #2563eb)"
                    : "#0b1220",
                  borderColor: form.termsAccepted
                    ? "transparent"
                    : "rgba(148,163,184,0.3)",
                }}
                aria-label="Accept Terms and Conditions"
              >
                {form.termsAccepted && "✓"}
              </button>

              <span style={styles.termsText}>
                I agree to the{" "}
                <span style={styles.termsLink}>
                  Terms & Conditions
                </span>{" "}
                and Privacy Policy.
              </span>
            </div>

            {errors.termsAccepted && (
              <p style={styles.errorText}>
                {errors.termsAccepted}
              </p>
            )}

            {loading && <Loader />}

            {successMessage && (
              <p style={styles.successMessage}>✓ {successMessage}</p>
            )}

            {errorMessage && (
              <div role="alert" style={styles.errorBox}>
                <span style={styles.errorIcon}>⚠</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <CustomButton
              title="Create Account"
              loading={loading}
              disabled={
                loading ||
                Object.values(errors).some(Boolean) ||
                !form.email ||
                !form.password ||
                !form.confirmPassword ||
                !form.mobile ||
                !form.termsAccepted
              }
              style={{
                padding: "10px",
                fontSize: 14,
              }}
              onClick={handleRegister}
            />

            <p
              onClick={() =>
                navigate("/login")
              }
              style={styles.loginLink}
            >
              Already have an account?{" "}
              <span style={{ color: "#60a5fa" }}>
                Login
              </span>
            </p>
            </div>

            <div style={styles.securityFooter}>
              🔒 Your account is protected with secure authentication
            </div>
          </div>
        </div>
      </AppLayout>
    </BackgroundWrapper>
  );
}

/* =========================================================
   PASSWORD CHECK
========================================================= */

function PasswordCheck({ valid, text }) {
  return (
    <p
      style={{
        color: valid ? "#34d399" : "#f87171",
        margin: "4px 0",
        fontSize: "10px",
        lineHeight: "1.4",
        fontWeight: "500",
        fontFamily:
          '"Inter", "Segoe UI", Arial, sans-serif',
      }}
    >
      {valid ? "✔" : "✖"} {text}
    </p>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = {
  wrapper: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "30px 20px",
    boxSizing: "border-box",
    background:
      "radial-gradient(circle at top, #172554 0%, #0b1120 45%, #050816 100%)",
    fontFamily:
      '"Inter", "Segoe UI", Arial, sans-serif',
  },

  authContainer: {
    width: "100%",
    maxWidth: "470px",
  },

  brand: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 22,
  },

  brandText: { display: "flex", flexDirection: "column" },

  logo: {
  width: 44,
  height: 44,
  borderRadius: 12,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  overflow: "hidden",
  background: "#ffffff",
  boxShadow: "0 8px 25px rgba(59,130,246,0.35)",
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
    color: "#ffffff",
  },

  brandSubtitle: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 1,
  },

  securityFooter: {
    display: "flex",
    justifyContent: "center",
    gap: 6,
    marginTop: 20,
    fontSize: 12,
    color: "#64748b",
  },

  card: {
    width: "100%",
    padding: "28px 26px 26px",
    borderRadius: "20px",
    background: "rgba(15, 20, 33, 0.72)",
    border:
      "1px solid rgba(148,163,184,0.12)",
    boxShadow:
      "0 20px 60px rgba(0,0,0,0.35)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    boxSizing: "border-box",
    color: "#ffffff",
  },

  title: {
    textAlign: "left",
    margin: "0 0 6px",
    fontSize: "24px",
    lineHeight: "1.25",
    fontWeight: "800",
    letterSpacing: "-0.3px",
    color: "#ffffff",
    fontFamily:
      '"Inter", "Segoe UI", Arial, sans-serif',
  },

  subtitle: {
    textAlign: "left",
    color: "#94a3b8",
    fontSize: "13px",
    lineHeight: "1.5",
    margin: "0 0 20px",
    fontWeight: "500",
    fontFamily:
      '"Inter", "Segoe UI", Arial, sans-serif',
  },

  label: {
    display: "block",
    marginBottom: "6px",
    marginTop: "15px",
    fontSize: "12px",
    lineHeight: "1.4",
    fontWeight: "700",
    color: "#e2e8f0",
    letterSpacing: "0.15px",
    fontFamily:
      '"Inter", "Segoe UI", Arial, sans-serif',
  },

  input: {
    padding: "9px 11px",
    fontSize: 13,
    fontFamily:
      '"Inter", "Segoe UI", Arial, sans-serif',
  },

  phoneWrapper: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    gap: "8px",
    position: "relative",
  },

  countrySelectorContainer: {
    position: "relative",
    flexShrink: 0,
  },

  countryButton: {
    height: "48px",
    minWidth: "96px",
    padding: "0 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    borderRadius: "10px",
    background: "#0b1220",
    border:
      "1px solid rgba(148,163,184,0.22)",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "600",
    fontFamily:
      '"Inter", "Segoe UI", Arial, sans-serif',
    cursor: "pointer",
    outline: "none",
    transition:
      "border-color 0.2s ease, background 0.2s ease",
  },

  dialCode: {
    whiteSpace: "nowrap",
    fontSize: "13px",
    fontWeight: "600",
  },

  arrow: {
    fontSize: "7px",
    color: "#94a3b8",
    marginLeft: "1px",
  },

  phoneInput: {
    padding: "9px 11px",
    fontSize: 13,
    flex: 1,
    minWidth: 0,
    fontFamily:
      '"Inter", "Segoe UI", Arial, sans-serif',
  },

  selectedCountryText: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "10px",
    color: "#64748b",
    marginTop: "5px",
    fontWeight: "500",
  },

  countryDropdown: {
    position: "absolute",
    top: "54px",
    left: 0,
    width: "275px",
    background: "#111827",
    border:
      "1px solid rgba(148,163,184,0.22)",
    borderRadius: "11px",
    boxShadow:
      "0 20px 50px rgba(0,0,0,0.55)",
    padding: "7px",
    zIndex: 1000,
    fontFamily:
      '"Inter", "Segoe UI", Arial, sans-serif',
  },

  countrySearch: {
    width: "100%",
    height: "37px",
    boxSizing: "border-box",
    padding: "0 10px",
    borderRadius: "8px",
    border:
      "1px solid rgba(148,163,184,0.18)",
    outline: "none",
    background: "#0b1220",
    color: "#ffffff",
    fontSize: "12px",
    fontFamily:
      '"Inter", "Segoe UI", Arial, sans-serif',
    marginBottom: "6px",
  },

  countryList: {
    maxHeight: "240px",
  },

  countryItem: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "9px 8px",
    border: "none",
    borderRadius: "7px",
    background: "transparent",
    color: "#e2e8f0",
    cursor: "pointer",
    textAlign: "left",
    fontFamily:
      '"Inter", "Segoe UI", Arial, sans-serif',
    transition:
      "background 0.15s ease",
  },

  countryItemName: {
    flex: 1,
    fontSize: "12px",
    fontWeight: "500",
  },

  countryItemCode: {
    fontSize: "11px",
    color: "#94a3b8",
  },

  noCountries: {
    padding: "13px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "12px",
  },

  suggestionBox: {
    background: "#0b1220",
    border:
      "1px solid rgba(148,163,184,0.18)",
    borderRadius: "9px",
    marginTop: "4px",
    overflow: "hidden",
    position: "relative",
    zIndex: 10,
    boxShadow:
      "0 10px 25px rgba(0,0,0,0.25)",
  },

  suggestionItem: {
    padding: "9px 11px",
    fontSize: "12px",
    color: "#e2e8f0",
    cursor: "pointer",
    borderBottom:
      "1px solid rgba(148,163,184,0.07)",
    fontFamily:
      '"Inter", "Segoe UI", Arial, sans-serif',
    transition:
      "background 0.15s ease",
  },

  errorText: {
    color: "#f87171",
    fontSize: "10px",
    lineHeight: "1.4",
    margin: "4px 0 5px",
    fontWeight: "500",
    fontFamily:
      '"Inter", "Segoe UI", Arial, sans-serif',
  },

  successText: {
    color: "#34d399",
    fontSize: "10px",
    lineHeight: "1.4",
    margin: "4px 0 5px",
    fontWeight: "600",
    fontFamily:
      '"Inter", "Segoe UI", Arial, sans-serif',
  },

  strength: {
    fontSize: "10px",
    fontWeight: "700",
    margin: "5px 0",
    fontFamily:
      '"Inter", "Segoe UI", Arial, sans-serif',
  },

  passwordChecks: {
    textAlign: "left",
    marginTop: "7px",
    marginBottom: "7px",
    padding: "8px 10px",
    borderRadius: "9px",
    background:
      "rgba(11,18,32,0.55)",
    border:
      "1px solid rgba(148,163,184,0.08)",
  },

  passwordTitle: {
    fontWeight: "700",
    color: "#e2e8f0",
    fontSize: "10px",
    margin: "0 0 5px",
    fontFamily:
      '"Inter", "Segoe UI", Arial, sans-serif',
  },

  termsRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "9px",
    marginTop: "17px",
    width: "100%",
    boxSizing: "border-box",
    fontSize: "11px",
    lineHeight: "1.5",
    fontFamily:
      '"Inter", "Segoe UI", Arial, sans-serif',
  },

  customCheckbox: {
    width: "18px",
    height: "18px",
    minWidth: "18px",
    padding: "0",
    margin: "1px 0 0 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(148,163,184,0.3)",
    borderRadius: "5px",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "800",
    cursor: "pointer",
    outline: "none",
    boxSizing: "border-box",
    transition:
      "all 0.15s ease",
  },

  termsText: {
    color: "#94a3b8",
    fontWeight: "400",
  },

  termsLink: {
    color: "#60a5fa",
    cursor: "pointer",
    fontWeight: "600",
  },

  successMessage: {
    color: "#34d399",
    fontWeight: "700",
    textAlign: "center",
    fontSize: "13px",
    marginTop: "14px",
    fontFamily:
      '"Inter", "Segoe UI", Arial, sans-serif',
  },

  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    padding: "10px 12px",
    borderRadius: 10,
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.25)",
    color: "#f87171",
    fontSize: 13,
    fontFamily:
      '"Inter", "Segoe UI", Arial, sans-serif',
  },

  errorIcon: { fontSize: 14 },

  loginLink: {
    marginTop: "18px",
    marginBottom: "0",
    textAlign: "center",
    cursor: "pointer",
    color: "#94a3b8",
    fontSize: "13px",
    fontWeight: "500",
    fontFamily:
      '"Inter", "Segoe UI", Arial, sans-serif',
  },
};