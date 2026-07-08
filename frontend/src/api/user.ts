import { baseURL, getRequest, getToken } from "./client";

export async function getUserProfile() {
  return getRequest("/api/user/getUser");
}

export async function updateUserProfile(profileData: any) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const authToken = localStorage.getItem("token") || getToken();
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const res = await fetch(baseURL + "/api/user/updateUser", {
      method: "PATCH",
      headers,
      body: JSON.stringify(profileData),
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
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw err;
  }
}
