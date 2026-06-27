import api from "./api";

export function login(credentials) {
  return api.post("/auth/login", credentials);
}

export function register(payload) {
  return api.post("/auth/register", payload);
}

export function verifyEmail(token) {
  return api.post("/auth/verify-email", { token });
}

export function resendVerification(email) {
  return api.post("/auth/resend-verification", { email });
}

export function requestPasswordReset(email) {
  return api.post("/auth/forgot-password", { email });
}

export function resetPassword(payload) {
  return api.post("/auth/reset-password", payload);
}

export function getMe() {
  return api.get("/auth/me");
}
