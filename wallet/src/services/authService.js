import { postRequest } from "./api";
import { signOut } from "firebase/auth";
import { auth, provider } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import { getKYCStatus } from "./kycService";

// =========================================================
// SYNC KYC STATUS
//
// Called right after login. Fetches the user's real KYC
// status from the backend rather than trusting whatever is
// already stored in localStorage.
//
// Failure here should never block login itself.
// =========================================================

export const syncKycStatus = async (userId) => {
  if (!userId) return null;

  try {
    const result = await getKYCStatus(userId);

    localStorage.setItem(
      "kycStatus",
      result.status
    );

    return result.status;
  } catch (error) {
    console.error(
      "KYC status sync failed:",
      error
    );

    return null;
  }
};


// =========================================================
// SAVE USER ACCOUNT DETAILS FOR KYC
// =========================================================

export const saveUserAccountDetails = (user = {}) => {
  try {
    // -------------------------------------------------------
    // Get email from backend user object
    // -------------------------------------------------------

    const email =
      user?.email ||
      user?.userEmail ||
      "";

    // -------------------------------------------------------
    // Get mobile from backend user object
    // Supports multiple possible field names
    // -------------------------------------------------------

    const mobile =
      user?.mobile ||
      user?.phone ||
      user?.phoneNumber ||
      user?.mobileNumber ||
      user?.registeredMobile ||
      "";

    // -------------------------------------------------------
    // Save email
    // -------------------------------------------------------

    if (email) {
      localStorage.setItem(
        "userEmail",
        String(email).trim()
      );
    }

    // -------------------------------------------------------
    // Save mobile
    // -------------------------------------------------------

    if (mobile) {
      localStorage.setItem(
        "userMobile",
        String(mobile).trim()
      );

      // Also save under registeredMobile
      // because KYCScreen checks this key too
      localStorage.setItem(
        "registeredMobile",
        String(mobile).trim()
      );
    }

    // -------------------------------------------------------
    // Save complete logged-in user
    // -------------------------------------------------------

    localStorage.setItem(
      "user",
      JSON.stringify(user)
    );

    localStorage.setItem(
      "currentUser",
      JSON.stringify(user)
    );

    return {
      email,
      mobile,
    };
  } catch (error) {
    console.error(
      "Unable to save user account details:",
      error
    );

    return {
      email: "",
      mobile: "",
    };
  }
};


// =========================================================
// REGISTER
// =========================================================

export const registerUser = async (data) => {
  try {
    // -------------------------------------------------------
    // REAL BACKEND API
    // -------------------------------------------------------

    const response = await postRequest(
      "/auth/register",
      data
    );

    // -------------------------------------------------------
    // Get user returned by backend
    // -------------------------------------------------------

    const user = response?.user || {};

    // -------------------------------------------------------
    // Save account details locally
    // -------------------------------------------------------

    saveUserAccountDetails({
      ...user,

      // Fallback to registration data if backend
      // does not return these fields
      email:
        user?.email ||
        data?.email ||
        "",

      mobile:
        user?.mobile ||
        user?.phone ||
        user?.phoneNumber ||
        user?.mobileNumber ||
        data?.mobile ||
        data?.phone ||
        data?.phoneNumber ||
        data?.mobileNumber ||
        "",
    });

    return {
      success: true,

      message:
        response?.message ||
        "Registration successful",

      user,
    };
  } catch (error) {
    console.error(
      "REGISTER API ERROR:",
      error
    );

    throw new Error(
      error?.message ||
        "Registration failed"
    );
  }
};


// =========================================================
// LOGIN
// =========================================================

