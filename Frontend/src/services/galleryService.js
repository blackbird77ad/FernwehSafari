import api from "./api";

export function getGalleryMedia() {
  return api.get("/gallery");
}

export function getAdminGalleryMedia(params = {}) {
  return api.get("/gallery/admin", { params });
}

export function createGalleryMedia(payload) {
  return api.post("/gallery", payload);
}

export function updateGalleryMedia(id, payload) {
  return api.put(`/gallery/${id}`, payload);
}

export function reviewGalleryMedia(id, payload) {
  return api.patch(`/gallery/${id}/review`, payload);
}

export function deleteGalleryMedia(id) {
  return api.delete(`/gallery/${id}`);
}
