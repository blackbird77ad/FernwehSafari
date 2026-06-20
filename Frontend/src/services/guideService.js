import api from "./api";

export function createGuideApplication(payload) {
  return api.post("/guides/applications", payload);
}

export function getGuideApplications(params = {}) {
  return api.get("/guides/applications", { params });
}

export function decideGuideApplicationByCompany(id, payload) {
  return api.patch(`/guides/applications/${id}/company-decision`, payload);
}

export function decideGuideApplicationByAdmin(id, payload) {
  return api.patch(`/guides/applications/${id}/admin-decision`, payload);
}

export function createGuideBooking(payload) {
  return api.post("/guides/bookings", payload);
}

export function getGuideBookings(params = {}) {
  return api.get("/guides/bookings", { params });
}

export function updateGuideBookingStatus(id, status) {
  return api.patch(`/guides/bookings/${id}`, { status });
}
