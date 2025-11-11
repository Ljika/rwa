import { Shift } from './shift.enum';

export enum TimeSlot {
  // Morning shift (08:00 - 16:00)
  Slot_08_00 = '08:00',
  Slot_08_30 = '08:30',
  Slot_09_00 = '09:00',
  Slot_09_30 = '09:30',
  Slot_10_00 = '10:00',
  Slot_10_30 = '10:30',
  Slot_11_00 = '11:00',
  Slot_11_30 = '11:30',
  Slot_12_00 = '12:00',
  Slot_12_30 = '12:30',
  Slot_13_00 = '13:00',
  Slot_13_30 = '13:30',
  Slot_14_00 = '14:00',
  Slot_14_30 = '14:30',
  Slot_15_00 = '15:00',
  Slot_15_30 = '15:30',

  // Afternoon shift (16:00 - 00:00)
  Slot_16_00 = '16:00',
  Slot_16_30 = '16:30',
  Slot_17_00 = '17:00',
  Slot_17_30 = '17:30',
  Slot_18_00 = '18:00',
  Slot_18_30 = '18:30',
  Slot_19_00 = '19:00',
  Slot_19_30 = '19:30',
  Slot_20_00 = '20:00',
  Slot_20_30 = '20:30',
  Slot_21_00 = '21:00',
  Slot_21_30 = '21:30',
  Slot_22_00 = '22:00',
  Slot_22_30 = '22:30',
  Slot_23_00 = '23:00',
  Slot_23_30 = '23:30',

  // Night shift (00:00 - 08:00)
  Slot_00_00 = '00:00',
  Slot_00_30 = '00:30',
  Slot_01_00 = '01:00',
  Slot_01_30 = '01:30',
  Slot_02_00 = '02:00',
  Slot_02_30 = '02:30',
  Slot_03_00 = '03:00',
  Slot_03_30 = '03:30',
  Slot_04_00 = '04:00',
  Slot_04_30 = '04:30',
  Slot_05_00 = '05:00',
  Slot_05_30 = '05:30',
  Slot_06_00 = '06:00',
  Slot_06_30 = '06:30',
  Slot_07_00 = '07:00',
  Slot_07_30 = '07:30',
}

// Helper funkcija da se dobiju slotovi za određenu smenu
export const getTimeSlotsByShift = (shift: Shift): TimeSlot[] => {
  switch (shift) {
    case Shift.Morning:
      return [
        TimeSlot.Slot_08_00, TimeSlot.Slot_08_30, TimeSlot.Slot_09_00, TimeSlot.Slot_09_30,
        TimeSlot.Slot_10_00, TimeSlot.Slot_10_30, TimeSlot.Slot_11_00, TimeSlot.Slot_11_30,
        TimeSlot.Slot_12_00, TimeSlot.Slot_12_30, TimeSlot.Slot_13_00, TimeSlot.Slot_13_30,
        TimeSlot.Slot_14_00, TimeSlot.Slot_14_30, TimeSlot.Slot_15_00, TimeSlot.Slot_15_30,
      ];
    case Shift.Afternoon:
      return [
        TimeSlot.Slot_16_00, TimeSlot.Slot_16_30, TimeSlot.Slot_17_00, TimeSlot.Slot_17_30,
        TimeSlot.Slot_18_00, TimeSlot.Slot_18_30, TimeSlot.Slot_19_00, TimeSlot.Slot_19_30,
        TimeSlot.Slot_20_00, TimeSlot.Slot_20_30, TimeSlot.Slot_21_00, TimeSlot.Slot_21_30,
        TimeSlot.Slot_22_00, TimeSlot.Slot_22_30, TimeSlot.Slot_23_00, TimeSlot.Slot_23_30,
      ];
    case Shift.Night:
      return [
        TimeSlot.Slot_00_00, TimeSlot.Slot_00_30, TimeSlot.Slot_01_00, TimeSlot.Slot_01_30,
        TimeSlot.Slot_02_00, TimeSlot.Slot_02_30, TimeSlot.Slot_03_00, TimeSlot.Slot_03_30,
        TimeSlot.Slot_04_00, TimeSlot.Slot_04_30, TimeSlot.Slot_05_00, TimeSlot.Slot_05_30,
        TimeSlot.Slot_06_00, TimeSlot.Slot_06_30, TimeSlot.Slot_07_00, TimeSlot.Slot_07_30,
      ];
  }
};
