import axios from "axios";

// Use environment variable for React
const BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://mock-api.walletapp.com/api";

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor (for future token support)
api.interceptors.request.use(
  (config) => {
    // Example: attach token if available
    // const token = localStorage.getItem("token");
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor (centralized error handling)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const structuredError = {
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        "Something went wrong",
      status: error.response?.status || 500,
    };
    return Promise.reject(structuredError);
  },
);

// Reusable GET method
export const getRequest = async (url, params = {}) => {
  const response = await api.get(url, { params });
  return response.data;
};

// Reusable POST method
export const postRequest = async (url, data = {}) => {
  const response = await api.post(url, data);
  return response.data;
};

export default api;
