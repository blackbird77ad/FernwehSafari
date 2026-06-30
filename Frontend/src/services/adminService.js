import api from "./api";

export function getAdminDashboardSummary() {
  return api.get("/admin/dashboard");
}
