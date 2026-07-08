import { postRequest } from "./api";

// ================= REGISTER =================
export const registerUser = async (data) => {
  try {
    // REAL BACKEND API
    const response = await postRequest("/auth/register", data);

    return {
      success: true,
      message: response.message || "Registration successful",
      user: response.user,
    };
  } catch (error) {
    throw new Error(error.message || "Registration failed");
  }
};

// ================= LOGIN =================
export const loginUser = async ({ email, password }) => {
  try {
    const response = await postRequest("/auth/login", {
      email,
      password,
    });

    return {
      success: true,
      message: response.message || "Login successful",
      user: response.user,
      token: response.token,   // ✅ ADD THIS LINE ONLY
    };
  } catch (error) {
    throw new Error(error.message || "Invalid credentials");
  }
};