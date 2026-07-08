import { getRequest } from "./client";

export async function getDailyDashboardData() {
  return getRequest("/api/dashboard/daily");
}
