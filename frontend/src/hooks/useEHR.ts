import axios from 'axios';

const BASE_URL = 'http://localhost:4000/api';

const ehrService = {
  // ── Patients ───────────────────────────────────────────────────────────────
  registerPatient: (data: any) => axios.post(`${BASE_URL}/patients/register`, data),
  getPatient: (id: string) => axios.get(`${BASE_URL}/patients/${id}`),
  getPatientRecords: (id: string) => axios.get(`${BASE_URL}/patients/${id}/records`),
  getPatientPrescriptions: (id: string) => axios.get(`${BASE_URL}/patients/${id}/prescriptions`),
  getPatientAudit: (id: string) => axios.get(`${BASE_URL}/patients/${id}/audit`),
  grantAccess: (id: string, data: any) => axios.post(`${BASE_URL}/patients/${id}/access/grant`, data),
  revokeAccess: (id: string, data: any) => axios.post(`${BASE_URL}/patients/${id}/access/revoke`, data),

  // ── Doctors ────────────────────────────────────────────────────────────────
  registerDoctor: (data: any) => axios.post(`${BASE_URL}/doctors/register`, data),
  getDoctor: (id: string) => axios.get(`${BASE_URL}/doctors/${id}`),
  verifyDoctor: (id: string) => axios.patch(`${BASE_URL}/doctors/${id}/verify`, {}),

  // ── Records ────────────────────────────────────────────────────────────────
  createRecord: (formData: FormData) => axios.post(`${BASE_URL}/records`, formData),
  getRecord: (id: string) => axios.get(`${BASE_URL}/records/${id}`),
  getRecordHistory: (id: string) => axios.get(`${BASE_URL}/records/${id}/history`),

  // ── Prescriptions ──────────────────────────────────────────────────────────
  createPrescription: (data: any) => axios.post(`${BASE_URL}/prescriptions`, data),
  getPrescription: (id: string) => axios.get(`${BASE_URL}/prescriptions/${id}`),
  dispensePrescription: (id: string) => axios.patch(`${BASE_URL}/prescriptions/${id}/dispense`, {}),

  // ── Admin ──────────────────────────────────────────────────────────────────
  getAllPatients: () => axios.get(`${BASE_URL}/admin/patients`),
  getAllDoctors: () => axios.get(`${BASE_URL}/admin/doctors`),
  getStats: () => axios.get(`${BASE_URL}/admin/stats`),

  // ── Current User Specialized ───────────────────────────────────────────────
  getMyPatients: () => axios.get(`${BASE_URL}/doctors/my/patients`),
  getDoctorAuthoredRecords: () => axios.get(`${BASE_URL}/doctors/my/records`),
  getMyRecords: () => axios.get(`${BASE_URL}/patients/my/records`),
  getMyPrescriptions: () => axios.get(`${BASE_URL}/patients/my/prescriptions`),
  getMyAppointments: () => axios.get(`${BASE_URL}/patients/my/appointments`),
  getMyBilling: () => axios.get(`${BASE_URL}/patients/my/billing`),
  getMyVitals: () => axios.get(`${BASE_URL}/patients/my/vitals`),

  // ── Utilities ──────────────────────────────────────────────────────────────
  getFabricStatus: () => axios.get(`${BASE_URL}/fabric/status`),
};

export const useEHR = () => {
  return ehrService;
};
