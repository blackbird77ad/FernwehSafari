import api from "./api";

export function getCommissionSettings() {
  return api.get("/settings/commission");
}

export function updateCommissionSettings(payload) {
  return api.put("/settings/commission", payload);
}
