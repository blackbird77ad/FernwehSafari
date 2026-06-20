import api from "./api";

export function createEnquiry(payload) {
  return api.post("/enquiries", payload);
}

export function getEnquiries() {
  return api.get("/enquiries");
}

export function getMyEnquiries() {
  return api.get("/enquiries/me");
}

export function updateEnquiryStatus(id, status) {
  return api.patch(`/enquiries/${id}`, { status });
}
