export interface Drug {
  id: string;
  name: string;
  type: string;
  dosage: string;
  description?: string;
  manufacturer?: { id: string; name: string };
}
