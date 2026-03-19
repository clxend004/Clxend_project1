import { getRequest, postRequest } from "./api";

// Register
export const registerUser = async (data) => {
  try {
    const response = await postRequest("users", data);

    return {
      success: true,
      message: "Registration successful",
      user: response,
    };
  } catch (error) {
    throw new Error(error.message || "Registration failed");
  }
};

// Login
export const loginUser = async ({ email, password }) => {
  try {
    const users = await getRequest("users");

    const user = users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password
    );

    if (!user) {
      throw new Error("Invalid credentials");
    }

    return {
      success: true,
      message: "Login successful",
      user,
    };
  } catch (error) {
    throw new Error(error.message || "Login failed");
  }
};