export const loginUser = async ({
  email,
  password,
}) => {
  try {
    // -------------------------------------------------------
    // LOGIN API
    // -------------------------------------------------------

    const response = await postRequest(
      "/auth/login",
      {
        email,
        password,
      }
    );

    // -------------------------------------------------------
    // IMPORTANT:
    // Save JWT immediately after successful login.
    //
    // syncKycStatus() calls a protected backend endpoint,
    // so the token MUST already exist in localStorage.
    // -------------------------------------------------------

    if (!response?.token) {
      throw new Error(
        "Login succeeded but no authentication token was returned."
      );
    }

    localStorage.setItem(
      "token",
      response.token
    );

    // -------------------------------------------------------
    // Get user returned by backend
    // -------------------------------------------------------

    const user = response?.user || {};

    // -------------------------------------------------------
    // Save account details for KYC
    // -------------------------------------------------------

    saveUserAccountDetails({
      ...user,

      // Email fallback
      email:
        user?.email ||
        user?.userEmail ||
        email ||
        "",

      // Mobile fallback
      mobile:
        user?.mobile ||
        user?.phone ||
        user?.phoneNumber ||
        user?.mobileNumber ||
        user?.registeredMobile ||
        "",
    });

    // -------------------------------------------------------
    // NOW fetch real KYC status.
    //
    // The JWT has already been saved above, so
    // /kyc/status can authenticate successfully.
    // -------------------------------------------------------

    await syncKycStatus(
      user?.id ||
      user?.userId ||
      user?._id
    );

    return {
      success: true,

      message:
        response?.message ||
        "Login successful",

      user,

      token: response.token,
    };
  } catch (error) {
    console.error(
      "LOGIN API ERROR:",
      error
    );

    const status =
      error?.response?.status;

    if (status === 401) {
      throw new Error(
        "The email or password is incorrect."
      );
    }

    if (status === 403) {
      throw new Error(
        "Your account is currently unavailable."
      );
    }

    if (status === 429) {
      throw new Error(
        "Too many login attempts. Please try again later."
      );
    }

    if (status >= 500) {
      throw new Error(
        "Our server is temporarily unavailable. Please try again."
      );
    }

    if (
      error?.message
        ?.toLowerCase()
        .includes("network")
    ) {
      throw new Error(
        "Unable to connect to the server. Please check your internet connection."
      );
    }

    throw new Error(
      error?.message ||
        "Unable to sign in. Please try again."
    );
  }
};


// =========================================================
// GOOGLE LOGIN
// =========================================================
//
// TEMPORARY DEMO FLOW:
//
// 1. Firebase Google Sign-In
// 2. Get Firebase ID token
// 3. Send Firebase ID token to VECTRO backend
// 4. Backend verifies Firebase token
// 5. Backend finds or creates VECTRO user
// 6. Backend creates wallet for a new user
// 7. Backend immediately returns VECTRO JWT
// 8. Frontend stores JWT
// 9. Fetch KYC status
// 10. Login completed
//
// IMPORTANT:
//
// Google EMAIL OTP is temporarily disabled.
//
// Therefore this function does NOT:
//
// - create an OTP challenge
// - wait for an OTP
// - call /auth/google/verify-otp
// - call /auth/google/resend-otp
//
// =========================================================


// ---------------------------------------------------------
// Convert Firebase user into the user information used by
// the frontend.
// ---------------------------------------------------------

const mapFirebaseUser = (firebaseUser) => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email || "",
  name: firebaseUser.displayName || "",
  photoURL: firebaseUser.photoURL || "",
  provider: "google",
});


// =========================================================
// DIRECT GOOGLE LOGIN
// =========================================================

