import axios from "axios";

// ================= ENV =================
const API_TYPE = process.env.REACT_APP_API_TYPE;

// ✅ FIXED LOGIC (REAL → REAL API, MOCK → MOCK API)
const BASE_URL =
  API_TYPE === "real"
    ? process.env.REACT_APP_REAL_API
    : process.env.REACT_APP_MOCK_API;

// ================= DEBUG =================
console.log("API TYPE:", API_TYPE);
console.log("BASE URL:", BASE_URL);

// ================= AXIOS INSTANCE =================
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// ================= REQUEST INTERCEPTOR =================
api.interceptors.request.use(
  (config) => {

    const token = localStorage.getItem("token");

    // ✅ ADD TOKEN HEADER
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error)
);
// ================= RESPONSE INTERCEPTOR =================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // 🔐 Token expired or invalid
      localStorage.removeItem("token");

      // Redirect to login
      window.location.href = "/login";
    }

    return Promise.reject({
  message:
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong",
  status: status || 500,
});
  }
);

// ================= GET =================
export const getRequest = async (url, params = {}) => {
  const response = await api.get(url, { params });
  return response.data;
};

// ================= POST =================
export const postRequest = async (url, data = {}) => {
  const response = await api.post(url, data);
  return response.data;
};

export default api;