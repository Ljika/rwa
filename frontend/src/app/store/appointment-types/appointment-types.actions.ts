import { createAction, props } from '@ngrx/store';
import { AppointmentType } from '../../core/models/appointment-type.model';

// Load All
export const loadAppointmentTypes = createAction('[AppointmentTypes] Load AppointmentTypes');
export const loadAppointmentTypesSuccess = createAction(
  '[AppointmentTypes] Load AppointmentTypes Success',
  props<{ appointmentTypes: AppointmentType[] }>()
);
export const loadAppointmentTypesFailure = createAction(
  '[AppointmentTypes] Load AppointmentTypes Failure',
  props<{ error: string }>()
);

// Load By Specialization
export const loadAppointmentTypesBySpecialization = createAction(
  '[AppointmentTypes] Load By Specialization',
  props<{ specialization: string }>()
);
export const loadAppointmentTypesBySpecializationSuccess = createAction(
  '[AppointmentTypes] Load By Specialization Success',
  props<{ appointmentTypes: AppointmentType[] }>()
);
export const loadAppointmentTypesBySpecializationFailure = createAction(
  '[AppointmentTypes] Load By Specialization Failure',
  props<{ error: string }>()
);

// Create
export const createAppointmentType = createAction(
  '[AppointmentTypes] Create AppointmentType',
  props<{ appointmentType: Partial<AppointmentType> }>()
);
export const createAppointmentTypeSuccess = createAction(
  '[AppointmentTypes] Create AppointmentType Success',
  props<{ appointmentType: AppointmentType }>()
);
export const createAppointmentTypeFailure = createAction(
  '[AppointmentTypes] Create AppointmentType Failure',
  props<{ error: string }>()
);

// Update
export const updateAppointmentType = createAction(
  '[AppointmentTypes] Update AppointmentType',
  props<{ id: string; changes: Partial<AppointmentType> }>()
);
export const updateAppointmentTypeSuccess = createAction(
  '[AppointmentTypes] Update AppointmentType Success',
  props<{ appointmentType: AppointmentType }>()
);
export const updateAppointmentTypeFailure = createAction(
  '[AppointmentTypes] Update AppointmentType Failure',
  props<{ error: string }>()
);

// Delete (soft delete)
export const deleteAppointmentType = createAction(
  '[AppointmentTypes] Delete AppointmentType',
  props<{ id: string }>()
);
export const deleteAppointmentTypeSuccess = createAction(
  '[AppointmentTypes] Delete AppointmentType Success',
  props<{ id: string }>()
);
export const deleteAppointmentTypeFailure = createAction(
  '[AppointmentTypes] Delete AppointmentType Failure',
  props<{ error: string }>()
);
