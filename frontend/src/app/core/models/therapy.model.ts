export interface TherapyDrug {
  id: string;
  therapyId: string;
  drugId: string;
  timesPerDay: number;
  durationDays: number;
  instructions?: string;
  drug?: {
    id: string;
    name: string;
    type: string;
    dosage: string;
    description?: string;
  };
}

export interface Therapy {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  notes?: string;
  prescribedAt: string;
  therapyDrugs: TherapyDrug[];
  patient?: any;
  doctor?: any;
  appointment?: any;
  createdAt: string;
  updatedAt: string;
}
