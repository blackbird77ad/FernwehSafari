import api from "./api";

export function getTours(params = {}) {
  return api.get("/tours", { params });
}

export function getTour(slug) {
  return api.get(`/tours/${slug}`);
}

export function createTour(payload) {
  return api.post("/tours", payload);
}

export function updateTour(id, payload) {
  return api.put(`/tours/${id}`, payload);
}

export function deleteTour(id) {
  return api.delete(`/tours/${id}`);
}
