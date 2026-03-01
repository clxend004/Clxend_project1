import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Example API calls
export const loginUser = (data) => API.post("/login", data);
export const registerUser = (data) => API.post("/register", data);

export default API;