import { getRequest, postRequest } from "./client";

export async function getAllDiseases() {
  return getRequest("/api/admin/all");
}

export async function getAdminDiseaseDetail(id: string) {
  return getRequest(`/api/admin/disease/${id}`);
}

export async function syncHospitalsFromOverpass() {
  return postRequest("/api/admin/hospitals/sync-overpass");
}
