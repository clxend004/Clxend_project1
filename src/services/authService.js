// Register user and save in localStorage
export const registerUser = async ({ email, password }) => {
  if (!email || !password) throw new Error("Email and password required");

  // Save the user in localStorage
  localStorage.setItem(
    "registeredUser",
    JSON.stringify({ email: email.trim().toLowerCase(), password })
  );

  return { message: "User registered successfully" };
};

// Login user and validate
export const loginUser = async ({ email, password }) => {
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
    return true; // login success
  } else {
    throw new Error("Wrong username or password"); // login failed
  }
};