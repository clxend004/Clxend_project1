// Register user and save in localStorage
export const registerUser = async ({ email, password }) => {
  try {
    if (!email || !password) {
      throw new Error("Email and password required");
    }

    // Save the user in localStorage
    localStorage.setItem(
      "registeredUser",
      JSON.stringify({ email: email.trim().toLowerCase(), password })
    );

    return {
      success: true,
      message: "User registered successfully",
    };
  } catch (error) {
    throw new Error(error.message || "Registration failed");
  }
};

// Login user and validate
export const loginUser = async ({ email, password }) => {
  try {
    const storedUser = localStorage.getItem("registeredUser");

    if (!storedUser) {
      throw new Error("No registered user found");
    }

    const parsedUser = JSON.parse(storedUser);

    if (
      parsedUser &&
      email.trim().toLowerCase() === parsedUser.email &&
      password === parsedUser.password
    ) {
      return {
        success: true,
        message: "Login successful",
      };
    } else {
      throw new Error("Wrong username or password");
    }
  } catch (error) {
    throw new Error(error.message || "Login failed");
  }
};