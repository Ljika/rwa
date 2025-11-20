export interface DrugAllergy {
  id: string;
  drugId: string;
  allergyId: string;
  createdAt: Date;
  updatedAt: Date;
  allergy?: {
    id: string;
    name: string;
  };
}
