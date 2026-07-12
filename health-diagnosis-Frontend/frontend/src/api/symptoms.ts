import { postRequest, getRequest } from "./client";

export async function predictSymptoms(symptoms: string[] | string) {
  const payload = Array.isArray(symptoms) ? { symptoms } : { symptoms: [symptoms] };
  const res = await postRequest("/api/symptoms/check", payload);
  return res;
}

export async function getSymptomsList() {
  return getRequest("/api/symptoms");
}
