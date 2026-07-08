import { postRequest, getRequest } from "./client";
import { saveLocalSearchHistory, SearchHistoryEntry } from "./history";

export async function searchDiseases(name: string) {
  if (!name) throw new Error("Missing disease name");
  return postRequest("/api/diseases/search", { name });
}

export async function getDiseaseDetailFromDiseases(id: string) {
  if (!id) throw new Error("Missing disease id");
  return getRequest(`/api/diseases/detail/${id}`);
}

export async function getSymptomDetail(id: number | string) {
  if (!id) throw new Error("Missing symptom id");
  return getRequest(`/api/diseases/symptom/${id}`);
}

export async function getDiseaseSuggestions(): Promise<{ id: number; name: string }[]> {
  const res = await getRequest("/api/diseases/suggestions");
  return res?.data ?? [];
}
