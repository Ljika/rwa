export interface MedicalHistory {
  id: string;
  diagnosis: string;
  notes: string;
  createdAt: string;
  updatedAt?: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
}
