import api from "./api";

export function getUsers(params = {}) {
  return api.get("/users", { params });
}

export function createUser(payload) {
  return api.post("/users", payload);
}

export function updateUser(id, payload) {
  return api.put(`/users/${id}`, payload);
}

export function updateUserRole(id, role) {
  return api.patch(`/users/${id}/role`, { role });
}

export function updateUserSuspension(id, suspended) {
  return api.patch(`/users/${id}/suspension`, { suspended });
}

export function deleteUser(id) {
  return api.delete(`/users/${id}`);
}

export function saveTour(tourId) {
  return api.patch(`/users/me/saved-tours/${tourId}`);
}

export function removeSavedTour(tourId) {
  return api.delete(`/users/me/saved-tours/${tourId}`);
}
