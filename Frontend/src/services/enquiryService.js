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

export function getPartnerEnquiries() {
  return api.get("/enquiries/partner");
}

export function updateEnquiryStatus(id, status) {
  return api.patch(`/enquiries/${id}`, { status });
}

export function archiveEnquiry(id, payload = {}) {
  return api.patch(`/enquiries/${id}/archive`, payload);
}

export function deleteEnquiry(id) {
  return api.delete(`/enquiries/${id}`);
}

export function sendEnquiryMessage(id, payload) {
  return api.post(`/enquiries/${id}/message`, payload);
}

export function replyToPartnerEnquiry(id, payload) {
  return api.post(`/enquiries/${id}/partner-reply`, payload);
}
