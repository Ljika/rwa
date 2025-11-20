import { Specialization } from '../../common/enums/specialization.enum';

export interface AppointmentType {
  id: string;
  name: string;
  description?: string;
  specialization: Specialization;
  price: number;
  durationMinutes: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
