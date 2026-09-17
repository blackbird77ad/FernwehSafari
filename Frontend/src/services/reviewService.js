import api from "./api";

export function getTourReviews(tourId) {
  return api.get(`/reviews/tour/${tourId}`);
}

export function createTourReview(payload) {
  return api.post("/reviews", payload);
}

export function getReviews(params = {}) {
  return api.get("/reviews", { params });
}

export function reviewTourReview(id, payload) {
  return api.patch(`/reviews/${id}/review`, payload);
}
