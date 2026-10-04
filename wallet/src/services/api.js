import axios from "axios";

// =====================================================
// ENVIRONMENT CONFIGURATION
// =====================================================

const API_TYPE =
  process.env.REACT_APP_API_TYPE || "real";

const REAL_API =
  process.env.REACT_APP_REAL_API ||
  "http://127.0.0.1:8000";

const MOCK_API =
  process.env.REACT_APP_MOCK_API ||
  "http://localhost:5000";

const BASE_URL =
  API_TYPE === "real"
    ? REAL_API
    : MOCK_API;

// =====================================================
// DEBUG
// =====================================================

console.log("=================================");
console.log("API TYPE:", API_TYPE);
console.log("BASE URL:", BASE_URL);
console.log("=================================");

// =====================================================
// AXIOS INSTANCE
// =====================================================

const api = axios.create({
  baseURL: BASE_URL,

  // KYC can involve OCR + DeepFace + file uploads.
  // 2 minutes gives the backend enough time.
  timeout: 120000,
});

// =====================================================
// REQUEST INTERCEPTOR
// =====================================================

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token");

    // -------------------------------------------------
    // JWT AUTHORIZATION
    // -------------------------------------------------

    if (token) {
      config.headers =
        config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    // -------------------------------------------------
    // CONTENT TYPE
    // -------------------------------------------------
    //
    // IMPORTANT:
    // Do NOT manually set multipart/form-data.
    //
    // Axios automatically adds:
    // multipart/form-data; boundary=...
    //
    // when FormData is used.
    // -------------------------------------------------

    if (!(config.data instanceof FormData)) {
      config.headers =
        config.headers || {};

      config.headers["Content-Type"] =
        "application/json";
    }

    return config;
  },

  (error) =>
    Promise.reject(error)
);

// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status =
      error?.response?.status;

    const requestUrl =
      error?.config?.url || "";

    // -------------------------------------------------
    // LOGIN REQUEST
    // -------------------------------------------------
    //
    // Login 401 means invalid credentials.
    // Do not redirect because the user is already
    // on the login screen.
    // -------------------------------------------------

    const isLoginRequest =
      requestUrl.includes("/auth/login");

    // -------------------------------------------------
    // EXPIRED / INVALID SESSION
    // -------------------------------------------------

    if (
      status === 401 &&
      !isLoginRequest
    ) {
      localStorage.removeItem("token");

      // Clear local user information.
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userId");

      // Redirect to login.
      window.location.href =
        "/login";
    }

    // -------------------------------------------------
    // NORMALIZED ERROR
    // -------------------------------------------------

    const normalizedError = {
      message:
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong",

      status:
        status || 500,

      response:
        error?.response,
    };

    return Promise.reject(
      normalizedError
    );
  }
);

// =====================================================
// GET REQUEST
// =====================================================

export const getRequest = async (
  url,
  params = {}
) => {
  const response =
    await api.get(url, {
      params,
    });

  return response.data;
};

// =====================================================
// POST REQUEST
// =====================================================

export const postRequest = async (
  url,
  data = {}
) => {
  const response =
    await api.post(
      url,
      data
    );

  return response.data;
};

// =====================================================
// DEFAULT EXPORT
// =====================================================

export default api;