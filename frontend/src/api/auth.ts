import { postRequest } from "./client";

export async function signup(params: any) {
  const { First_name, Last_name, Username, phone, email, password, confirm, confirm_password, address, gender, date_of_birth, height, weight } = params;
  return postRequest("/api/auth/signup", {
    First_name,
    Last_name,
    Username,
    phone,
    email,
    password,
    confirm: confirm || confirm_password,
    address,
    ...(gender && { gender }),
    ...(date_of_birth && { date_of_birth }),
    ...(height && { height: Number(height) }),
    ...(weight && { weight: Number(weight) }),
  });
}

export async function login(params: any) {
  const { Username, password } = params;
  return postRequest("/api/auth/login", { Username, password });
}

export async function forgotPassword(params: any) {
  const { email } = params;
  return postRequest("/api/auth/forgotpassword", { email });
}

export async function verifyOtp(params: any) {
  const { email, otp } = params;
  return postRequest("/api/auth/verifyotp", { email, otp });
}

export async function resetPassword(params: any) {
  const { email, otp, newPassword } = params;
  return postRequest("/api/auth/resetpassword", { email, otp, newPassword });
}
