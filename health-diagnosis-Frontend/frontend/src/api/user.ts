import { getRequest, postRequest } from "./client";

export async function getUserProfile() {
  return getRequest("/api/user/getUser");
}

export async function updateUserProfile(profileData: any) {
  return postRequest("/api/user/updateUser", profileData, { method: 'PATCH' });
}
