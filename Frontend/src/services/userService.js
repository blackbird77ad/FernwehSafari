import api from "./api";

export function saveTour(tourId) {
  return api.patch(`/users/me/saved-tours/${tourId}`);
}

export function removeSavedTour(tourId) {
  return api.delete(`/users/me/saved-tours/${tourId}`);
}
