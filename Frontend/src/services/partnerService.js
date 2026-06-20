import api from "./api";

export function getPartners(params = {}) {
  return api.get("/partners", { params });
}

export function createPartner(payload) {
  return api.post("/partners", payload);
}

export function updatePartner(id, payload) {
  return api.put(`/partners/${id}`, payload);
}

export function deletePartner(id) {
  return api.delete(`/partners/${id}`);
}
