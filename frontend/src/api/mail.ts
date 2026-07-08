import { postRequest } from "./client";

export async function sendLeaveRequest(leaveData: any) {
  try {
    const data = await postRequest("/api/mail/sendemail", leaveData);
    return data;
  } catch (err) {
    console.error("[sendLeaveRequest] Failed:", err);
    throw err;
  }
}
