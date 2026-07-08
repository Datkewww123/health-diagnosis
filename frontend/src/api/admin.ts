import { baseURL, getRequest, getToken, postRequest } from "./client";

export async function createDisease(diseaseData: any) {
  return postRequest("/api/admin/disease", diseaseData);
}

export async function updateDisease(id: string, diseaseData: any) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const authToken = localStorage.getItem("token") || getToken();
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const res = await fetch(baseURL + `/api/admin/disease/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(diseaseData),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (!res.ok) {
      let msg = `HTTP error! status: ${res.status}`;
      try {
        const err = await res.json();
        msg = err.message || msg;
      } catch {
        // ignore parse error
      }
      throw new Error(msg);
    }
    return await res.json();
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getAllDiseases() {
  return getRequest("/api/admin/all");
}

export async function getAdminDiseaseDetail(id: string) {
  return getRequest(`/api/admin/disease/${id}`);
}

export async function deleteDisease(id: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const headers: Record<string, string> = {};
    const authToken = localStorage.getItem("token") || getToken();
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const res = await fetch(baseURL + `/api/admin/disease/${id}`, {
      method: "DELETE",
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (!res.ok) {
      let msg = `HTTP error! status: ${res.status}`;
      try {
        const err = await res.json();
        msg = err.message || msg;
      } catch {
        // ignore parse error
      }
      throw new Error(msg);
    }
    return await res.json();
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
