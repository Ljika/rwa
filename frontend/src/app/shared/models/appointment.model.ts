export enum TimeSlot {
  SLOT_08_00 = '08:00',
  SLOT_08_30 = '08:30',
  SLOT_09_00 = '09:00',
  SLOT_09_30 = '09:30',
  SLOT_10_00 = '10:00',
  SLOT_10_30 = '10:30',
  SLOT_11_00 = '11:00',
  SLOT_11_30 = '11:30',
  SLOT_12_00 = '12:00',
  SLOT_12_30 = '12:30',
  SLOT_13_00 = '13:00',
  SLOT_13_30 = '13:30',
  SLOT_14_00 = '14:00',
  SLOT_14_30 = '14:30',
  SLOT_15_00 = '15:00',
  SLOT_15_30 = '15:30',
  SLOT_16_00 = '16:00',
  SLOT_16_30 = '16:30',
  SLOT_17_00 = '17:00',
  SLOT_17_30 = '17:30',
  SLOT_18_00 = '18:00',
  SLOT_18_30 = '18:30',
  SLOT_19_00 = '19:00',
  SLOT_19_30 = '19:30',
  SLOT_20_00 = '20:00',
  SLOT_20_30 = '20:30',
  SLOT_21_00 = '21:00',
  SLOT_21_30 = '21:30',
  SLOT_22_00 = '22:00',
  SLOT_22_30 = '22:30',
  SLOT_23_00 = '23:00',
  SLOT_23_30 = '23:30',
  SLOT_00_00 = '00:00',
  SLOT_00_30 = '00:30',
  SLOT_01_00 = '01:00',
  SLOT_01_30 = '01:30',
  SLOT_02_00 = '02:00',
  SLOT_02_30 = '02:30',
  SLOT_03_00 = '03:00',
  SLOT_03_30 = '03:30',
  SLOT_04_00 = '04:00',
  SLOT_04_30 = '04:30',
  SLOT_05_00 = '05:00',
  SLOT_05_30 = '05:30',
  SLOT_06_00 = '06:00',
  SLOT_06_30 = '06:30',
  SLOT_07_00 = '07:00',
  SLOT_07_30 = '07:30',
}

export enum AppointmentStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Cancelled = 'Cancelled',
  Completed = 'Completed'
}

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  date: string;
  timeSlot: TimeSlot;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  doctor?: any;
  patient?: any;
  createdAt: string;
  updatedAt: string;
}
