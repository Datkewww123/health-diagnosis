import { getRequest, postRequest } from "./client";

export interface BookingData {
  doctor_id: number;
  hospital_id: number;
  disease_id?: number | string | null;
  disease_name?: string;
  appointment_date: string;
  appointment_time: string;
  notes?: string;
  payment_type?: 'service' | 'insurance';
  insurance_card_number?: string;
}

export async function getNearbyHospitals(latitude: number, longitude: number, department?: string) {
  let url = `/api/appointments/nearby-hospitals?latitude=${latitude}&longitude=${longitude}`;
  if (department) {
    url += `&department=${encodeURIComponent(department)}`;
  }
  return getRequest(url);
}

export async function getDoctorsByHospital(hospitalId: number | string, specialty?: string) {
  let url = `/api/appointments/hospitals/${hospitalId}/doctors`;
  if (specialty) {
    url += `?specialty=${encodeURIComponent(specialty)}`;
  }
  return getRequest(url);
}

export async function bookAppointment(bookingData: BookingData) {
  return postRequest("/api/appointments/book", bookingData);
}

export async function getMyAppointments() {
  return getRequest("/api/appointments/my-appointments");
}

export async function getDoctorAppointments() {
  return getRequest("/api/appointments/doctor-appointments");
}

export async function updateAppointmentStatus(id: number, status: string) {
  return postRequest(`/api/appointments/${id}/status`, { status }, { method: "PUT" });
}

export async function getPatientHealthProfile(userId: number) {
  return getRequest(`/api/appointments/patient-health/${userId}`);
}

