import api from "./api";

export function createReferral(payload) {
  return api.post("/referrals", payload);
}

export function getReferrals() {
  return api.get("/referrals");
}

export function getMyReferrals() {
  return api.get("/referrals/me");
}

export function getBookingSession(trackingCode) {
  return api.get(`/referrals/booking/${encodeURIComponent(trackingCode)}`);
}

export function getBookingOpenURL(trackingCode) {
  const baseURL = api.defaults.baseURL || "";
  return `${baseURL}/referrals/booking/${encodeURIComponent(trackingCode)}/open`;
}

export function markReferralConverted(id, payload = {}) {
  return api.patch(`/referrals/${id}`, payload);
}

export function reconcileReferralByTrackingCode(trackingCode, payload = {}) {
  return api.patch(`/referrals/tracking/${encodeURIComponent(trackingCode)}`, payload);
}
