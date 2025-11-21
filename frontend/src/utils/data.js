// src/utils/axiosInstance.js
import axios from "axios";
import { BASE_URL } from "./apiPaths";

// Create axios instance
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 80000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ================================
// 🔹 REQUEST INTERCEPTOR
// ================================
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("token");

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ================================
// 🔹 RESPONSE INTERCEPTOR
// ================================
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Token expired / unauthorized
    if (error.response && error.response.status === 401) {
      // Optional: logout, redirect, clear storage
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
