import { getRequest } from "./client";

export async function getAllDiseases() {
  return getRequest("/api/admin/all");
}

export async function getAdminDiseaseDetail(id: string) {
  return getRequest(`/api/admin/disease/${id}`);
}
