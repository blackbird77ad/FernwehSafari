import axios from "axios";

function normalizeBaseURL(value) {
  const baseURL = String(value || "").replace(/\/+$/, "");
  return baseURL.endsWith("/api") ? baseURL : `${baseURL}/api`;
}

function defaultApiURL() {
  if (typeof window === "undefined") {
    return "http://localhost:5000/api";
  }

  const { hostname } = window.location;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

  return isLocalhost ? "http://localhost:5000/api" : "https://fernwehsafari.onrender.com/api";
}

export const apiBaseURL = normalizeBaseURL(import.meta.env.VITE_API_URL || defaultApiURL());

const api = axios.create({
  baseURL: apiBaseURL
});

const TOKEN_KEY = "travellex_token";
const LEGACY_TOKEN_KEY = ["fernweh", "token"].join("_");

function getStoredToken() {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    return token;
  }

  const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);

  if (legacyToken) {
    localStorage.setItem(TOKEN_KEY, legacyToken);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  }

  return legacyToken;
}

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || "Something went wrong.";
    return Promise.reject(new Error(message));
  }
);

export default api;
