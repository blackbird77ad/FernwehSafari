import axios from "axios";

const PRODUCTION_API_URL = "https://fernwehsafari.onrender.com/api";
const FRONTEND_HOSTS = new Set(["travellex.tours", "www.travellex.tours", "fernwehsafari.pages.dev"]);

function normalizeBaseURL(value) {
  const baseURL = String(value || "").replace(/\/+$/, "");
  return baseURL.endsWith("/api") ? baseURL : `${baseURL}/api`;
}

function isFrontendHost(hostname = "") {
  return FRONTEND_HOSTS.has(hostname) || hostname.endsWith(".fernwehsafari.pages.dev");
}

function defaultApiURL() {
  if (typeof window === "undefined") {
    return "http://localhost:5000/api";
  }

  const { hostname } = window.location;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

  return isLocalhost ? "http://localhost:5000/api" : "https://fernwehsafari.onrender.com/api";
}

function resolveApiURL(configuredURL) {
  if (typeof window === "undefined") {
    return normalizeBaseURL(configuredURL || defaultApiURL());
  }

  const fallbackURL = defaultApiURL();
  const currentHostname = window.location.hostname;
  const isLocalhost = currentHostname === "localhost" || currentHostname === "127.0.0.1";

  try {
    const candidate = configuredURL ? new window.URL(configuredURL, window.location.origin) : new window.URL(fallbackURL);

    if (!isLocalhost && isFrontendHost(candidate.hostname)) {
      return PRODUCTION_API_URL;
    }

    return normalizeBaseURL(candidate.href);
  } catch {
    return fallbackURL;
  }
}

export const apiBaseURL = resolveApiURL(import.meta.env.VITE_API_URL);

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
