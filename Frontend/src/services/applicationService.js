import api from "./api";

export function createTourCompanyApplication(payload) {
  return api.post("/applications/tour-companies", payload);
}

export function getTourCompanyApplications(params = {}) {
  return api.get("/applications/tour-companies", { params });
}

export function updateTourCompanyApplicationStatus(id, payload) {
  return api.patch(`/applications/tour-companies/${id}`, payload);
}

export function deleteTourCompanyApplication(id) {
  return api.delete(`/applications/tour-companies/${id}`);
}
