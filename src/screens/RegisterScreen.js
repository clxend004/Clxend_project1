import React, { useState } from "react";
import AppLayout from "../components/AppLayout";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";
import Loader from "../components/Loader";
import BackgroundWrapper from "../components/BackgroundWrapper";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";

export default function RegisterScreen() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    mobile: "",
    dob: "",
    address: "",
    govIdType: "",
    govIdNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const [passwordChecks, setPasswordChecks] = useState({});

  const checkPasswordStrength = (password) => {
  let strength = 0;

  if (password.length >= 6) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[@$!%*?&]/.test(password)) strength++;

  if (strength <= 2) return "Weak";
  if (strength === 3 || strength === 4) return "Medium";
  if (strength === 5) return "Strong";
};

const getPasswordChecks = (password) => {
  return {
    length: password.length >= 6,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password),
  };
};

  const handleChange = (name, value) => {
    if (name === "mobile") {
      value = value.replace(/\D/g, "");
      if (value.length > 10) return;
    }

    let error = "";

    switch (name) {
      case "fullName":
        if (!value) error = "Full Name is required";
        break;

      case "email":
  if (!value) {
    error = "Email is required";
  } else if (!/\S+@\S+\.\S+/.test(value)) {
    error = "Enter valid email";
  }
  break;

      case "mobile":
        if (!value) error = "Mobile number is required";
        break;

      case "password":
  if (!value) {
    error = "Password is required";
    setPasswordStrength("");
    setPasswordChecks({});
  } else {
    const strength = checkPasswordStrength(value);
    setPasswordStrength(strength);

    const checks = getPasswordChecks(value);
    setPasswordChecks(checks);

    if (strength === "Weak") {
      error = "Password is too weak";
    }
  }
  break;

      case "confirmPassword":
        if (value !== form.password)
          error = "Passwords do not match";
        break;

        case "govIdNumber":
  if (!value) {
    error = "ID Number is required";
  } else {
    if (form.govIdType === "aadhaar") {
      value = value.replace(/\D/g, "");

      if (value.length > 12) return;

      if (value.length !== 12) {
        error = "Aadhaar must be 12 digits";
      }
    }

    else if (form.govIdType === "pan") {
      value = value.toUpperCase();

      if (value.length > 10) return;

      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) {
        error = "PAN format: ABCDE1234F";
      }
    }

    else if (form.govIdType === "voter") {
      value = value.toUpperCase();

      if (value.length > 10) return;

      if (!/^[A-Z]{3}[0-9]{7}$/.test(value)) {
        error = "Voter ID format: ABC1234567";
      }
    }
  }
  break;

      default:

        break;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleBlur = (name, value) => {
  let error = "";

  switch (name) {
    case "fullName":
      if (!value) error = "Full Name is required";
      break;

    case "email":
      if (!value) {
        error = "Email is required";
      } else if (!/\S+@\S+\.\S+/.test(value)) {
        error = "Enter valid email";
      }
      break;

    case "mobile":
      if (!value) error = "Mobile number is required";
      break;

    case "dob":
  if (!value) error = "Date of Birth is required";
  break;

case "address":
  if (!value) error = "Address is required";
  break;

case "govIdType":
  if (!value) error = "Select ID Type";
  break;

case "govIdNumber":
  if (!value) {
    error = "ID Number is required";
  } else {
    if (form.govIdType === "aadhaar") {
      value = value.replace(/\D/g, ""); // only numbers

      if (value.length > 12) return;

      if (value.length !== 12) {
        error = "Aadhaar must be 12 digits (e.g., 123412341234)";
      }
    }

    else if (form.govIdType === "pan") {
      value = value.toUpperCase();

      if (value.length > 10) return;

      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) {
        error = "PAN format: ABCDE1234F";
      }
    }

    else if (form.govIdType === "voter") {
      value = value.toUpperCase();

      if (value.length > 10) return;

      if (!/^[A-Z]{3}[0-9]{7}$/.test(value)) {
        error = "Voter ID format: ABC1234567";
      }
    }
  }
  break; 

    case "password":
      if (!value) error = "Password is required";
      break;

    case "confirmPassword":
      if (!value) {
        error = "Confirm password is required";
      } else if (value !== form.password) {
        error = "Passwords do not match";
      }
      break;

    default:
      break;
  }

  setErrors((prev) => ({ ...prev, [name]: error }));
};

  const validateForm = () => {
    let newErrors = {};

    if (!form.fullName) newErrors.fullName = "Required";
    if (!form.email) newErrors.email = "Required";
    if (!form.mobile) newErrors.mobile = "Required";
    if (!form.dob) newErrors.dob = "Required";
if (!form.address) newErrors.address = "Required";
if (!form.govIdType) newErrors.govIdType = "Required";
if (!form.govIdNumber) newErrors.govIdNumber = "Required";
    if (!form.password) newErrors.password = "Required";
    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const response = await registerUser(form);

      setSuccessMessage(response.message || "Registered successfully!");
      setErrorMessage("");

      setForm({
  fullName: "",
  email: "",
  mobile: "",
  dob: "",
  address: "",
  govIdType: "",
  govIdNumber: "",
  password: "",
  confirmPassword: "",
});

      setTimeout(() => navigate("/login"), 2000);

    } catch (err) {
      setErrorMessage(err.message || "Registration Failed");
      setSuccessMessage("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackgroundWrapper>
  <AppLayout>
  <div style={styles.wrapper}>
    <div style={styles.card}>
        <h2 style={styles.title}>Register</h2>

        <CustomInput
          placeholder="Full Name"
          style={{ padding: "10px", fontSize: 14 }}
          value={form.fullName}
          onChange={(e) => handleChange("fullName", e.target.value)}
          onBlur={(e) => handleBlur("fullName", e.target.value)}
        />
        {errors.fullName && <p style={{ color: "red" }}>{errors.fullName}</p>}

        <CustomInput
          placeholder="Email"
          style={{ padding: "10px", fontSize: 14 }}
          value={form.email}
          onChange={(e) => handleChange("email", e.target.value)}
          onBlur={(e) => handleBlur("email", e.target.value)}
        />
        {errors.email && <p style={{ color: "red" }}>{errors.email}</p>}

        <CustomInput
          placeholder="Mobile"
          style={{ padding: "10px", fontSize: 14 }}
          value={form.mobile}
          onChange={(e) => handleChange("mobile", e.target.value)}
          onBlur={(e) => handleBlur("mobile", e.target.value)}
        />
        {errors.mobile && <p style={{ color: "red" }}>{errors.mobile}</p>}

        <CustomInput
          type="date"
          style={{ padding: "10px", fontSize: 14 }}
          value={form.dob}
          onChange={(e) => handleChange("dob", e.target.value)}
          onBlur={(e) => handleBlur("dob", e.target.value)}

        />
        {errors.dob && <p style={{ color: "red" }}>{errors.dob}</p>}

        <CustomInput
          placeholder="Address"
          style={{ padding: "10px", fontSize: 14 }}
          value={form.address}
          onChange={(e) => handleChange("address", e.target.value)}
          onBlur={(e) => handleBlur("address", e.target.value)}
        />
        {errors.address && <p style={{ color: "red" }}>{errors.address}</p>}

        <select
          value={form.govIdType}
          onChange={(e) => {
  handleChange("govIdType", e.target.value);
  setForm((prev) => ({ ...prev, govIdNumber: "" }));
}}
          onBlur={(e) => handleBlur("govIdType", e.target.value)}
          style={styles.select}
        >
          <option value="">Select ID Type</option>
          <option value="aadhaar">Aadhaar</option>
          <option value="pan">PAN</option>
          <option value="voter">Voter</option>
        </select>
        {errors.govIdType && (
  <p style={{ color: "red" }}>{errors.govIdType}</p>
)}

        <CustomInput
  placeholder={
    form.govIdType === "aadhaar"
      ? "Enter 12-digit Aadhaar (123412341234)"
      : form.govIdType === "pan"
      ? "Enter PAN (ABCDE1234F)"
      : form.govIdType === "voter"
      ? "Enter Voter ID (ABC1234567)"
      : "Select ID Type first"
  }
  disabled={!form.govIdType}
  style={{ padding: "10px", fontSize: 14 }}
  value={form.govIdNumber}
  onChange={(e) => handleChange("govIdNumber", e.target.value)}
  onBlur={(e) => handleBlur("govIdNumber", e.target.value)}
/>
        {errors.govIdNumber && (
  <p style={{ color: "red" }}>{errors.govIdNumber}</p>
)}

        <CustomInput
          type="password"
          style={{ padding: "10px", fontSize: 14 }}
          placeholder="Password"
          value={form.password}
          onChange={(e) => handleChange("password", e.target.value)}
          onBlur={(e) => handleBlur("password", e.target.value)}
        />

        {/* 🔥 Password Strength */}
{passwordStrength && (
  <p
    style={{
      color:
        passwordStrength === "Weak"
          ? "red"
          : passwordStrength === "Medium"
          ? "orange"
          : "green",
      fontWeight: "bold",
    }}
  >
    Strength: {passwordStrength}
  </p>
)}

{form.password && (
  <div style={{ textAlign: "left", marginTop: 10 }}>
    <p style={{ fontWeight: "bold" }}>Password must contain:</p>

    <p style={{ color: passwordChecks.length ? "green" : "red" }}>
      {passwordChecks.length ? "✔" : "✖"} At least 6 characters
    </p>

    <p style={{ color: passwordChecks.uppercase ? "green" : "red" }}>
      {passwordChecks.uppercase ? "✔" : "✖"} Uppercase letter
    </p>

    <p style={{ color: passwordChecks.lowercase ? "green" : "red" }}>
      {passwordChecks.lowercase ? "✔" : "✖"} Lowercase letter
    </p>

    <p style={{ color: passwordChecks.number ? "green" : "red" }}>
      {passwordChecks.number ? "✔" : "✖"} Number
    </p>

    <p style={{ color: passwordChecks.special ? "green" : "red" }}>
      {passwordChecks.special ? "✔" : "✖"} Special character
    </p>
  </div>
)}

        {errors.password && <p style={{ color: "red" }}>{errors.password}</p>}


        <CustomInput
          type="password"
          placeholder="Confirm Password"
          style={{ padding: "10px", fontSize: 14 }}
          value={form.confirmPassword}
          onChange={(e) => handleChange("confirmPassword", e.target.value)}
          onBlur={(e) => handleBlur("confirmPassword", e.target.value)}
        />
        {errors.confirmPassword && (
          <p style={{ color: "red" }}>{errors.confirmPassword}</p>
        )}

        {loading && <Loader />}

        {successMessage && (
          <p style={{ color: "green", fontWeight: "bold" }}>
            {successMessage}
          </p>
        )}

        {errorMessage && (
          <p style={{ color: "red", fontWeight: "bold" }}>
            {errorMessage}
          </p>
        )}

        <CustomButton
          title={loading ? "Registering..." : "Register"}
          style={{ padding: "10px", fontSize: 14 }}
          onClick={handleRegister}
          disabled={loading}
        />

        <p
          onClick={() => navigate("/login")}
          style={{
            marginTop: 15,
            cursor: "pointer",
            color: "#2563eb",
          }}
        >
          Already have an account? Login
        </p>
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

  select: {
    width: "100%",
    padding: "10px",
    borderRadius: 8,
    border: "1px solid #ddd",
    marginTop: 8,
    marginBottom: 10,
    background: "#fff",
  },
};