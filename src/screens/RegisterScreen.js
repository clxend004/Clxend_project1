import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";

// Modular input component
function FormInput({ label, name, type = "text", value, onChange, onBlur, error }) {
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
    govId: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "fullName":
        if (!value) error = "Full Name is required";
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
      case "govId":
        if (!value) error = "Government ID is required";
        break;
      case "password":
        if (!value) error = "Password is required";
        else if (value.length < 6)
          error = "Password must be at least 6 characters";
        break;
      case "confirmPassword":
        if (!value) error = "Confirm your password";
        else if (value !== form.password) error = "Passwords do not match";
        break;
      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value });
  };

  const handleRegister = async () => {
    // Validate all fields
    Object.keys(form).forEach((key) => validateField(key, form[key]));
    const hasErrors = Object.values(errors).some((e) => e !== "");
    if (hasErrors) {
      alert("Please fix validation errors");
      return;
    }

    try {
      await registerUser({ email: form.email, password: form.password });
      alert("Registration Successful!");
      navigate("/login");
    } catch (err) {
      alert("Registration Failed: " + err.message);
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

      <FormInput
        label="Full Name"
        name="fullName"
        value={form.fullName}
        onChange={handleChange}
        onBlur={validateField}
        error={errors.fullName}
      />
      <FormInput
        label="Email ID"
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        onBlur={validateField}
        error={errors.email}
      />
      <FormInput
        label="Mobile Number"
        name="mobile"
        type="tel"
        value={form.mobile}
        onChange={handleChange}
        onBlur={validateField}
        error={errors.mobile}
      />
      <FormInput
        label="Date of Birth"
        name="dob"
        type="date"
        value={form.dob}
        onChange={handleChange}
        onBlur={validateField}
        error={errors.dob}
      />
      <FormInput
        label="Address"
        name="address"
        value={form.address}
        onChange={handleChange}
        onBlur={validateField}
        error={errors.address}
      />
      <FormInput
        label="Government ID"
        name="govId"
        value={form.govId}
        onChange={handleChange}
        onBlur={validateField}
        error={errors.govId}
      />
      <FormInput
        label="Password"
        name="password"
        type="password"
        value={form.password}
        onChange={handleChange}
        onBlur={validateField}
        error={errors.password}
      />
      <FormInput
        label="Confirm Password"
        name="confirmPassword"
        type="password"
        value={form.confirmPassword}
        onChange={handleChange}
        onBlur={validateField}
        error={errors.confirmPassword}
      />

      <button
        onClick={handleRegister}
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 8,
          backgroundColor: "#4CAF50",
          color: "#fff",
          fontWeight: "bold",
          fontSize: 16,
          cursor: "pointer",
          marginTop: 15,
        }}
      >
        Submit
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