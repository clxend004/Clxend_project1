import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";
import Loader from "../components/Loader"; // ✅ Spinner import


// Modular input component
function FormInput({
  label,
  name,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
}) {
  return (
    <div style={{ marginBottom: 10, width: "100%" }}>
      <input
        type={type}
        placeholder={label}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        onBlur={() => onBlur(name, value)}
        style={{
          width: "100%",
          padding: 8,
          borderRadius: 8,
          border: error ? "1px solid red" : "1px solid #ccc",
          boxSizing: "border-box",
        }}
      />
      {error && <p style={{ color: "red", fontSize: 12 }}>{error}</p>}
    </div>
  );
}

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
  const [errorMessage, setErrorMessage] = useState(""); // ✅ Step 6
  const [loading, setLoading] = useState(false);

  const handleChange = (name, value) => {

    if (name === "mobile") {
      value = value.replace(/\D/g, "");
      if (value.length > 10) return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));

    let error = "";

    switch (name) {
      case "fullName":
        if (!value) error = "Full Name is required";
        else if (!/^[A-Za-z\s]+$/.test(value))
          error = "Full Name should contain only letters";
        break;

      case "email":
        if (!value) error = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          error = "Enter valid email address";
        break;

      case "mobile":
        if (!value) error = "Mobile number is required";
        else if (!/^\d{10}$/.test(value))
          error = "Mobile number must be 10 digits";
        break;

      case "dob":
        if (!value) error = "Date of Birth is required";
        break;

      case "address":
        if (!value) error = "Address is required";
        break;

      case "govIdType":
        if (!value) error = "Please select Government ID type";
        break;

      case "govIdNumber":
        if (!value) error = "Government ID number is required";
        break;

      case "password":
        if (!value) error = "Password is required";
        else if (value.length < 6)
          error = "Password must be at least 6 characters";

        if (form.confirmPassword && value !== form.confirmPassword) {
          setErrors((prev) => ({
            ...prev,
            confirmPassword: "Passwords do not match",
          }));
        } else {
          setErrors((prev) => ({
            ...prev,
            confirmPassword: "",
          }));
        }
        break;

      case "confirmPassword":
        if (!value) error = "Confirm your password";
        else if (value !== form.password)
          error = "Passwords do not match";
        break;

      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleBlur = (name, value) => {
    handleChange(name, value);
  };

  const validateForm = () => {
    let newErrors = {};

    if (!form.fullName) newErrors.fullName = "Full Name is required";
    else if (!/^[A-Za-z\s]+$/.test(form.fullName))
      newErrors.fullName = "Full Name should contain only letters";

    if (!form.email) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Enter valid email address";

    if (!form.mobile) newErrors.mobile = "Mobile number is required";
    else if (!/^\d{10}$/.test(form.mobile))
      newErrors.mobile = "Mobile number must be 10 digits";

    if (!form.dob) newErrors.dob = "Date of Birth is required";

    if (!form.address) newErrors.address = "Address is required";

    if (!form.govIdType)
      newErrors.govIdType = "Please select Government ID type";

    if (!form.govIdNumber)
      newErrors.govIdNumber = "Government ID number is required";

    if (!form.password) newErrors.password = "Password is required";
    else if (form.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    if (!form.confirmPassword)
      newErrors.confirmPassword = "Confirm your password";
    else if (form.confirmPassword !== form.password)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    const isValid = validateForm();
    if (!isValid) return;

    try {
      setLoading(true); // ✅ Step 4

      const response = await registerUser({
  fullName: form.fullName,
  email: form.email,
  mobile: form.mobile,
  dob: form.dob,
  address: form.address,
  govIdType: form.govIdType,
  govIdNumber: form.govIdNumber,
  password: form.password
});

      setSuccessMessage(
        response.message || "Registration Successful! Redirecting to login..."
      );
      setErrorMessage("");

      setTimeout(() => {
        navigate("/login"); // ✅ Step 7
      }, 3000);

    } catch (err) {
      setErrorMessage(err.message || "Registration Failed"); // ✅ Step 6
      setSuccessMessage("");
    } finally {
      setLoading(false); // stop spinner
    }
  };

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "0 auto",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "#fff",
        minHeight: "100vh",
        justifyContent: "center",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>Register</h2>

      <FormInput label="Full Name *" name="fullName" value={form.fullName} onChange={handleChange} onBlur={handleBlur} error={errors.fullName} />
      <FormInput label="Email ID *" name="email" type="email" value={form.email} onChange={handleChange} onBlur={handleBlur} error={errors.email} />
      <FormInput label="Mobile Number *" name="mobile" type="tel" value={form.mobile} onChange={handleChange} onBlur={handleBlur} error={errors.mobile} />
      <FormInput label="Date of Birth *" name="dob" type="date" value={form.dob} onChange={handleChange} onBlur={handleBlur} error={errors.dob} />
      <FormInput label="Address *" name="address" value={form.address} onChange={handleChange} onBlur={handleBlur} error={errors.address} />

      <div style={{ marginBottom: 10, width: "100%" }}>
        <select
          value={form.govIdType}
          onChange={(e) => handleChange("govIdType", e.target.value)}
          onBlur={(e) => handleBlur("govIdType", e.target.value)}
          style={{
            width: "100%",
            padding: 8,
            borderRadius: 8,
            border: errors.govIdType ? "1px solid red" : "1px solid #ccc",
          }}
        >
          <option value="">Select Government ID Type *</option>
          <option value="aadhaar">Aadhaar</option>
          <option value="pan">PAN Card</option>
          <option value="voter">Voter ID</option>
          <option value="others">Others</option>
        </select>
        {errors.govIdType && (
          <p style={{ color: "red", fontSize: 12 }}>{errors.govIdType}</p>
        )}
      </div>

      <FormInput label="Enter ID Number *" name="govIdNumber" value={form.govIdNumber} onChange={handleChange} onBlur={handleBlur} error={errors.govIdNumber} />
      <FormInput label="Password *" name="password" type="password" value={form.password} onChange={handleChange} onBlur={handleBlur} error={errors.password} />
      <FormInput label="Confirm Password *" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} onBlur={handleBlur} error={errors.confirmPassword} />

      {/* ✅ Spinner */}
      {loading && <Loader />}

      {successMessage && (
        <p style={{
          color: "green",
          fontWeight: "bold",
          marginBottom: 10,
          textAlign: "center"
        }}>
          {successMessage}
        </p>
      )}

      {errorMessage && (
        <p style={{
          color: "red",
          fontWeight: "bold",
          marginBottom: 10,
          textAlign: "center"
        }}>
          {errorMessage}
        </p>
      )}

      <button
        onClick={handleRegister}
        disabled={loading}
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 8,
          backgroundColor: "#4CAF50",
          color: "#fff",
          fontWeight: "bold",
          fontSize: 16,
          cursor: loading ? "not-allowed" : "pointer",
          marginTop: 10,
        }}
      >
        {loading ? "Registering..." : "Submit"}
      </button>

      <p
        onClick={() => navigate("/login")}
        style={{
          color: "#2196F3",
          marginTop: 20,
          cursor: "pointer",
          textAlign: "center",
          width: "100%",
        }}
      >
        Already have an account? Go to Login
      </p>
    </div>
  );
}