export const googleLogin = async () => {
  try {
    // -------------------------------------------------------
    // STEP 1
    // Sign in with Google using Firebase
    // -------------------------------------------------------

    const result = await signInWithPopup(
      auth,
      provider
    );

    const profile = mapFirebaseUser(
      result.user
    );

    // -------------------------------------------------------
    // STEP 2
    // Get Firebase ID token
    // -------------------------------------------------------

    const idToken =
      await result.user.getIdToken();

    if (!idToken) {
      throw new Error(
        "Firebase did not return a valid authentication token."
      );
    }

    // -------------------------------------------------------
    // STEP 3
    // Send Firebase token to our backend
    //
    // Backend endpoint:
    //
    // POST /auth/google
    //
    // Backend verifies the Firebase token and immediately
    // returns the VECTRO JWT.
    // -------------------------------------------------------

    const response = await postRequest(
      "/auth/google",
      {
        idToken,
      }
    );

    // -------------------------------------------------------
    // STEP 4
    // Make sure backend returned JWT
    // -------------------------------------------------------

    if (
      !response?.success ||
      !response?.token
    ) {
      throw new Error(
        response?.message ||
          "Google login failed. The server did not return an authentication token."
      );
    }

    // -------------------------------------------------------
    // STEP 5
    // Backend user is authoritative.
    //
    // Firebase profile provides Google name/photo/uid.
    // Backend provides the VECTRO user ID, email and mobile.
    // -------------------------------------------------------

    const user = {
      ...profile,
      ...(response.user || {}),
    };

    // -------------------------------------------------------
    // STEP 6
    // SAVE VECTRO JWT
    //
    // This is the important difference from the old OTP flow.
    //
    // OLD:
    //
    // Google
    //   ↓
    // OTP
    //   ↓
    // JWT
    //
    // CURRENT:
    //
    // Google
    //   ↓
    // Firebase verification
    //   ↓
    // JWT
    //
    // -------------------------------------------------------

    localStorage.setItem(
      "token",
      response.token
    );

    // -------------------------------------------------------
    // STEP 7
    // Save user information
    // -------------------------------------------------------

    saveUserAccountDetails(user);

    // -------------------------------------------------------
    // STEP 8
    // Fetch real KYC status
    //
    // JWT has already been saved above.
    // Therefore /kyc/status can authenticate successfully.
    // -------------------------------------------------------

    await syncKycStatus(
      user?.id ||
      user?.userId ||
      user?._id
    );

    // -------------------------------------------------------
    // STEP 9
    // Return completed login result
    // -------------------------------------------------------

    return {
      success: true,

      message:
        response?.message ||
        "Google login successful",

      user,

      token: response.token,
    };

  } catch (error) {
    console.error(
      "GOOGLE LOGIN ERROR:",
      error
    );

    // -------------------------------------------------------
    // Firebase-specific errors
    // -------------------------------------------------------

    const code =
      error?.code || "";

    if (
      code ===
      "auth/popup-closed-by-user"
    ) {
      throw new Error(
        "Google sign-in was closed before completing."
      );
    }

    if (
      code ===
      "auth/popup-blocked"
    ) {
      throw new Error(
        "Your browser blocked the Google sign-in popup. Please allow popups and try again."
      );
    }

    if (
      code ===
      "auth/network-request-failed"
    ) {
      throw new Error(
        "Unable to connect to Google. Please check your internet connection."
      );
    }

    if (
      code ===
      "auth/account-exists-with-different-credential"
    ) {
      throw new Error(
        "An account already exists with this email using a different sign-in method."
      );
    }

    // -------------------------------------------------------
    // Backend authentication errors
    // -------------------------------------------------------

    const status =
      error?.response?.status;

    if (status === 401) {
      throw new Error(
        error?.message ||
          "Google authentication failed. Please sign in again."
      );
    }

    if (status === 403) {
      throw new Error(
        error?.message ||
          "This Google account is not permitted to sign in."
      );
    }

    if (status === 500) {
      throw new Error(
        error?.message ||
          "Google login is not configured correctly on the server."
      );
    }

    // -------------------------------------------------------
    // General error
    // -------------------------------------------------------

    throw new Error(
      error?.message ||
        "Google login failed. Please try again."
    );
  }
};


// =========================================================
// LOGOUT
// =========================================================
//
// Signs out of Firebase in case the session was started
// through Google login.
//
// Local authentication/session data is always cleared,
// even if Firebase sign-out fails.
//
// =========================================================

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error(
      "FIREBASE SIGN-OUT ERROR:",
      error
    );
  } finally {
    // -------------------------------------------------------
    // Only clear session/auth-specific data.
    //
    // userEmail/userMobile/registeredMobile are cached
    // contact information and are intentionally retained.
    // -------------------------------------------------------

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "kycStatus"
    );

    localStorage.removeItem(
      "user"
    );

    localStorage.removeItem(
      "currentUser"
    );
  }
};