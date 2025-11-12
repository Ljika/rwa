export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  isActive: boolean;
  createdAt: string;
}

export interface DoctorPatientLink {
  id: string;
  doctorId: string;
  patientId: string;
  createdAt: string;
  doctor: Doctor;
}
