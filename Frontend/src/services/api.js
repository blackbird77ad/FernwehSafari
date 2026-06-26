import axios from "axios";

const PRODUCTION_API_URL = "https://fernwehsafari.onrender.com/api";

function cleanConfiguredURL(value) {
  const rawValue = String(value || "").trim().replace(/^['"]|['"]$/g, "");
  const envAssignmentMatch = rawValue.match(/^VITE_API_URL\s*=\s*(.+)$/i);
  const nextValue = envAssignmentMatch ? envAssignmentMatch[1].trim().replace(/^['"]|['"]$/g, "") : rawValue;
  const absoluteUrlMatch = nextValue.match(/https?:\/\/.+$/i);

  return absoluteUrlMatch ? absoluteUrlMatch[0] : nextValue;
}

function normalizeBaseURL(value) {
  const baseURL = cleanConfiguredURL(value).replace(/\/+$/, "");
  const apiPathIndex = baseURL.indexOf("/api/");

  if (apiPathIndex !== -1) {
    return baseURL.slice(0, apiPathIndex + 4);
  }

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

function resolveApiURL(configuredURL) {
  const cleanedConfiguredURL = cleanConfiguredURL(configuredURL);

  if (typeof window === "undefined") {
    return normalizeBaseURL(cleanedConfiguredURL || defaultApiURL());
  }

  const fallbackURL = defaultApiURL();
  const currentHostname = window.location.hostname;
  const isLocalhost = currentHostname === "localhost" || currentHostname === "127.0.0.1";

  if (!isLocalhost) {
    return PRODUCTION_API_URL;
  }

  try {
    const candidate = cleanedConfiguredURL ? new window.URL(cleanedConfiguredURL, window.location.origin) : new window.URL(fallbackURL);
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
