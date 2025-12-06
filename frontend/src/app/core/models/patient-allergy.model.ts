export interface PatientAllergy {
  id: string;
  patientId: string;
  allergyId: string;
  diagnosedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  allergy?: {
    id: string;
    name: string;
  };
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}
